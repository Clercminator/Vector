import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';
import { WizardResult } from '@/app/components/wizard/WizardResult';
import { Button } from '@/app/components/ui/button';

interface AdminBlueprintViewerProps {
  blueprintId: string | null;
  blueprintTitle?: string;
  onClose: () => void;
}

/** Admin-only: view full blueprint content and visualization */
export function AdminBlueprintViewer({ blueprintId, blueprintTitle, onClose }: AdminBlueprintViewerProps) {
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<{ id: string; title: string; framework: string; result: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blueprintId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('blueprints')
      .select('id, title, framework, result')
      .eq('id', blueprintId)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setBlueprint(null);
        } else {
          setBlueprint(data as any);
        }
        setLoading(false);
      });
  }, [blueprintId]);

  const noop = (_path: (string | number)[], _value: any) => {};

  return (
    <Dialog open={!!blueprintId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 dark:bg-zinc-950 dark:border-zinc-800 flex flex-col">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-zinc-800 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {blueprint?.title || blueprintTitle || 'View Plan'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-gray-400" size={40} />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : blueprint?.result ? (
            <WizardResult
              result={blueprint.result}
              updateResult={noop}
              onBack={onClose}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">No plan content available.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
