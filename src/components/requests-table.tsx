'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@apollo/client/react';
import { GET_REQUESTS } from '@/lib/graphql/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, CheckCircle2, Circle, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import type {
  PaginatedRequests,
  RequestModel,
  RequestsFilterInput,
} from '@/types/graphql';

export function RequestsTable() {
  const router = useRouter();
  const [filters, setFilters] = useState<RequestsFilterInput>({});
  const [goldenFilter, setGoldenFilter] = useState<string>('all');

  const { data, loading, error } = useQuery<{
    requests: PaginatedRequests;
  }>(GET_REQUESTS, {
    variables: {
      filter: filters,
    },
    notifyOnNetworkStatusChange: true,
  });

  const requests = data?.requests.edges?.map((e) => e.node) || [];
  const totalCount = data?.requests.totalCount || 0;
  const filteredRequests =
    goldenFilter === 'all'
      ? requests
      : requests.filter((request) => {
          if (goldenFilter === 'draft') {
            return request.goldenStatus === 'DRAFT';
          }
          if (goldenFilter === 'published') {
            return request.goldenStatus === 'PUBLISHED';
          }
          if (goldenFilter === 'pending') {
            return !request.goldenStatus;
          }
          return true;
        });

  const handleGoldenFilterChange = (value: string) => {
    setGoldenFilter(value);
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
        {request.goldenStatus === 'DRAFT' ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="mr-1.5 h-3 w-3" />
            Draft
          </Badge>
        ) : request.goldenStatus !== 'PUBLISHED' ? (
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            <Circle className="mr-1.5 h-3 w-3" />
            Pending
          </Badge>
        ) : null}
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={goldenFilter} onValueChange={handleGoldenFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Golden</SelectItem>
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

        <span className="ml-auto text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {totalCount} requests
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 dark:border-zinc-800">
              <TableHead className="w-16">Preview</TableHead>
              <TableHead>Detected Items</TableHead>
              <TableHead className="w-40">Date</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-zinc-500"
                >
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  onClick={() => router.push(`/requests/${request.id}`)}
                >
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
