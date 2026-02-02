'use client';

import { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SUGGEST_ALIASES } from '@/lib/graphql/queries';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MasterItemPicker } from '@/components/master-item-picker';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Loader2,
  Sparkles,
  Link2,
  FilePlus,
  ChevronDown,
  ChevronRight,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type {
  RequestedItemModel,
  StationFractionModel,
  MasterItemAction,
  CuratedItemInput,
  AliasSuggestionsModel,
  MasterItemModel,
} from '@/types/graphql';

interface ItemEditorProps {
  item: RequestedItemModel;
  availableFractions: StationFractionModel[];
  organizationId: string;
  onChange: (changes: Partial<CuratedItemInput>) => void;
  initialValues?: Partial<CuratedItemInput>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDelete?: () => void;
  isManuallyAdded?: boolean;
  onDirty?: (itemId: string) => void;
}

export function ItemEditor({
  item,
  availableFractions,
  organizationId,
  onChange,
  initialValues,
  isExpanded = false,
  onToggleExpand,
  onDelete,
  isManuallyAdded = false,
  onDirty,
}: ItemEditorProps) {
  // Derive initial fraction from item's first suggested fraction or userFractionId
  const defaultFractionId =
    initialValues?.correctedFractionId ||
    item.userFractionId ||
    item.suggestedFractions?.[0]?.fractionId;

  const [selectedFractionId, setSelectedFractionId] = useState<number | undefined>(
    defaultFractionId
  );
  const [masterItemAction, setMasterItemAction] = useState<MasterItemAction>(
    initialValues?.masterItemAction || (item.itemId ? 'LINK_EXISTING' : 'CREATE_NEW')
  );
  const [selectedMasterItemId, setSelectedMasterItemId] = useState<string | undefined>(
    initialValues?.masterItemId || item.itemId
  );
  const [newMasterItemName, setNewMasterItemName] = useState<string>(
    initialValues?.newMasterItemName || item.detectedName
  );
  const [aliases, setAliases] = useState<string[]>(
    initialValues?.aliases || item.item?.aliases || []
  );
  const [aliasInput, setAliasInput] = useState('');

  const [suggestAliases, { data: aliasData, loading: aliasLoading }] = useLazyQuery<{
    suggestAliases: AliasSuggestionsModel;
  }>(SUGGEST_ALIASES);

  // On mount, if we're defaulting to CREATE_NEW for an unknown item,
  // emit the initial state so parent form captures it
  useEffect(() => {
    if (!initialValues && !item.itemId && selectedFractionId) {
      onChange({
        requestedItemId: item.id,
        correctedFractionId: selectedFractionId,
        masterItemAction: 'CREATE_NEW',
        newMasterItemName: item.detectedName,
        aliases: [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Helper to emit changes - called on user interactions only
  const emitChanges = (updates: {
    fractionId?: number;
    action?: MasterItemAction;
    masterId?: string;
    newName?: string;
    newAliases?: string[];
  }) => {
    const fractionId = updates.fractionId ?? selectedFractionId;
    const action = updates.action ?? masterItemAction;
    const masterId = updates.masterId ?? selectedMasterItemId;
    const newName = updates.newName ?? newMasterItemName;
    const newAliases = updates.newAliases ?? aliases;

    if (fractionId === undefined) return;

    onChange({
      requestedItemId: item.id,
      correctedFractionId: fractionId,
      masterItemAction: action,
      masterItemId: action === 'LINK_EXISTING' ? masterId : undefined,
      newMasterItemName: action === 'CREATE_NEW' ? newName : undefined,
      aliases: action !== 'NONE' ? newAliases : undefined,
    });
  };

  const handleFractionChange = (value: string) => {
    const fractionId = parseInt(value, 10);
    setSelectedFractionId(fractionId);
    emitChanges({ fractionId });
    onDirty?.(item.id);
  };

  const handleMasterItemActionChange = (value: string) => {
    const action = value as MasterItemAction;
    setMasterItemAction(action);
    if (value === 'NONE') {
      setSelectedMasterItemId(undefined);
      setNewMasterItemName('');
      setAliases([]);
    }
    emitChanges({ action });
    onDirty?.(item.id);
  };

  const handleMasterItemIdChange = (
    itemId: string | undefined,
    masterItem?: MasterItemModel
  ) => {
    setSelectedMasterItemId(itemId);
    // If a new item is selected and it has aliases, merge them with current aliases
    if (masterItem && masterItem.aliases.length > 0) {
      const mergedAliases = [...new Set([...aliases, ...masterItem.aliases])];
      setAliases(mergedAliases);
      emitChanges({ masterId: itemId, newAliases: mergedAliases });
    } else {
      emitChanges({ masterId: itemId });
    }
    onDirty?.(item.id);
  };

  const handleNewMasterItemNameChange = (value: string) => {
    setNewMasterItemName(value);
    emitChanges({ newName: value });
    onDirty?.(item.id);
  };

  const handleSuggestAliases = () => {
    const itemName = masterItemAction === 'CREATE_NEW' ? newMasterItemName : item.detectedName;
    if (itemName) {
      suggestAliases({
        variables: { itemName, organizationId },
      });
    }
  };

  const handleAddAlias = (alias: string) => {
    const trimmed = alias.trim().toLowerCase();
    if (trimmed && !aliases.includes(trimmed)) {
      const newAliases = [...aliases, trimmed];
      setAliases(newAliases);
      emitChanges({ newAliases });
      onDirty?.(item.id);
    }
    setAliasInput('');
  };

  const handleRemoveAlias = (alias: string) => {
    const newAliases = aliases.filter((a) => a !== alias);
    setAliases(newAliases);
    emitChanges({ newAliases });
    onDirty?.(item.id);
  };

  // Get source info from first suggested fraction
  const primarySuggestion = item.suggestedFractions?.[0];
  const isAiSuggested = primarySuggestion?.source === 'AI_SUGGESTED';

  // Get selected fraction details for summary
  const selectedFraction = availableFractions.find(
    (sf) => sf.fractionId === selectedFractionId
  );

  const aliasSuggestions = aliasData?.suggestAliases;

  // Handle header click to toggle expansion
  const handleHeaderClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  // Handle delete with stopPropagation to prevent expansion toggle
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
      {/* Compact Row Header - Single line with all info */}
      <div
        className={`flex items-center gap-3 px-4 py-2.5 ${onToggleExpand ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
        onClick={handleHeaderClick}
      >
        {/* Chevron */}
        {onToggleExpand && (
          <div className="text-muted-foreground shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}

        {/* Item name */}
        <span className="font-medium truncate">{item.detectedName}</span>

        {/* Fraction with color dot */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          {selectedFraction ? (
            <>
              {selectedFraction.fraction.category?.color && (
                <div
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: selectedFraction.fraction.category.color }}
                />
              )}
              <span className="truncate max-w-[120px]">{selectedFraction.fraction.name}</span>
              <span className="text-muted-foreground/70 hidden sm:inline">
                ({selectedFraction.fraction.category?.name})
              </span>
            </>
          ) : (
            <span className="italic">No fraction</span>
          )}
        </div>

        {/* Right side: badges + delete */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isManuallyAdded ? (
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs py-0.5"
            >
              <UserPlus className="mr-1 h-3 w-3" />
              Manual
            </Badge>
          ) : isAiSuggested ? (
            <Badge
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 text-xs py-0.5"
            >
              <Bot className="mr-1 h-3 w-3" />
              AI
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-success/30 bg-success/10 text-success text-xs py-0.5"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Known
            </Badge>
          )}
          {item.confidence && (
            <Badge variant="secondary" className="font-mono text-xs py-0.5">
              {Math.round(item.confidence * 100)}%
            </Badge>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content - Full editing form */}
      {isExpanded && (
        <CardContent className="space-y-5 py-5 border-t border-border/30">
          {/* Fraction Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fraction</Label>
            <Select
              value={selectedFractionId?.toString()}
              onValueChange={handleFractionChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select fraction" />
              </SelectTrigger>
              <SelectContent>
                {availableFractions.map((sf) => (
                  <SelectItem key={sf.fractionId} value={sf.fractionId.toString()}>
                    <div className="flex items-center gap-2.5">
                      {sf.fraction.category?.color && (
                        <div
                          className="h-3 w-3 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: sf.fraction.category.color }}
                        />
                      )}
                      <span className="font-medium">{sf.fraction.name}</span>
                      <span className="text-muted-foreground">
                        ({sf.fraction.category?.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* No matching item indicator */}
          {!item.itemId && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>No matching item found in database — creating new item</span>
            </div>
          )}

          {/* MasterItem Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Database Action</Label>
            <Select
              value={masterItemAction}
              onValueChange={handleMasterItemActionChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span>No action (skip)</span>
                  </div>
                </SelectItem>
                <SelectItem value="LINK_EXISTING">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <span>Link to existing item</span>
                  </div>
                </SelectItem>
                <SelectItem value="CREATE_NEW">
                  <div className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4 text-success" />
                    <span>Create new item</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Existing Item */}
          {masterItemAction === 'LINK_EXISTING' && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Label className="text-sm font-medium">Existing Item</Label>
              <MasterItemPicker
                organizationId={organizationId}
                value={selectedMasterItemId}
                onChange={handleMasterItemIdChange}
                placeholder="Search for an item..."
              />
              {item.item && !selectedMasterItemId && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Currently linked to: <span className="font-medium">{item.item.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Create New Item */}
          {masterItemAction === 'CREATE_NEW' && (
            <div className="space-y-2 rounded-lg border border-success/20 bg-success/5 p-4">
              <Label className="text-sm font-medium">New Item Name</Label>
              <Input
                value={newMasterItemName}
                onChange={(e) => handleNewMasterItemNameChange(e.target.value)}
                placeholder={item.detectedName}
                className="h-11"
              />
            </div>
          )}

          {/* Aliases */}
          {masterItemAction !== 'NONE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Aliases</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggestAliases}
                  disabled={aliasLoading}
                  className="gap-1.5 text-primary hover:text-primary"
                >
                  {aliasLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Suggest Aliases
                </Button>
              </div>

              {/* Current aliases */}
              {aliases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aliases.map((alias) => (
                    <Badge
                      key={alias}
                      variant="secondary"
                      className="gap-1.5 py-1 pl-2.5 pr-1.5"
                    >
                      {alias}
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias)}
                        className="rounded-full p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add alias input */}
              <div className="flex gap-2">
                <Input
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder="Add alias..."
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAlias(aliasInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAddAlias(aliasInput)}
                  className="h-10 w-10 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Alias suggestions */}
              {aliasSuggestions && (
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Suggestions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aliasSuggestions.suggestions
                      .filter((s) => !aliases.includes(s))
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer gap-1 transition-all hover:border-primary hover:bg-primary/10"
                          onClick={() => handleAddAlias(suggestion)}
                        >
                          <Plus className="h-3 w-3" />
                          {suggestion}
                        </Badge>
                      ))}
                  </div>

                  {/* Conflicts */}
                  {aliasSuggestions.conflicts.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-warning-foreground">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Conflicts
                      </div>
                      {aliasSuggestions.conflicts.map((conflict) => (
                        <div
                          key={conflict.alias}
                          className="text-sm text-muted-foreground"
                        >
                          <span className="font-medium">&quot;{conflict.alias}&quot;</span> already used by{' '}
                          <span className="font-medium">&quot;{conflict.existingItemName}&quot;</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </div>
  );
}
