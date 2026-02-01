'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_EVAL_RUNS } from '@/lib/graphql/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import type { EvalRunModel, EvalRunsFilterInput } from '@/types/graphql';

interface EvalRunListProps {
  onSelect: (runId: string) => void;
}

const statusStyles: Record<string, string> = {
  RUNNING: 'bg-warning/10 text-warning',
  COMPLETED: 'bg-success/10 text-success',
  FAILED: 'bg-destructive/10 text-destructive',
};

export function EvalRunList({ onSelect }: EvalRunListProps) {
  const [filter] = useState<EvalRunsFilterInput>({});
  const { data, loading, refetch } = useQuery<{ evalRuns: EvalRunModel[] }>(
    GET_EVAL_RUNS,
    {
      variables: { filter },
      fetchPolicy: 'cache-and-network',
    },
  );

  const runs = useMemo(() => data?.evalRuns ?? [], [data?.evalRuns]);

  return (
    <Card className="border-border/60 bg-card/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Recent Eval Runs</h3>
          <p className="text-sm text-muted-foreground">
            Latest evaluation results across golden requests.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading && runs.length === 0 ? (
        <div className="mt-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading eval runs...
        </div>
      ) : runs.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground">No eval runs yet.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelect(run.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/50 px-4 py-3 text-left transition hover:border-primary/40"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={statusStyles[run.status] ?? ''}>
                    {run.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Recall {formatPercent(run.itemRecall)} · Precision{' '}
                  {formatPercent(run.itemPrecision)} · Fraction{' '}
                  {formatPercent(run.fractionAccuracy)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {run.totalGoldenRequests ?? 0} requests
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return '--';
  return `${(value * 100).toFixed(2)}%`;
}
