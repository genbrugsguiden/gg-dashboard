'use client';

import { useState } from 'react';
import { EvalRunner } from '@/components/eval-runner';
import { EvalRunList } from '@/components/eval-run-list';
import { EvalRunDetail } from '@/components/eval-run-detail';

export default function EvalsPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Evals</h2>
        <p className="text-muted-foreground">
          Run AI evaluations against golden requests and review results.
        </p>
      </div>

      <EvalRunner onRunComplete={(run) => setSelectedRunId(run.id)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EvalRunList onSelect={setSelectedRunId} />
        <EvalRunDetail runId={selectedRunId} />
      </div>
    </div>
  );
}
