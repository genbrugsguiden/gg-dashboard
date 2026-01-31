'use client';

import { useState, use, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REQUEST, GET_GOLDEN_BY_SOURCE } from '@/lib/graphql/queries';
import {
  CURATE_REQUEST,
  ADD_REQUESTED_ITEM,
  DELETE_REQUESTED_ITEM,
  PUBLISH_GOLDEN_FROM_REQUEST,
} from '@/lib/graphql/mutations';
import { RequestDetail } from '@/components/request-detail';
import { ItemEditor } from '@/components/item-editor';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, CheckCircle2, Sparkles, Plus, AlertTriangle } from 'lucide-react';
import type {
  RequestModel,
  CuratedItemInput,
  RequestedItemModel,
  GoldenRequestModel,
} from '@/types/graphql';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [curatedItems, setCuratedItems] = useState<Map<string, Partial<CuratedItemInput>>>(
    new Map()
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [manuallyAddedItems, setManuallyAddedItems] = useState<Set<string>>(new Set());
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'curated' | 'ai'>('ai');
  const [isCurating, setIsCurating] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  // Add item dialog state
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Golden request dialog state
  const [goldenDialogOpen, setGoldenDialogOpen] = useState(false);
  const [goldenTitle, setGoldenTitle] = useState('');
  const [goldenNotes, setGoldenNotes] = useState('');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RequestedItemModel | null>(null);

  const { data, loading, error, refetch } = useQuery<{ request: RequestModel }>(GET_REQUEST, {
    variables: { id: resolvedParams.id },
  });
  const { data: goldenData, refetch: refetchGolden } = useQuery(GET_GOLDEN_BY_SOURCE, {
    variables: { data: { sourceRequestId: resolvedParams.id } },
    fetchPolicy: 'cache-and-network',
  });


  const [curateRequest, { loading: saving }] = useMutation(CURATE_REQUEST, {
    onCompleted: () => {
      toast.success('Curation saved successfully');
      refetch();
      refetchGolden();
      setDirtyItems(new Set());
      setPendingDeleteIds(new Set());
      setIsCurating(false);
      setViewMode('curated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save curation');
    },
  });

  const [addRequestedItem, { loading: addingItem }] = useMutation<{
    addRequestedItem: RequestedItemModel;
  }>(ADD_REQUESTED_ITEM, {
    onCompleted: (data) => {
      toast.success(`Added "${data.addRequestedItem.detectedName}"`);
      setAddItemDialogOpen(false);
      setNewItemName('');
      // Track this item as manually added
      setManuallyAddedItems((prev) => new Set(prev).add(data.addRequestedItem.id));
      // Auto-expand the newly added item
      setExpandedItems((prev) => new Set(prev).add(data.addRequestedItem.id));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add item');
    },
  });

  const [deleteRequestedItem, { loading: deletingItem }] = useMutation(
    DELETE_REQUESTED_ITEM,
  );

  const [publishGoldenFromRequest, { loading: creatingGolden }] = useMutation<{
    publishGoldenFromRequest: GoldenRequestModel;
  }>(PUBLISH_GOLDEN_FROM_REQUEST, {
    onCompleted: (result) => {
      toast.success(
        `Golden request published${result.publishGoldenFromRequest.title ? `: ${result.publishGoldenFromRequest.title}` : ''}`
      );
      setGoldenDialogOpen(false);
      setGoldenTitle('');
      setGoldenNotes('');
      refetchGolden();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to publish golden request');
    },
  });

  // Get all fractions available at the station, sorted by category name
  const availableFractions = useMemo(() => {
    const request = data?.request;
    if (!request?.station?.fractions) return [];

    // Sort by category name, then by fraction name within each category
    return [...request.station.fractions].sort((a, b) => {
      const categoryA = a.fraction.category?.name || '';
      const categoryB = b.fraction.category?.name || '';
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      return a.fraction.name.localeCompare(b.fraction.name);
    });
  }, [data?.request]);

  const handleItemChange = (itemId: string, changes: Partial<CuratedItemInput>) => {
    setCuratedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, changes);
      return newMap;
    });
  };

  const handleItemDirty = (itemId: string) => {
    setDirtyItems((prev) => new Set(prev).add(itemId));
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    addRequestedItem({
      variables: {
        data: {
          requestId: resolvedParams.id,
          detectedName: newItemName.trim(),
        },
      },
    });
  };

  const handleDeleteClick = (item: RequestedItemModel) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
    setDirtyItems((prev) => new Set(prev).add(item.id));
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    setPendingDeleteIds((prev) => new Set(prev).add(itemToDelete.id));
    setDeleteDialogOpen(false);
    setItemToDelete(null);

    setCuratedItems((prev) => {
      const newMap = new Map(prev);
      newMap.delete(itemToDelete.id);
      return newMap;
    });
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemToDelete.id);
      return newSet;
    });
    setManuallyAddedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemToDelete.id);
      return newSet;
    });
  };

  const handleSaveCuration = async () => {
    const items = Array.from(curatedItems.values()).filter(
      (item): item is CuratedItemInput =>
        item.requestedItemId !== undefined &&
        item.correctedFractionId !== undefined &&
        !pendingDeleteIds.has(item.requestedItemId)
    );

    let itemsToSave = items;
    if (itemsToSave.length === 0 && pendingDeleteIds.size === 0) {
      if (request.isCurated) {
        toast.error('Please make at least one change before saving');
        return;
      }

      const inferred = visibleItems
        .map((item) => ({
          requestedItemId: item.id,
          correctedFractionId:
            item.userFractionId ?? item.suggestedFractions?.[0]?.fractionId,
        }))
        .filter(
          (item): item is CuratedItemInput =>
            item.correctedFractionId !== undefined,
        );

      if (inferred.length === 0) {
        toast.error('No fractions available to save');
        return;
      }

      itemsToSave = inferred;
    }

    try {
      if (pendingDeleteIds.size > 0) {
        await Promise.all(
          Array.from(pendingDeleteIds).map((id) =>
            deleteRequestedItem({ variables: { id } }),
          ),
        );
      }

      await curateRequest({
        variables: {
          data: {
            requestId: resolvedParams.id,
            curatedItems: itemsToSave,
          },
        },
      });

      setPendingDeleteIds(new Set());
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to save curation');
      } else {
        toast.error('Failed to save curation');
      }
    }
  };

  const handleResetDraft = () => {
    setCuratedItems(new Map());
    setDirtyItems(new Set());
    setPendingDeleteIds(new Set());
    setExpandedItems(new Set());
    setManuallyAddedItems(new Set());
    setAddItemDialogOpen(false);
    setNewItemName('');
  };

  useEffect(() => {
    if (viewMode !== 'ai' && isCurating) {
      setIsCurating(false);
    }
  }, [viewMode, isCurating]);

  const hasInitializedView = useRef(false);
  useEffect(() => {
    if (hasInitializedView.current) return;
    if (goldenData?.goldenRequestBySource && viewMode === 'ai') {
      setViewMode('curated');
    }
    hasInitializedView.current = true;
  }, [goldenData?.goldenRequestBySource, viewMode]);

  const handleCreateGolden = () => {
    if (!request.isCurated) {
      toast.error('Request must be curated before creating golden data');
      return;
    }

    const data: {
      requestId: string;
      title?: string;
      notes?: string;
    } = {
      requestId: resolvedParams.id,
    };

    if (goldenTitle.trim()) {
      data.title = goldenTitle.trim();
    }
    if (goldenNotes.trim()) {
      data.notes = goldenNotes.trim();
    }

    publishGoldenFromRequest({
      variables: { data },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading request...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.request) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <p className="font-medium">{error?.message || 'Request not found'}</p>
        </div>
      </div>
    );
  }

  const request = data.request;
  const items = request.requestedItems || [];
  const visibleItems = items.filter((item) => !pendingDeleteIds.has(item.id));
  const hasGolden = Boolean(goldenData?.goldenRequestBySource?.items?.length);
  const isEmptyState =
    viewMode === 'curated' ? !hasGolden : visibleItems.length === 0;

  // Get organizationId from the station
  const organizationId = request.station?.organizationId || '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>

        <div className="flex items-center gap-3">
          {!request.isCurated && dirtyItems.size > 0 && viewMode === 'ai' && isCurating && (
            <div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              Draft Changes
            </div>
          )}
          {viewMode === 'ai' && dirtyItems.size > 0 && isCurating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleResetDraft}
            >
              Reset Draft
            </Button>
          )}
          {viewMode === 'ai' && isCurating && (
            <Button
              onClick={handleSaveCuration}
              disabled={saving}
              className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Curation
            </Button>
          )}
          {viewMode === 'curated' && (
            <>
              {request.isCurated && (
                <Dialog open={goldenDialogOpen} onOpenChange={setGoldenDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Make Golden
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Make Golden Request</DialogTitle>
                      <DialogDescription>
                        Publish this curated request as a golden test case for AI evaluation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="goldenTitle">Title</Label>
                        <Input
                          id="goldenTitle"
                          value={goldenTitle}
                          onChange={(e) => setGoldenTitle(e.target.value)}
                          placeholder={`Golden - ${items[0]?.detectedName || 'Request'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goldenNotes">Notes</Label>
                        <Input
                          id="goldenNotes"
                          value={goldenNotes}
                          onChange={(e) => setGoldenNotes(e.target.value)}
                          placeholder="Optional notes for this golden case"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setGoldenDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateGolden}
                        disabled={creatingGolden}
                      >
                        {creatingGolden ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Publish Golden
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setViewMode('ai');
                setIsCurating(true);
              }}
            >
              Edit Curation
            </Button>
            </>
          )}
          {viewMode === 'ai' &&
            (!isCurating ? (
              request.isCurated ? (
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success badge-glow-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Already Curated
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCurating(true)}
                >
                  Curate
                </Button>
              )
            ) : null)}
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1 text-sm">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'curated' ? 'default' : 'ghost'}
              className={`h-8 px-3 ${!hasGolden ? 'opacity-50' : ''}`}
              onClick={() => {
                if (hasGolden) setViewMode('curated');
              }}
            >
              Golden
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'ai' ? 'default' : 'ghost'}
              className="h-8 px-3"
              onClick={() => setViewMode('ai')}
            >
              AI
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Request Details & Image */}
        <div className="animate-fade-in-up opacity-0">
          <RequestDetail request={request} />
        </div>

        {/* Right: Items to Curate / AI View */}
        <div className="animate-fade-in-up opacity-0 stagger-1">
          {/* Pinned header */}
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Detected Items</h3>
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'curated'
                    ? 'Golden request ground truth'
                    : isCurating
                      ? 'Review and correct the AI classifications below'
                      : 'AI suggestions captured at request time'}
                </p>
              </div>
            </div>

            {/* Add Item Button */}
            {viewMode === 'ai' && isCurating && (
              <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Item</DialogTitle>
                    <DialogDescription>
                      Add an item that the AI missed detecting in the image.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name</Label>
                      <Input
                        id="itemName"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Enter item name..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddItem();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddItemDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      disabled={addingItem || !newItemName.trim()}
                    >
                      {addingItem ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Scrollable items list */}
          <div className="space-y-6 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-2 pb-6">
            <Separator className="bg-border/50" />

            {isEmptyState ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-12 text-center">
              <p className="text-muted-foreground">
                {viewMode === 'curated'
                  ? 'No golden request available for this request'
                  : 'No items detected in this request'}
              </p>
              {viewMode === 'curated' && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Publish a golden request to view curated ground truth here.
                </div>
              )}
              {viewMode === 'ai' && isCurating && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => setAddItemDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add an item manually
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {viewMode === 'curated'
                ? goldenData?.goldenRequestBySource?.items?.map((item, index) => (
                    <div
                      key={item.id}
                      className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 2, 5)}`}
                    >
                      <div className="rounded-lg border border-border/50 bg-card px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{item.name}</div>
                          {item.fraction ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {item.fraction.category?.color && (
                                <div
                                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                                  style={{ backgroundColor: item.fraction.category.color }}
                                />
                              )}
                              <span>{item.fraction.name}</span>
                              {item.fraction.category?.name && (
                                <span className="text-muted-foreground/70">
                                  ({item.fraction.category.name})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              No curated fraction
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                : isCurating
                  ? visibleItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 2, 5)}`}
                      >
                        <ItemEditor
                          item={item}
                          availableFractions={availableFractions}
                          organizationId={organizationId}
                          onChange={(changes) => handleItemChange(item.id, changes)}
                          onDirty={handleItemDirty}
                          isExpanded={expandedItems.has(item.id)}
                          onToggleExpand={() => handleToggleExpand(item.id)}
                          onDelete={() => handleDeleteClick(item)}
                          isManuallyAdded={
                            manuallyAddedItems.has(item.id) ||
                            !item.suggestedFractions?.length
                          }
                        />
                      </div>
                    ))
                  : visibleItems.map((item, index) => {
                      const itemFraction = item.userFractionId
                        ? availableFractions.find((sf) => sf.fractionId === item.userFractionId)
                            ?.fraction
                        : item.suggestedFractions?.[0]?.stationFraction?.fraction;
                      return (
                        <div
                          key={item.id}
                          className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 2, 5)}`}
                        >
                          <div className="rounded-lg border border-border/50 bg-card px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium">{item.detectedName}</div>
                              {itemFraction ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {itemFraction.category?.color && (
                                    <div
                                      className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                                      style={{ backgroundColor: itemFraction.category.color }}
                                    />
                                  )}
                                  <span>{itemFraction.name}</span>
                                  {itemFraction.category?.name && (
                                    <span className="text-muted-foreground/70">
                                      ({itemFraction.category.name})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic">
                                  No fraction
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.detectedName}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingItem}
            >
              {deletingItem ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
