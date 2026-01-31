import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { frameworks, Framework } from '@/lib/frameworks';
// Import markdown content
import firstPrinciplesMd from '@/content/frameworks/first-principles.md?raw';
import paretoMd from '@/content/frameworks/pareto.md?raw';
import rpmMd from '@/content/frameworks/rpm.md?raw';
import eisenhowerMd from '@/content/frameworks/eisenhower.md?raw';
import okrMd from '@/content/frameworks/okr.md?raw';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Brain, Layers, Target, Rocket, Check, X as XIcon, Quote, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/app/components/language-provider';
import { trackEvent } from '@/lib/analytics';

const markdownMap: Record<string, string> = {
  'first-principles': firstPrinciplesMd,
  'pareto': paretoMd,
  'rpm': rpmMd,
  'eisenhower': eisenhowerMd,
  'okr': okrMd,
};

// Start of component
export function FrameworkPage() {
  const { id } = useParams<{ id: string }>();
  // ... existing hooks
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
      if (id) {
          trackEvent('framework_selected', { framework_id: id });
      }
  }, [id]);

  const frameworkBasic = frameworks.find(f => f.id === id);
  // We prioritize markdown content over frameworkContent.ts for the "longDescription" part, 
  // but we might still use frameworkContent.ts for structured steps/pros/cons if we didn't migrate them fully to MD blocks 
  // or if we want to keep using the UI components for them.
  // The plan implies replacing content with markdown. 
  // Let's use the markdown for the main "About" section.
  
  const markdownContent = id ? markdownMap[id] : '';

  // Extract frontmatter-like data if needed, or just render the whole body.
  // Since we have title/desc in frontmatter, we could parse it.
  // For now, let's just strip the frontmatter for display and use existing metadata for header.
  const contentBody = markdownContent.replace(/^---[\s\S]*?---/, '').trim();

  if (!frameworkBasic) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
           <div className="text-center">
             <h1 className="text-4xl font-bold mb-4">Framework Not Found</h1>
             <Button onClick={() => navigate('/')}>Go Home</Button>
           </div>
        </div>
     );
  }

  // Combine data
  const fw = {
     ...frameworkBasic,
     // title: t(...) || frameworkBasic.title, // keep existing logic
     title: t(`fw.${frameworkBasic.id}.title`) || frameworkBasic.title,
     description: t(`fw.${frameworkBasic.id}.desc`) || frameworkBasic.description,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <Helmet>
        <title>{fw.title} - Vector Framework Guide</title>
        <meta name="description" content={fw.longDescription || fw.description} />
        <meta property="og:title" content={`${fw.title} | Vector`} />
        <meta property="og:description" content={fw.longDescription || fw.description} />
        <meta name="keywords" content={`productivity, framework, ${fw.title}, ${fw.author}, guide`} />
      </Helmet>

      {/* Header */}
      <div className="relative h-[40vh] min-h-[400px] overflow-hidden flex items-end pb-12" style={{ backgroundColor: fw.color }}>
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="container max-w-4xl mx-auto px-6 relative z-10 text-white">
             <Button 
                variant="ghost" 
                className="mb-8 text-white hover:bg-white/20 hover:text-white -ml-4"
                onClick={() => navigate('/')}
             >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
             </Button>

             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
             >
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                      <fw.icon size={32} className="text-white" />
                   </div>
                   <div className="text-sm font-medium opacity-90 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                      {fw.author}
                   </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">{fw.title}</h1>
                <p className="text-xl opacity-90 max-w-2xl leading-relaxed">{fw.definition}</p>
             </motion.div>
          </div>
      </div>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-6 py-12">
         <div className="grid md:grid-cols-[2fr_1fr] gap-12">
            
            {/* Main Column */}
            <div className="space-y-12">
               
               <article className="prose prose-lg dark:prose-invert max-w-none">
                   <ReactMarkdown>{contentBody}</ReactMarkdown>
               </article>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                
                {/* CTA Card */}
                <div className="bg-white dark:bg-zinc-900 shadow-xl shadow-gray-200/50 dark:shadow-black/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 sticky top-24">
                    <h3 className="text-xl font-bold mb-2">Ready to use this?</h3>
                    <p className="text-sm text-gray-500 mb-6">Start building your blueprint using the {fw.title} framework now.</p>
                    
                    <Button 
                        size="lg" 
                        className="w-full font-bold h-12 text-md shadow-lg shadow-blue-500/20"
                        onClick={() => navigate('/wizard', { state: { framework: fw.id } })} // Assuming wizard can take state or we update context
                    >
                        Start Blueprint <Rocket className="ml-2 w-4 h-4" />
                    </Button>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                             <Quote size={14} /> Example Use Case
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                            "{fw.example}"
                        </p>
                    </div>

                    {fw.whoItIsFor && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                             <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                 <User size={14} /> Who is this for?
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {fw.whoItIsFor}
                            </p>
                        </div>
                    )}
                </div>

            </div>

         </div>
      </main>
    </div>
  );
}
