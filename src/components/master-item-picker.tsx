'use client';

import { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_MASTER_ITEMS } from '@/lib/graphql/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MasterItemModel } from '@/types/graphql';

interface MasterItemPickerProps {
  organizationId: string;
  value?: string;
  onChange: (itemId: string | undefined, item?: MasterItemModel) => void;
  placeholder?: string;
}

function getSelectedItem(
  value: string | undefined,
  manuallySelectedItem: MasterItemModel | undefined,
  masterItems: MasterItemModel[] | undefined
): MasterItemModel | undefined {
  if (manuallySelectedItem && manuallySelectedItem.id === value) {
    return manuallySelectedItem;
  }
  if (value && masterItems) {
    return masterItems.find((i) => i.id === value);
  }
  return undefined;
}

export function MasterItemPicker({
  organizationId,
  value,
  onChange,
  placeholder = 'Select an item...',
}: MasterItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Track manually selected item (from user interaction)
  const [manuallySelectedItem, setManuallySelectedItem] = useState<MasterItemModel | undefined>();

  const [fetchMasterItems, { data, loading }] = useLazyQuery<{
    masterItems: MasterItemModel[];
  }>(GET_MASTER_ITEMS, {
    fetchPolicy: 'cache-and-network',
  });

  // Fetch items when popover opens or search query changes
  useEffect(() => {
    if (open) {
      fetchMasterItems({
        variables: {
          organizationId,
          query: searchQuery || undefined,
        },
      });
    }
  }, [open, searchQuery, organizationId, fetchMasterItems]);

  const items = data?.masterItems ?? [];
  const selectedItem = getSelectedItem(value, manuallySelectedItem, data?.masterItems);

  const handleSelect = (item: MasterItemModel) => {
    const isDeselecting = value === item.id;
    setManuallySelectedItem(isDeselecting ? undefined : item);
    onChange(isDeselecting ? undefined : item.id, isDeselecting ? undefined : item);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedItem.name}</span>
              {selectedItem.aliases.length > 0 && (
                <span className="text-xs text-zinc-400">
                  ({selectedItem.aliases.length} aliases)
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search items..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty>No items found.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex flex-col items-start gap-1 py-2"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === item.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </div>
                    {item.aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.aliases.slice(0, 3).map((alias) => (
                          <Badge
                            key={alias}
                            variant="secondary"
                            className="text-xs"
                          >
                            {alias}
                          </Badge>
                        ))}
                        {item.aliases.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.aliases.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
