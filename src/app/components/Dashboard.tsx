import React, { useState } from "react";
import { Blueprint } from "@/lib/blueprints";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Trash2, ArrowRight, Rocket } from "lucide-react";

import { useLanguage } from '@/app/components/language-provider';

// ... other imports

export function Dashboard({
  blueprints,
  loading,
  onOpenBlueprint,
  onDeleteBlueprint,
  onStartWizard,
  onPublishBlueprint,
}: {
  blueprints: Blueprint[];
  loading?: boolean;
  onOpenBlueprint: (bp: Blueprint) => void;
  onDeleteBlueprint: (id: string) => void;
  onStartWizard?: () => void;
  onPublishBlueprint?: (bp: Blueprint) => void;
}) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const blueprintToDelete = blueprints.find((bp) => bp.id === deleteId);

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteBlueprint(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-black dark:text-white">{t('dashboard.title')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {loading ? (
         <div className="rounded-3xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mx-auto" />
            <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-48 mx-auto mt-6" />
          </div>
        </div>
      ) : blueprints.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('dashboard.empty')}</p>
          {onStartWizard && (
            <Button onClick={onStartWizard} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
              <Rocket size={18} />
              {t('dashboard.start')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blueprints.map((bp) => (
            <Card key={bp.id} className="p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-zinc-500 mb-2">
                    {bp.framework}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{bp.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
                    {t('dashboard.created')} {new Date(bp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {onPublishBlueprint && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPublishBlueprint(bp)}
                      aria-label="Publish template"
                      className="dark:text-white dark:hover:bg-zinc-800 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:text-blue-400"
                    >
                      <Rocket className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(bp.id)}
                    aria-label="Delete blueprint"
                    className="dark:text-white dark:hover:bg-zinc-800 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="flex-1 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700" onClick={() => onOpenBlueprint(bp)}>
                  {t('dashboard.open')} <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">{t('dashboard.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-zinc-400">
              {t('dashboard.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700">{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700">
              {t('dashboard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

