'use client';

import { Suspense } from 'react';
import { RequestsTable } from '@/components/requests-table';

function RequestsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-9 w-32 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
      <div className="rounded-lg border">
        <div className="h-12 border-b bg-zinc-100" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b animate-pulse bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Requests</h2>
        <p className="text-zinc-500">
          Review and curate AI-generated item classifications
        </p>
      </div>

      <Suspense fallback={<RequestsTableSkeleton />}>
        <RequestsTable />
      </Suspense>
    </div>
  );
}
