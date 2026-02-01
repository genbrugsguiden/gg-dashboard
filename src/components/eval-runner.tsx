'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { RUN_GOLDEN_EVAL } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';
import type { EvalRunModel, RunGoldenEvalInput } from '@/types/graphql';

interface EvalRunnerProps {
  onRunComplete?: (run: EvalRunModel) => void;
}

export function EvalRunner({ onRunComplete }: EvalRunnerProps) {
  const [stationId, setStationId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [goldenRequestIds, setGoldenRequestIds] = useState('');
  const [limit, setLimit] = useState('');
  const [model, setModel] = useState('');
  const [promptVersion, setPromptVersion] = useState('');

  const [runEval, { loading }] = useMutation<{ runGoldenEval: EvalRunModel }>(
    RUN_GOLDEN_EVAL,
    {
      onCompleted: (result) => {
        toast.success('Eval run completed');
        if (result.runGoldenEval) {
          onRunComplete?.(result.runGoldenEval);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to run eval');
      },
    },
  );

  const payload = useMemo<RunGoldenEvalInput>(() => {
    const ids = goldenRequestIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return {
      stationId: stationId.trim() || undefined,
      organizationId: organizationId.trim() || undefined,
      goldenRequestIds: ids.length ? ids : undefined,
      limit: limit ? Number(limit) : undefined,
      model: model.trim() || undefined,
      promptVersion: promptVersion.trim() || undefined,
    };
  }, [stationId, organizationId, goldenRequestIds, limit, model, promptVersion]);

  const handleRun = () => {
    runEval({ variables: { data: payload } });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Run Eval</h3>
          <p className="text-sm text-muted-foreground">
            Execute an eval run against published golden requests.
          </p>
        </div>
        <Button onClick={handleRun} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Eval
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stationId">Station ID</Label>
          <Input
            id="stationId"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizationId">Organization ID</Label>
          <Input
            id="organizationId"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goldenRequestIds">Golden Request IDs</Label>
          <Input
            id="goldenRequestIds"
            value={goldenRequestIds}
            onChange={(e) => setGoldenRequestIds(e.target.value)}
            placeholder="Comma-separated (optional)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="limit">Limit</Label>
          <Input
            id="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promptVersion">Prompt Version</Label>
          <Input
            id="promptVersion"
            value={promptVersion}
            onChange={(e) => setPromptVersion(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}
