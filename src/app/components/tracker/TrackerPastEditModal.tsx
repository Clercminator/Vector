import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

interface TrackerPastEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  isActive: boolean; // whether they currently have a check-in for this day
  color?: string;
  onSave: (date: Date, markActive: boolean) => Promise<void>;
}

export function TrackerPastEditModal({ isOpen, onClose, date, isActive, color, onSave }: TrackerPastEditModalProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markedActive, setMarkedActive] = useState(isActive);

  useEffect(() => {
    if (isOpen) {
      setMarkedActive(isActive);
    }
  }, [isOpen, isActive]);

  if (!isOpen || !date) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(date, markedActive);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Activity
              </h3>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 text-center">
              {dateStr}
            </p>

            <button
              onClick={() => setMarkedActive(!markedActive)}
              className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-bold text-lg mb-6 ${
                markedActive 
                  ? (color ? 'text-white border-transparent' : 'bg-blue-500 text-white border-blue-500') 
                  : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-gray-200'
              }`}
              style={markedActive && color ? { backgroundColor: color, borderColor: color } : undefined}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                markedActive ? 'border-white bg-transparent' : 'border-gray-300 dark:border-gray-500'
              }`}>
                {markedActive && <Check size={16} strokeWidth={3} className="text-white" />}
              </div>
              {markedActive ? "Completed" : "Mark as completed"}
            </button>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 relative"
            >
              {isSubmitting ? (
                 <div className="w-5 h-5 mx-auto border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
