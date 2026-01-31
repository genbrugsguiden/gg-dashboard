'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REQUESTS } from '@/lib/graphql/queries';
import { MARK_REQUEST_CURATED } from '@/lib/graphql/mutations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronRight, CheckCircle2, Circle, Loader2, ImageIcon, Sparkles } from 'lucide-react';
import type {
  PaginatedRequests,
  RequestModel,
  RequestsFilterInput,
} from '@/types/graphql';

export function RequestsTable() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<RequestsFilterInput>({});
  const [curatedFilter, setCuratedFilter] = useState<string>('all');

  const { data, loading, error, refetch } = useQuery<{
    requests: PaginatedRequests;
  }>(GET_REQUESTS, {
    variables: {
      filter: filters,
    },
    notifyOnNetworkStatusChange: true,
  });

  const [markCurated, { loading: markingCurated }] = useMutation(
    MARK_REQUEST_CURATED,
    {
      onCompleted: () => {
        toast.success('Request marked as curated');
        setSelectedIds(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to mark as curated');
      },
    }
  );

  const requests = data?.requests.edges?.map((e) => e.node) || [];
  const totalCount = data?.requests.totalCount || 0;

  const handleCuratedFilterChange = (value: string) => {
    setCuratedFilter(value);
    const newFilters = { ...filters };
    if (value === 'curated') {
      newFilters.isCurated = true;
    } else if (value === 'pending') {
      newFilters.isCurated = false;
    } else {
      delete newFilters.isCurated;
    }
    setFilters(newFilters);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkMarkCurated = async () => {
    for (const id of selectedIds) {
      await markCurated({ variables: { requestId: id } });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (request: RequestModel) => {
    return (
      <div className="flex flex-col gap-1.5">
        {request.goldenStatus === 'PUBLISHED' && (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Golden
          </Badge>
        )}
        {request.isCurated ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="mr-1.5 h-3 w-3" />
            Curated
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            <Circle className="mr-1.5 h-3 w-3" />
            Pending
          </Badge>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        Error loading requests: {error.message}
      </div>
    );
  }

  const allSelected = requests.length > 0 && selectedIds.size === requests.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < requests.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={curatedFilter} onValueChange={handleCuratedFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="curated">Curated</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="From date"
          className="w-40"
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              createdAtFrom: e.target.value || undefined,
            }))
          }
        />
        <Input
          type="date"
          placeholder="To date"
          className="w-40"
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              createdAtTo: e.target.value || undefined,
            }))
          }
        />

        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            onClick={handleBulkMarkCurated}
            disabled={markingCurated}
          >
            {markingCurated ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Mark {selectedIds.size} as Curated
          </Button>
        )}

        <span className="ml-auto text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {totalCount} requests
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 dark:border-zinc-800">
              <TableHead className="w-12">
                <Checkbox
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">Preview</TableHead>
              <TableHead>Detected Items</TableHead>
              <TableHead className="w-40">Date</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-zinc-500"
                >
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  onClick={() => router.push(`/requests/${request.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(request.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(request.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                      {request.imageURL ? (
                        <Image
                          src={request.imageURL}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {request.requestedItems?.slice(0, 3).map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {item.detectedName}
                        </Badge>
                      ))}
                      {(request.requestedItems?.length || 0) > 3 && (
                        <Badge
                          variant="outline"
                          className="border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
                        >
                          +{request.requestedItems!.length - 3}
                        </Badge>
                      )}
                      {(!request.requestedItems || request.requestedItems.length === 0) && (
                        <span className="text-sm text-zinc-400">No items detected</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(request)}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
