'use client';

import { useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REQUEST } from '@/lib/graphql/queries';
import { CURATE_REQUEST, ADD_REQUESTED_ITEM, DELETE_REQUESTED_ITEM } from '@/lib/graphql/mutations';
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
import { ArrowLeft, Save, Loader2, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import type {
  RequestModel,
  CuratedItemInput,
  RequestedItemModel,
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

  // Add item dialog state
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RequestedItemModel | null>(null);

  const { data, loading, error, refetch } = useQuery<{ request: RequestModel }>(GET_REQUEST, {
    variables: { id: resolvedParams.id },
  });

  const [curateRequest, { loading: saving }] = useMutation(CURATE_REQUEST, {
    onCompleted: () => {
      toast.success('Curation saved successfully');
      router.push('/requests');
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

  const [deleteRequestedItem, { loading: deletingItem }] = useMutation(DELETE_REQUESTED_ITEM, {
    onCompleted: () => {
      toast.success(`Deleted "${itemToDelete?.detectedName}"`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      // Remove from curatedItems and expandedItems
      if (itemToDelete) {
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
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete item');
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
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteRequestedItem({
        variables: { id: itemToDelete.id },
      });
    }
  };

  const handleSaveCuration = () => {
    const items = Array.from(curatedItems.values()).filter(
      (item): item is CuratedItemInput =>
        item.requestedItemId !== undefined && item.correctedFractionId !== undefined
    );

    if (items.length === 0) {
      toast.error('Please make at least one change before saving');
      return;
    }

    curateRequest({
      variables: {
        data: {
          requestId: resolvedParams.id,
          curatedItems: items,
        },
      },
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
          {request.isCurated && (
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success badge-glow-success">
              <CheckCircle2 className="h-4 w-4" />
              Already Curated
            </div>
          )}
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
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Request Details & Image */}
        <div className="animate-fade-in-up opacity-0">
          <RequestDetail request={request} />
        </div>

        {/* Right: Items to Curate */}
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
                  Review and correct the AI classifications below
                </p>
              </div>
            </div>

            {/* Add Item Button */}
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
          </div>

          {/* Scrollable items list */}
          <div className="space-y-6 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-2 pb-6">
            <Separator className="bg-border/50" />

            {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-12 text-center">
              <p className="text-muted-foreground">No items detected in this request</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setAddItemDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add an item manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 2, 5)}`}
                >
                  <ItemEditor
                    item={item}
                    availableFractions={availableFractions}
                    organizationId={organizationId}
                    onChange={(changes) => handleItemChange(item.id, changes)}
                    isExpanded={expandedItems.has(item.id)}
                    onToggleExpand={() => handleToggleExpand(item.id)}
                    onDelete={() => handleDeleteClick(item)}
                    isManuallyAdded={manuallyAddedItems.has(item.id) || !item.suggestedFractions?.length}
                  />
                </div>
              ))}
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
