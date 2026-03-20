import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckSquare, Square, Download, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Blueprint } from '@/lib/blueprints';
import { generatePdf, PdfBranding } from '@/lib/pdfExport';
import { trackEvent } from '@/lib/analytics';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface BulkExportModalProps {
  blueprints: Blueprint[];
  onClose: () => void;
  branding?: PdfBranding;
}

export function BulkExportModal({ blueprints, onClose, branding }: BulkExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === blueprints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(blueprints.map(b => b.id)));
    }
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    const toastId = toast.loading("Generating PDFs...");

    try {
      const zip = new JSZip();
      const folder = zip.folder("vector-blueprints");

      const selectedBlueprints = blueprints.filter(b => selectedIds.has(b.id));

      for (const bp of selectedBlueprints) {
        const doc = await generatePdf(bp, branding);
        const pdfBlob = doc.output('blob');
        const filename = `${bp.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        folder?.file(filename, pdfBlob);
      }

      toast.loading("Zipping files...", { id: toastId });
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "vector-blueprints.zip");
      
      trackEvent('export_pdf', { bulk: true, count: selectedBlueprints.length });
      toast.success(`Exported ${selectedBlueprints.length} blueprints!`, { id: toastId });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Export failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold dark:text-white">Bulk Export</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select blueprints to download</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full dark:text-white">
                <X size={20} />
            </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <button 
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
            >
                {selectedIds.size === blueprints.length ? <CheckSquare size={18} /> : <Square size={18} />}
                Select All ({blueprints.length})
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedIds.size} selected
            </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {blueprints.map(bp => (
                <div 
                    key={bp.id} 
                    onClick={() => toggleSelect(bp.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedIds.has(bp.id) 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                            : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                >
                    <div className={selectedIds.has(bp.id) ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}>
                        {selectedIds.has(bp.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{bp.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(bp.createdAt).toLocaleDateString()} • {bp.framework}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 bg-white dark:bg-zinc-900 rounded-b-2xl">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button 
                onClick={handleExport} 
                className="bg-black dark:bg-white text-white dark:text-black"
                disabled={loading || selectedIds.size === 0}
            >
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download className="mr-2" size={18} />}
                Export ZIP
            </Button>
        </div>
      </motion.div>
    </div>
  );
}
