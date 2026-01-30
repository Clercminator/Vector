import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Award, Zap, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProfileProps {
  userId: string;
  userEmail: string | null;
  onBack: () => void;
}

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string;
  level: number;
  credits: number;
  points: number;
}

import { useLanguage } from '@/app/components/language-provider';

// ... interfaces

export function Profile({ userId, userEmail, onBack }: ProfileProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    level: 1,
    credits: 5,
    points: 0,
  });

  // ... useEffect logic ...

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: data.display_name,
          bio: data.bio,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success(t('profile.success'));
    } catch (e: any) {
      console.error(e);
      toast.error(t('profile.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="dark:text-white dark:hover:bg-zinc-800">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('profile.title')}</h1>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-12">
        {/* Left Column: Stats & Avatar */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center">
             <Avatar className="w-32 h-32 mb-4 border-4 border-white dark:border-zinc-800 shadow-xl">
               <AvatarImage src={data.avatar_url} />
               <AvatarFallback className="text-4xl bg-gray-100 dark:bg-zinc-800 text-black dark:text-white">
                  {userEmail?.[0].toUpperCase()}
               </AvatarFallback>
             </Avatar>
             <h2 className="text-xl font-bold truncate w-full text-black dark:text-white">{data.display_name || 'Architect'}</h2>
             <p className="text-sm text-gray-400 mb-6">{userEmail}</p>

             <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex flex-col items-center">
                 <Award className="text-blue-500 mb-2" size={20} />
                 <span className="text-2xl font-bold text-blue-900 dark:text-blue-200">{data.level}</span>
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t('profile.level')}</span>
               </div>
               <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl flex flex-col items-center">
                 <Zap className="text-yellow-500 mb-2" size={20} />
                 <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{data.credits}</span>
                 <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">{t('profile.credits')}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm h-fit">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
            <User size={20} className="text-gray-400" />
            {t('profile.personalInfo')}
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-black dark:text-white">{t('profile.displayName')}</Label>
              <Input 
                id="displayName" 
                value={data.display_name} 
                onChange={(e) => setData({ ...data, display_name: e.target.value })}
                placeholder="e.g. Elon Musk"
                className="bg-transparent dark:text-white dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-black dark:text-white">{t('profile.bio')}</Label>
              <Input 
                id="bio" 
                value={data.bio} 
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                placeholder="What are you building?"
                className="bg-transparent dark:text-white dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-black dark:text-white">{t('profile.avatarUrl')}</Label>
              <Input 
                id="avatarUrl" 
                value={data.avatar_url} 
                onChange={(e) => setData({ ...data, avatar_url: e.target.value })}
                placeholder="https://..."
                className="bg-transparent dark:text-white dark:border-zinc-700"
              />
              <p className="text-xs text-gray-400">Paste a link to your image.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving || loading} className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('profile.save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
