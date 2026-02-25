import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MotivationalContent } from '@/lib/blueprints';
import { Quote, Sparkles } from 'lucide-react';

interface TrackerMotivationProps {
  className?: string;
}

export function TrackerMotivation({ className = '' }: TrackerMotivationProps) {
  const [content, setContent] = useState<MotivationalContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomContent();
  }, []);

  const fetchRandomContent = async () => {
    if (!supabase) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motivational_content')
        .select('*')
        .limit(100);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setContent(data[randomIndex] as MotivationalContent);
      }
    } catch (e) {
      console.error("Failed to fetch motivational content", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !content) {
    return null;
  }

  const isQuote = content.content_type === 'quote';

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6 md:p-8 ${className}`}>
      <div className="absolute -top-6 -left-6 text-indigo-200 dark:text-indigo-800/30">
         <Quote size={80} className="transform -rotate-180" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        {isQuote ? (
             <Quote size={24} className="text-indigo-400 mb-4" />
        ) : (
             <Sparkles size={24} className="text-purple-400 mb-4" />
        )}
        
        <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 mb-4 italic leading-relaxed">
          "{content.text}"
        </p>
        
        {content.author && (
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            — {content.author}
          </p>
        )}
      </div>
    </div>
  );
}
