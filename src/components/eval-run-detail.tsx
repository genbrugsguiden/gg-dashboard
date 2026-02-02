'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { GET_EVAL_RUN, GET_REQUEST } from '@/lib/graphql/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { EvalItemModel, EvalRunModel, RequestModel } from '@/types/graphql';

interface EvalRunDetailProps {
  runId?: string;
}

export function EvalRunDetail({ runId }: EvalRunDetailProps) {
  const { data, loading } = useQuery<{ evalRun: EvalRunModel }>(GET_EVAL_RUN, {
    variables: { id: runId },
    skip: !runId,
  });

  const run = data?.evalRun;
  const durations = useMemo(() => {
    const items = run?.items;
    if (!items?.length) return [];
    return items
      .map((item) => item.durationMs)
      .filter((value): value is number => typeof value === 'number');
  }, [run?.items]);

  const averageDuration = useMemo(() => {
    if (durations.length === 0) return null;
    const total = durations.reduce((sum, value) => sum + value, 0);
    return total / durations.length;
  }, [durations]);

  const p95Duration = useMemo(() => {
    if (durations.length === 0) return null;
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(index, 0)];
  }, [durations]);

  if (!runId) {
    return (
      <Card className="border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
        Select an eval run to view details.
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading eval run...
        </div>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card className="border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
        Eval run not found.
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/60 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Eval Run</h3>
          <p className="text-xs text-muted-foreground">{run.id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {run.model && <span>Model: {run.model}</span>}
            {run.promptVersion && <span>Prompt: {run.promptVersion}</span>}
            {run.completedAt && (
              <span>Completed: {new Date(run.completedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
        <Badge className="text-xs">{run.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/40 bg-background/50 p-4">
          <div className="text-xs text-muted-foreground">Item Recall</div>
          <div className="mt-1 text-2xl font-semibold">
            {formatPercent(run.itemRecall)}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-4">
          <div className="text-xs text-muted-foreground">Item Precision</div>
          <div className="mt-1 text-2xl font-semibold">
            {formatPercent(run.itemPrecision)}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-4">
          <div className="text-xs text-muted-foreground">Fraction Accuracy</div>
          <div className="mt-1 text-2xl font-semibold">
            {formatPercent(run.fractionAccuracy)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Golden Requests</div>
          <div className="text-base font-semibold text-foreground">
            {run.totalGoldenRequests ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Golden Items</div>
          <div className="text-base font-semibold text-foreground">
            {run.totalGoldenItems ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Predicted Items</div>
          <div className="text-base font-semibold text-foreground">
            {run.totalPredictedItems ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Matched Items</div>
          <div className="text-base font-semibold text-foreground">
            {run.matchedItems ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Fraction Correct</div>
          <div className="text-base font-semibold text-foreground">
            {run.fractionCorrect ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Run Duration</div>
          <div className="text-base font-semibold text-foreground">
            {formatDuration(run.durationMs)}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">Avg Response</div>
          <div className="text-base font-semibold text-foreground">
            {formatDuration(averageDuration)}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="text-xs">P95 Response</div>
          <div className="text-base font-semibold text-foreground">
            {formatDuration(p95Duration)}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4 space-y-4">
        {run.items?.map((item, index) => (
          <EvalItemCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </Card>
  );
}

function EvalItemCard({ item, index }: { item: EvalItemModel; index: number }) {
  const { data } = useQuery<{ request: RequestModel }>(GET_REQUEST, {
    variables: { id: item.sourceRequestId },
    skip: !item.sourceRequestId,
  });

  const fractionMap = useMemo(() => {
    const fractions = data?.request?.station?.fractions ?? [];
    const map = new Map<number, string>();
    fractions.forEach((stationFraction) => {
      map.set(stationFraction.fractionId, stationFraction.fraction?.name ?? '');
    });
    return map;
  }, [data?.request?.station?.fractions]);

  const formatFraction = (fractionId?: number | null) => {
    if (!fractionId && fractionId !== 0) return '--';
    const name = fractionMap.get(fractionId);
    return name ? `${name} · ${fractionId}` : `${fractionId}`;
  };

  const requestStatusStyle = getRequestStatusStyle(item);

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Golden Request #{index + 1}</span>
          {item.sourceRequestId && (
            <Button asChild variant="secondary" size="sm" className="h-7 px-3">
              <Link href={`/requests/${item.sourceRequestId}?view=golden`}>
                Open request
              </Link>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${requestStatusStyle}`}>
            {item.matchedItems ?? 0}/{item.totalGoldenItems ?? 0} matched
          </span>
          <span className="rounded-full border border-border/40 bg-background/80 px-2 py-0.5 text-muted-foreground">
            {item.totalPredictedItems ?? 0} predicted
          </span>
          <span className="text-muted-foreground">
            Recall {formatPercent(item.itemRecall)} · Precision{' '}
            {formatPercent(item.itemPrecision)} · Fraction{' '}
            {formatPercent(item.fractionAccuracy)}
          </span>
        </div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Response time: {formatDuration(item.durationMs)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground">Predictions</div>
            <span className="text-[11px] text-muted-foreground">
              {item.predictions?.length ?? 0} items
            </span>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {item.predictions?.map((pred) => (
              <li
                key={pred.id}
                className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 ${getPredictionStyle(
                  pred,
                )}`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{pred.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {pred.matchType}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-border/40 bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
                  {formatFraction(pred.fractionId)}
                </span>
              </li>
            ))}
            {item.predictions?.length === 0 && (
              <li className="rounded-md border border-dashed border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                No predictions returned.
              </li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground">Ground Truth</div>
            <span className="text-[11px] text-muted-foreground">
              {item.truths?.length ?? 0} items
            </span>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {item.truths?.map((truth) => (
              <li
                key={truth.id}
                className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-background/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{truth.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Expected
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-border/40 bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
                  {formatFraction(truth.fractionId)}
                </span>
              </li>
            ))}
            {item.truths?.length === 0 && (
              <li className="rounded-md border border-dashed border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                No ground truth items.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return '--';
  return `${(value * 100).toFixed(2)}%`;
}

function formatDuration(value?: number | null) {
  if (value === null || value === undefined) return '--';
  return `${Math.round(value)} ms`;
}

function getPredictionStyle(pred: EvalItemModel['predictions'][number]) {
  if (!pred) return 'border-border/40 bg-background/60';
  if (pred.matchType === 'NONE') {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }
  if (pred.fractionCorrect) {
    return 'border-success/30 bg-success/10 text-success';
  }
  return 'border-warning/30 bg-warning/10 text-warning';
}

function getRequestStatusStyle(item: EvalItemModel) {
  const recall = item.itemRecall ?? 0;
  if (recall >= 0.8) {
    return 'bg-success/10 text-success';
  }
  if (recall >= 0.4) {
    return 'bg-warning/10 text-warning';
  }
  return 'bg-destructive/10 text-destructive';
}
