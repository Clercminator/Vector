import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Award, Zap, Save, Loader2, ArrowLeft, Star, CheckCircle2, Camera, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { createCheckout } from '@/lib/mercadoPago';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AchievementsList } from '@/app/components/AchievementsList';
import { Flame } from 'lucide-react';

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
  streak_count: number;
  branding_logo_url?: string;
  branding_color?: string;
  tier?: string;
  metadata?: {
    demographics?: string;
    hobbies?: string;
    skills?: string;
    interests?: string;
  };
}

import { TIER_CONFIGS, TierId } from '@/lib/tiers';
import { Lock } from 'lucide-react';

import { useLanguage } from '@/app/components/language-provider';

// ... interfaces

export function Profile({ userId, userEmail, onBack }: ProfileProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    level: 1,
    credits: 5,
    points: 0,
    streak_count: 0,
    branding_logo_url: '',
    branding_color: '#000000',
    tier: 'free',
    metadata: {
      demographics: '',
      hobbies: '',
      skills: '',
      interests: ''
    }
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, bio, avatar_url, level, credits, points, streak_count, branding_logo_url, branding_color, tier, metadata')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setData({
              display_name: profile.display_name || '',
              bio: profile.bio || '',
              avatar_url: profile.avatar_url || '',
              level: profile.level || 1,
              credits: profile.credits || 0,
              points: profile.points || 0,
              streak_count: profile.streak_count || 0,
              branding_logo_url: profile.branding_logo_url || '',
              branding_color: profile.branding_color || '#000000',
              tier: profile.tier || 'free',
              metadata: profile.metadata || { demographics: '', hobbies: '', skills: '', interests: '' },
            });
          }
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

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
          branding_logo_url: data.branding_logo_url,
          branding_color: data.branding_color,
          metadata: data.metadata,
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

  const handlePricingTier = async (tierId: string) => {
    const config = TIER_CONFIGS[tierId as TierId];
    if (!config || config.priceUsd <= 0) return;
    
    try {
      await createCheckout({ 
        tier: tierId.charAt(0).toUpperCase() + tierId.slice(1), 
        amount: config.priceUsd, 
        currency: 'USD' 
      });
    } catch (e) {
      console.error(e);
      toast.error(t('common.error') || "Failed to initiate checkout.");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    if (!supabase) return;

    setUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setData({ ...data, avatar_url: publicUrl }); // Optimistic update
      
      // Auto-save the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) throw updateError;
      
      toast.success(t('profile.avatarSuccess') || 'Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.avatarError') || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const currentTierConfig = TIER_CONFIGS[data.tier as TierId] || TIER_CONFIGS['architect'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-6 py-12"
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
             <div className="flex flex-col items-center gap-3">
               <div className="relative group">
                 <Avatar className="w-32 h-32 border-4 border-white dark:border-zinc-800 shadow-xl">
                   <AvatarImage src={data.avatar_url} />
                   <AvatarFallback className="text-4xl bg-gray-100 dark:bg-zinc-800 text-black dark:text-white">
                      {userEmail?.[0]?.toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
               </div>
               
               <div className="relative">
                 <Button variant="outline" size="sm" className="gap-2 relative z-10 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                    {t('profile.upload') || "Upload Avatar"}
                 </Button>
                 <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                   accept="image/*"
                   onChange={handleAvatarUpload}
                   disabled={uploading}
                 />
               </div>
             </div>

             <h2 className="text-xl font-bold truncate w-full mt-2 text-black dark:text-white">{data.display_name || 'Architect'}</h2>
             <p className="text-sm text-gray-400 mb-6">{userEmail}</p>

              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl flex flex-col items-center">
                  <Award className="text-blue-500 mb-1" size={18} />
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-200">{data.level}</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('profile.level')}</span>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-2xl flex flex-col items-center">
                  <Zap className="text-yellow-500 mb-1" size={18} />
                  <span className="text-xl font-bold text-yellow-900 dark:text-yellow-200">{data.credits}</span>
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">{t('profile.credits')}</span>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl flex flex-col items-center">
                  <Flame className="text-orange-500 mb-1" size={18} />
                  <span className="text-xl font-bold text-orange-900 dark:text-orange-200">{data.streak_count}</span>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{t('profile.streak') || 'Streak'}</span>
                </div>
              </div>
          </div>

          {/* Plan & Credits Section */}
          <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-900 dark:to-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl text-white">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('profile.currentPlan') || 'Current Plan'}</p>
                   <h3 className="text-2xl font-black capitalize tracking-tight flex items-center gap-2">
                       {data.tier}
                       {data.tier !== 'architect' && <Star size={20} className="text-yellow-400 fill-yellow-400" />}
                   </h3>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                   {currentTierConfig.priceUsd > 0 ? `$${currentTierConfig.priceUsd}/mo` : 'Free'}
                </div>
             </div>

             <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                         <Zap className="text-yellow-500" size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">{data.credits}</p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{t('profile.creditsRemaining') || 'Credits Remaining'}</p>
                      </div>
                   </div>
                   <Button 
                      size="sm" 
                      onClick={() => navigate('/pricing')}
                      className="bg-white text-black hover:bg-zinc-200 rounded-xl font-bold h-10 px-4"
                   >
                      {t('profile.buyMore') || 'Buy More'}
                   </Button>
                </div>
             </div>

             <div className="space-y-2">
                 <p className="text-xs text-zinc-500 font-medium px-1">Included in your plan:</p>
                 <ul className="grid grid-cols-1 gap-2">
                    {currentTierConfig.allowedFrameworks.slice(0, 3).map(fw => (
                        <li key={fw} className="flex items-center gap-2 text-xs text-zinc-300">
                           <CheckCircle2 size={12} className="text-green-500" />
                           {fw}
                        </li>
                    ))}
                    {currentTierConfig.canExportPdf && (
                        <li className="flex items-center gap-2 text-xs text-zinc-300">
                           <CheckCircle2 size={12} className="text-green-500" />
                           PDF Export
                        </li>
                    )}
                 </ul>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demographics" className="text-black dark:text-white">{t('profile.demographics') || "Demographics"}</Label>
                  <Input 
                    id="demographics" 
                    value={data.metadata?.demographics || ''} 
                    onChange={(e) => setData({ ...data, metadata: { ...data.metadata, demographics: e.target.value } })}
                    placeholder="e.g. 28, New York"
                    className="bg-transparent dark:text-white dark:border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests" className="text-black dark:text-white">{t('profile.interests') || "Interests"}</Label>
                  <Input 
                    id="interests" 
                    value={data.metadata?.interests || ''} 
                    onChange={(e) => setData({ ...data, metadata: { ...data.metadata, interests: e.target.value } })}
                    placeholder="e.g. AI, startups, reading"
                    className="bg-transparent dark:text-white dark:border-zinc-700"
                  />
                </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="skills" className="text-black dark:text-white">{t('profile.skills') || "Skills & Expertise"}</Label>
               <Input 
                 id="skills" 
                 value={data.metadata?.skills || ''} 
                 onChange={(e) => setData({ ...data, metadata: { ...data.metadata, skills: e.target.value } })}
                 placeholder="e.g. Marketing, coding, design"
                 className="bg-transparent dark:text-white dark:border-zinc-700"
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="hobbies" className="text-black dark:text-white">{t('profile.hobbies') || "Hobbies"}</Label>
               <Input 
                 id="hobbies" 
                 value={data.metadata?.hobbies || ''} 
                 onChange={(e) => setData({ ...data, metadata: { ...data.metadata, hobbies: e.target.value } })}
                 placeholder="e.g. Hiking, chess, photography"
                 className="bg-transparent dark:text-white dark:border-zinc-700"
               />
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

          {/* Branding Section (Max Tier Only) */}
          <div className={`mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800 ${data.tier !== 'max' ? 'opacity-50 pointer-events-none relative' : ''}`}>
             
             {data.tier !== 'max' && (
                 <div className="absolute inset-0 flex items-center justify-center z-10">
                     <div className="bg-black/80 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold">
                        <Lock size={14} /> Max Tier Only
                     </div>
                 </div>
             )}

             <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
                <Award className="text-gray-400" /> 
                PDF Branding
                <div className="group relative ml-2">
                   <Info className="text-gray-400 cursor-help" size={16} />
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                     Customize the logo and colors on your exported PDF blueprints.
                   </div>
                </div>
             </h3>

             <div className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="text-black dark:text-white">Logo URL</Label>
                    <Input 
                        id="logoUrl" 
                        value={data.branding_logo_url} 
                        onChange={(e) => setData({ ...data, branding_logo_url: e.target.value })}
                        placeholder="https://your-company.com/logo.png"
                        className="bg-transparent dark:text-white dark:border-zinc-700"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="brandColor" className="text-black dark:text-white">Primary Color</Label>
                    <div className="flex gap-4">
                        <Input 
                            id="brandColor" 
                            type="color"
                            value={data.branding_color} 
                            onChange={(e) => setData({ ...data, branding_color: e.target.value })}
                            className="w-16 h-10 p-1 bg-transparent dark:border-zinc-700"
                        />
                        <Input 
                            value={data.branding_color} 
                            onChange={(e) => setData({ ...data, branding_color: e.target.value })}
                            placeholder="#000000"
                            className="bg-transparent dark:text-white dark:border-zinc-700 flex-1"
                        />
                    </div>
                 </div>
             </div>
          </div>
          
          <div className="mt-8 border-t border-gray-100 dark:border-zinc-800 pt-8">
            <AchievementsList userId={userId} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
