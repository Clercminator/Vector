import React from 'react';
import { motion } from 'motion/react';
import { Zap, Layers, Clock, Share2, Rocket, Target, Lock, Star } from 'lucide-react';
import { EditableText, EditableList } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useNavigate } from 'react-router-dom';

interface WizardResultProps {
  result: any;
  updateResult: (path: string[], value: any) => void;
  onBack: () => void;
}

export const WizardResult: React.FC<WizardResultProps> = ({ result, updateResult, onBack }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    if (!result) return null;

    // ... overlay helper ...
    const renderUpgradeOverlay = () => (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-[2.5rem]">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg rotate-3 hover:rotate-6 transition-transform">
            <Lock size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Unlock Full Blueprint</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            You've generated a <strong>Teaser Preview</strong>. Upgrade to the <strong>Standard Plan</strong> to reveal the full detailed strategy.
          </p>
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
          >
            <Zap size={20} className="fill-current" />
            Upgrade Now
          </button>
          <button 
             onClick={onBack}
             className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            No thanks, take me back
          </button>
        </div>
      </div>
    );

    const isTeaser = (result as any).isTeaser;

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
       <div className="relative w-full">
           <div className={isTeaser ? "blur-sm select-none pointer-events-none opacity-50 transition-all duration-700" : ""}>
               {children}
           </div>
           {isTeaser && renderUpgradeOverlay()}
       </div>
    );

    if (result.type === 'pareto') {
      return (
        <Wrapper>
        <div className="mt-8 grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="flex items-center gap-3 mb-6 text-blue-600 dark:text-blue-400">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap size={24} />
              </div>
              <h4 className="font-bold text-xl uppercase tracking-wider">{t('pareto.vital')}</h4>
            </div>
            
            <EditableList 
              items={result.vital || []} 
              onChange={(val) => updateResult(['vital'], val)}
              itemClassName="text-gray-800 dark:text-gray-100 font-medium text-lg leading-snug"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-50/50 dark:bg-zinc-800/30 backdrop-blur-lg border border-gray-200 dark:border-zinc-700 rounded-3xl p-8 shadow-lg"
          >
             <div className="flex items-center gap-3 mb-6 text-gray-500 dark:text-gray-400 opacity-80">
              <div className="p-2 bg-gray-200 dark:bg-zinc-700/50 rounded-lg">
                <Layers size={24} />
              </div>
              <h4 className="font-bold text-xl uppercase tracking-wider">{t('pareto.trivial')}</h4>
            </div>
             <EditableList 
              items={result.trivial || []} 
              onChange={(val) => updateResult(['trivial'], val)}
              itemClassName="text-base text-gray-600 dark:text-gray-400"
            />
          </motion.div>
        </div>
        </Wrapper>
      );
    }

    if (result.type === 'eisenhower') {
      return (
        <Wrapper>
        <div className="mt-8 w-full max-w-5xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl">
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl relative overflow-hidden">
               <div className="absolute top-4 right-4 text-red-200 dark:text-red-900/40 opacity-50 font-black text-6xl pointer-events-none">1</div>
              <h4 className="text-red-600 dark:text-red-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"><Zap size={16} /></span> 
                {t('eisenhower.do')}
              </h4>
              <EditableList 
                  items={result.q1 || []} 
                  onChange={(val) => updateResult(['q1'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-base font-semibold dark:text-gray-100 border-l-4 border-red-500"
              />
            </div>
            
            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-blue-200 dark:text-blue-900/40 opacity-50 font-black text-6xl pointer-events-none">2</div>
              <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Clock size={16} /></span> 
                {t('eisenhower.schedule')}
              </h4>
               <EditableList 
                  items={result.q2 || []} 
                  onChange={(val) => updateResult(['q2'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-base font-medium dark:text-gray-200 border-l-4 border-blue-500"
              />
            </div>
            
            <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-amber-200 dark:text-amber-900/40 opacity-50 font-black text-6xl pointer-events-none">3</div>
              <h4 className="text-amber-600 dark:text-amber-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                 <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"><Share2 size={16} /></span>
                 {t('eisenhower.delegate')}
              </h4>
              <EditableList 
                  items={result.q3 || []} 
                  onChange={(val) => updateResult(['q3'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-sm font-medium dark:text-gray-300 opacity-90"
              />
            </div>
            
            <div className="bg-gray-100/80 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-gray-200 dark:text-zinc-700 opacity-50 font-black text-6xl pointer-events-none">4</div>
              <h4 className="text-gray-500 dark:text-gray-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                 <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center"><Layers size={16} /></span>
                 {t('eisenhower.eliminate')}
              </h4>
               <EditableList 
                  items={result.q4 || []} 
                  onChange={(val) => updateResult(['q4'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-sm font-medium opacity-50 line-through dark:text-gray-500"
              />
            </div>
          </div>
        </div>
        </Wrapper>
      );
    }

    if (result.type === 'okr') {
      return (
        <Wrapper>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden relative"
        >
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600" />
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-10 text-center border-b border-purple-100 dark:border-purple-900/20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('okr.northStar')}</span>
            <div className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                <EditableText 
                    value={result.objective} 
                    onChange={(val) => updateResult(['objective'], val)} 
                    multiline 
                    className="text-center"
                />
            </div>
          </div>
          <div className="p-10">
            <h4 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">{t('okr.keyResult')}</h4>
            <div className="grid md:grid-cols-3 gap-6">
              {(result.keyResults || []).map((kr: string, i: number) => (
                <div key={i} className="group p-6 bg-white dark:bg-zinc-950 rounded-3xl border-2 border-transparent hover:border-purple-100 dark:hover:border-purple-900/30 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold mb-4">{i+1}</div>
                   <EditableText 
                    value={kr} 
                    onChange={(val) => {
                         const newKrs = [...result.keyResults];
                         newKrs[i] = val;
                         updateResult(['keyResults'], newKrs);
                    }} 
                    multiline 
                    className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed"
                   />
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl flex items-center gap-6 text-white shadow-lg">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket size={32} />
              </div>
              <div className="flex-grow">
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">{t('okr.initiative')}</span>
                 <EditableText 
                    value={result.initiative} 
                    onChange={(val) => updateResult(['initiative'], val)} 
                    multiline 
                    className="text-xl font-bold mt-1 bg-transparent border-white/30"
                />
              </div>
            </div>
          </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'first-principles') {
       return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-700/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-semibold">
                 1
               </div>
               <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t('fp.truths')}</h4>
            </div>
            <EditableList 
              items={result.truths || []} 
              onChange={(val) => updateResult(['truths'], val)}
              itemClassName="text-base md:text-lg text-gray-700 dark:text-gray-200 leading-relaxed pl-5 py-2 border-l-2 border-slate-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            />
          </div>
          <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-blue-100 dark:border-blue-900/40 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                 2
               </div>
               <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t('fp.newApproach')}</h4>
             </div>
             <EditableText 
                value={result.newApproach} 
                onChange={(val) => updateResult(['newApproach'], val)} 
                multiline 
                className="text-lg md:text-xl text-gray-800 dark:text-gray-100 leading-relaxed"
             />
          </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'rpm') {
      return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row">
           {/* Left Sidebar: Result & Purpose */}
           <div className="md:w-2/5 bg-gray-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('rpm.outcome')}</span>
                <div className="mb-12">
                     <EditableText 
                        value={result.result} 
                        onChange={(val) => updateResult(['result'], val)} 
                        multiline 
                        className="text-3xl font-bold leading-tight bg-transparent border-gray-700"
                    />
                </div>
                
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14}/> {t('rpm.purpose')}</span>
                <div className="border-l-2 border-indigo-500 pl-4">
                    <EditableText 
                        value={result.purpose} 
                        onChange={(val) => updateResult(['purpose'], val)} 
                        multiline 
                        className="text-lg leading-relaxed text-gray-300 font-light bg-transparent border-gray-700"
                    />
                </div>
              </div>
              
              <div className="mt-12 opacity-30 absolute bottom-10 left-10 pointer-events-none">
                <Star size={120} />
              </div>
           </div>
           
           {/* Right Content: MAP */}
           <div className="md:w-3/5 p-10 bg-white dark:bg-zinc-900">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <Layers size={20} />
               </div>
               <h4 className="font-bold text-xl text-gray-900 dark:text-white">{t('rpm.map')}</h4>
             </div>
             
             <EditableList 
                items={result.plan} 
                onChange={(val) => updateResult(['plan'], val)}
                itemClassName="font-medium text-lg text-gray-700 dark:text-gray-300"
            />
           </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'misogi') {
      return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 w-full max-w-4xl mx-auto space-y-8">
           <div className="bg-gradient-to-br from-red-900 to-rose-900 text-white rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden border border-red-800">
              <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 text-center">
                 <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-red-100 text-xs font-bold uppercase tracking-[0.3em] mb-8 border border-white/20">The Challenge (50% Fail Rate)</span>
                 <div className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                    <EditableText 
                        value={result.challenge} 
                        onChange={(val) => updateResult(['challenge'], val)} 
                        multiline 
                        className="bg-transparent border-white/20 text-center"
                    />
                 </div>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
                 <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">The Failure Gap</h4>
                 <EditableText 
                    value={result.gap} 
                    onChange={(val) => updateResult(['gap'], val)}
                    multiline
                    className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
                 />
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
                 <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">The Purification</h4>
                 <EditableText 
                    value={result.purification} 
                    onChange={(val) => updateResult(['purification'], val)}
                    multiline
                    className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
                 />
              </div>
           </div>
        </motion.div>
        </Wrapper>
      );
    }
    
    return null;
};
