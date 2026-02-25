import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Award, Zap, Save, Loader2, ArrowLeft, Star, CheckCircle2, Camera, Info, Eye, EyeOff, TriangleAlert, Download, LayoutDashboard, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { createCheckout } from '@/lib/mercadoPago';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AchievementsList } from '@/app/components/AchievementsList';
import { Flame } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

interface ProfileProps {
  userId: string;
  userEmail: string | null;
  onBack: () => void;
  onProfileUpdate?: () => void;
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
  extra_credits?: number;
  credits_expires_at?: string;
  metadata?: {
    demographics?: string; // Deprecated but kept for type safety if needed
    age?: string;
    gender?: string;
    country?: string;
    zodiac_sign?: string;
    zodiac_importance?: string; // super | somewhat | nothing
    hobbies?: string;
    skills?: string;
    interests?: string;
    values?: string;
    vision?: string;
    other_observations?: string;
    preferred_plan_style?: string; // action_focused | reflective | balanced
    stay_on_track?: string; // what helps the user stay on track
    tracker_preferences?: {
      show_streaks?: boolean;
      show_score?: boolean;
      show_heatmap?: boolean;
      default_view?: 'grid' | 'list' | 'reports';
    };
    digest_frequency?: 'weekly' | 'monthly' | 'off';
    digest_day_of_week?: string;
    digest_day_of_month?: string;
  };
}

import { TIER_CONFIGS, TierId } from '@/lib/tiers';
import { COUNTRIES, GENDERS, ZODIACS, ZODIAC_IMPORTANCE, PLAN_STYLES } from '@/lib/constants';
import { Lock } from 'lucide-react';

import { useLanguage } from '@/app/components/language-provider';

// ... interfaces

export function Profile({ userId, userEmail, onBack, onProfileUpdate }: ProfileProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [email, setEmail] = useState(userEmail || '');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    avatar_url: '',
    level: 1,
    credits: 1,
    extra_credits: 0,
    credits_expires_at: '',
    points: 0,
    streak_count: 0,
    branding_logo_url: '',
    branding_color: '#000000',
    tier: 'free',
    metadata: {
      demographics: '',
      age: '',
      gender: '',
      country: '',
      zodiac_sign: '',
      zodiac_importance: '',
      hobbies: '',
      skills: '',
      interests: '',
      values: '',
      vision: '',
      other_observations: '',
      preferred_plan_style: '',
      stay_on_track: ''
    }
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIdentities(user.identities || []);
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, bio, avatar_url, level, credits, extra_credits, credits_expires_at, points, streak_count, branding_logo_url, branding_color, tier, metadata')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setData({
              display_name: profile.display_name || '',
              bio: profile.bio || '',
              avatar_url: profile.avatar_url || '',
              level: profile.level || 1,
              credits: profile.credits || 0,
              extra_credits: profile.extra_credits || 0,
              credits_expires_at: profile.credits_expires_at || '',
              points: profile.points || 0,
              streak_count: profile.streak_count || 0,
              branding_logo_url: profile.branding_logo_url || '',
              branding_color: profile.branding_color || '#000000',
              tier: profile.tier || 'free',
              metadata: profile.metadata || { demographics: '', age: '', gender: '', country: '', zodiac_sign: '', zodiac_importance: '', hobbies: '', skills: '', interests: '', values: '', vision: '', other_observations: '', preferred_plan_style: '', stay_on_track: '' },
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

      if (email && email !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast.info("Check your new email to confirm the change.");
      }

      if (error) throw error;
      toast.success(t('profile.success'));
      onProfileUpdate?.(); 
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
      await createCheckout(supabase, {
        tier: tierId.charAt(0).toUpperCase() + tierId.slice(1),
        amount: config.priceUsd,
        currency: 'USD',
        userId,
      });
    } catch (e) {
      console.error(e);
      toast.error(t('common.error') || "Failed to initiate checkout.");
    }
  };

  const handleExportData = async () => {
    if (!supabase) return;
    setExporting(true);
    try {
      const exportData: any = { version: 1, exported_at: new Date().toISOString(), data: {} };
      const collections = [
        'blueprints',
        'blueprint_tracker',
        'goal_logs',
        'blueprint_sub_goals',
        'blueprint_tasks',
        'blueprint_task_completions',
      ];

      for (const table of collections) {
         const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
         if (!error && data) {
           exportData.data[table] = data;
         }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const { saveAs } = await import('file-saver');
      saveAs(blob, `vector-data-${new Date().toISOString().split('T')[0]}.json`);
      
      toast.success(t('profile.exportSuccess') || 'Data exported successfully!');
    } catch (e: any) {
      console.error('Export error:', e);
      toast.error(t('profile.exportError') || 'Failed to export data.');
    } finally {
      setExporting(false);
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
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.avatarError') || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
        toast.error(t('auth.passwordsDoNotMatch') || "Passwords do not match");
        return;
    }
    try {
        setPasswordLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success(t('profile.passwordUpdated'));
        setNewPassword('');
        setConfirmPassword('');
    } catch (e: any) {
        toast.error(e.message || t('profile.passwordUpdateError'));
    } finally {
        setPasswordLoading(false);
    }
};

const handleLinkAccount = async (provider: 'google' | 'github') => {
    try {
        const { error } = await supabase.auth.linkIdentity({
            provider,
            options: {
                redirectTo: window.location.href,
            }
        });
        if (error) throw error;
    } catch (e: any) {
       console.error(e);
       toast.error(e.message);
    }
};

    const handleUnlinkAccount = async (identityId: string) => {
        if (identities?.length <= 1) {
             toast.error(t('profile.lastMethodError'));
             return;
        }
        try {
            const { error } = await supabase.auth.unlinkIdentity(identityId);
            if (error) throw error;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setIdentities(user.identities || []);
            toast.success(t('profile.accountUnlinked'));
        } catch (e: any) {
            console.error(e);
            toast.error(e.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;
        try {
            setLoading(true); // Re-use main loading state or add a specific one? Main is fine as it blocks everything.
            const { error } = await supabase.rpc('delete_own_account');
            if (error) throw error;
            
            await supabase.auth.signOut();
            window.location.href = '/'; 
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || t('profile.deleteError') || 'Failed to delete account');
            setLoading(false);
        }
    };

  const currentTierConfig = TIER_CONFIGS[data.tier as TierId] || TIER_CONFIGS['architect'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl xl:max-w-7xl mx-auto px-6 py-12"
    >
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="dark:text-white dark:hover:bg-zinc-800 cursor-pointer">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('profile.title')}</h1>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] gap-12">
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
                 <Button variant="outline" size="sm" className="gap-2 relative z-10 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                    {t('profile.upload') || "Upload Avatar"}
                 </Button>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  aria-label={t('profile.upload') || "Upload Avatar"}
                  title={t('profile.upload') || "Upload Avatar"}
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

          {/* Plan & plans count */}
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
                {/* Plans (included in tier) */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                         <Zap className="text-yellow-500" size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">{data.credits}</p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{t('profile.normalCredits') || 'Normal Credits'}</p>
                         {data.credits_expires_at && (
                           <p className="text-[10px] text-zinc-400 mt-1">
                             {t('profile.expires').replace('{0}', new Date(data.credits_expires_at).toLocaleDateString())}
                           </p>
                         )}
                      </div>
                   </div>
                   <Button 
                      size="sm" 
                      onClick={() => navigate('/pricing')}
                       className="bg-white text-black hover:bg-zinc-200 rounded-xl font-bold h-10 px-4 cursor-pointer"
                   >
                      {t('profile.buyMore') || 'Buy More'}
                   </Button>
                </div>

                {/* Bonus plans */}
                {/* Always show extra credits section to be explicit, or only if > 0? User said "don't appear visually anywhere", implying they want to see it. */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                         <Star className="text-purple-500" size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">{data.extra_credits || 0}</p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{t('profile.extraCredits') || 'Extra Credits'}</p>
                         <p className="text-[10px] text-zinc-400 mt-1">{t('profile.neverExpires')}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
                 <p className="text-xs text-zinc-500 font-medium px-1">{t('profile.includedInPlan') || 'Included in your plan:'}</p>
                 <ul className="grid grid-cols-1 gap-2">
                    {currentTierConfig.allowedFrameworks.slice(0, 3).map((fw: string) => (
                        <li key={fw} className="flex items-center gap-2 text-xs text-zinc-300">
                           <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                           {t(`fw.${fw}.title`) || fw.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </li>
                    ))}
                    {currentTierConfig.canExportPdf && (
                        <li className="flex items-center gap-2 text-xs text-zinc-300">
                           <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                           {t('profile.pdfExport') || 'PDF Export'}
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            {t('profile.personalInfoHint')}
          </p>
          <div className="space-y-6">
            {/* Email + Display name in one row on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black dark:text-white">{t('auth.emailAddress')}</Label>
                <Input 
                  id="email" 
                  value={email} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent dark:text-white dark:border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-black dark:text-white">{t('profile.displayName')}</Label>
                <Input 
                  id="displayName" 
                  value={data.display_name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, display_name: e.target.value })}
                  placeholder="e.g. Elon Musk"
                  className="bg-transparent dark:text-white dark:border-zinc-700"
                />
              </div>
            </div>

            {/* Bio / Mission with character limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="bio" className="text-black dark:text-white">{t('profile.bio')}</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{(data.bio || '').length}/500</span>
              </div>
              <Textarea 
                id="bio" 
                value={data.bio} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const v = e.target.value;
                  if (v.length <= 500) setData({ ...data, bio: v });
                }}
                placeholder={t('profile.bioPlaceholder') || "e.g. What you're building (up to 500 characters)"}
                maxLength={500}
                rows={3}
                className="bg-transparent dark:text-white dark:border-zinc-700 resize-none"
              />
            </div>

            {/* Demographics: one row on desktop with even column widths */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="age" className="text-black dark:text-white">{t('profile.age')}</Label>
                <Input 
                  id="age" 
                  type="number"
                  min={10}
                  max={90}
                  value={data.metadata?.age || ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = parseInt(e.target.value);
                      if (!e.target.value || (val >= 10 && val <= 90)) {
                          setData({ ...data, metadata: { ...data.metadata, age: e.target.value } });
                      }
                  }}
                  placeholder="28"
                  className="bg-transparent dark:text-white dark:border-zinc-700"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="gender" className="text-black dark:text-white">{t('profile.gender')}</Label>
                <Select 
                    value={data.metadata?.gender} 
                    onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, gender: val } })}
                >
                    <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                        <SelectValue placeholder={t('profile.genderPlaceholder') || "Select gender"} />
                    </SelectTrigger>
                    <SelectContent>
                        {GENDERS.map((o: string) => (
                            <SelectItem key={o} value={o}>{t(`gender.${o}`)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="country" className="text-black dark:text-white">{t('profile.country')}</Label>
                <Select 
                    value={data.metadata?.country} 
                    onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, country: val } })}
                >
                    <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                        <SelectValue placeholder={t('profile.countryPlaceholder') || "Select country"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                        {COUNTRIES.map((o: string) => (
                            <SelectItem key={o} value={o}>{t(`country.${o}`)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="zodiac" className="text-black dark:text-white">{t('profile.zodiac')}</Label>
                <Select 
                    value={data.metadata?.zodiac_sign} 
                    onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, zodiac_sign: val } })}
                >
                    <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                        <SelectValue placeholder={t('profile.zodiacPlaceholder') || "Select sign"} />
                    </SelectTrigger>
                    <SelectContent>
                        {ZODIACS.map((o: string) => (
                            <SelectItem key={o} value={o}>{t(`zodiac.${o}`)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="zodiac_importance" className="text-black dark:text-white">{t('profile.zodiacImportanceShort') || 'Zodiac relevance'}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-offset-0" aria-label={t('profile.zodiacImportanceInfo')} title={t('profile.zodiacImportanceInfo')}>
                        <Info size={14} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 text-sm text-left" align="start">
                      <p className="text-gray-700 dark:text-gray-300">{t('profile.zodiacImportanceInfo')}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Select 
                    value={data.metadata?.zodiac_importance || ''} 
                    onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, zodiac_importance: val } })}
                >
                    <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                        <SelectValue placeholder={t('profile.zodiacImportancePlaceholder') || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                        {ZODIAC_IMPORTANCE.map((o: string) => (
                            <SelectItem key={o} value={o}>{t(`profile.zodiacImportance.${o}`)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests" className="text-black dark:text-white">{t('profile.interests') || "Interests"}</Label>
              <Input 
                id="interests" 
                value={data.metadata?.interests || ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, metadata: { ...data.metadata, interests: e.target.value } })}
                placeholder="e.g. AI, startups, reading"
                className="bg-transparent dark:text-white dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
               <Label htmlFor="skills" className="text-black dark:text-white">{t('profile.skills') || "Skills & Expertise"}</Label>
               <Input 
                 id="skills" 
                 value={data.metadata?.skills || ''} 
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, metadata: { ...data.metadata, skills: e.target.value } })}
                 placeholder="e.g. Marketing, coding, design"
                 className="bg-transparent dark:text-white dark:border-zinc-700"
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="hobbies" className="text-black dark:text-white">{t('profile.hobbies') || "Hobbies"}</Label>
               <Input 
                 id="hobbies" 
                 value={data.metadata?.hobbies || ''} 
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, metadata: { ...data.metadata, hobbies: e.target.value } })}
                 placeholder="e.g. Hiking, chess, photography"
                 className="bg-transparent dark:text-white dark:border-zinc-700"
               />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_plan_style" className="text-black dark:text-white">{t('profile.preferredPlanStyle')}</Label>
              <Select 
                value={data.metadata?.preferred_plan_style || ''} 
                onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, preferred_plan_style: val } })}
              >
                <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                  <SelectValue placeholder={t('profile.preferredPlanStylePlaceholder') || "Select style"} />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STYLES.map((o: string) => (
                    <SelectItem key={o} value={o}>{t(`profile.planStyle.${o}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stay_on_track" className="text-black dark:text-white">{t('profile.stayOnTrack')}</Label>
              <Input 
                id="stay_on_track" 
                value={data.metadata?.stay_on_track || ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, metadata: { ...data.metadata, stay_on_track: e.target.value } })}
                placeholder={t('profile.stayOnTrackPlaceholder') || "e.g. Deadlines, accountability partner, daily reminders"}
                className="bg-transparent dark:text-white dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_observations" className="text-black dark:text-white">{t('profile.otherObservations')}</Label>
              <textarea 
                id="other_observations" 
                value={data.metadata?.other_observations || ''} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, metadata: { ...data.metadata, other_observations: e.target.value } })}
                placeholder={t('profile.otherObservationsPlaceholder') || "Anything else you want the agent to know when generating your plans..."}
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent dark:text-white placeholder:text-gray-400 resize-y min-h-[100px]"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving || loading} className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 cursor-pointer">
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

          {/* Preferences Section */}
          <div className="mt-8 border-t border-gray-100 dark:border-zinc-800 pt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
              <LayoutDashboard size={20} className="text-gray-400" />
              {t('profile.dashboardPrefs') || 'Dashboard & Tracker Preferences'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Dashboard layout */}
              <div className="space-y-4">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label className="text-black dark:text-white">{t('profile.showStreaks') || 'Show Streaks'}</Label>
                     <Switch 
                       checked={data.metadata?.tracker_preferences?.show_streaks ?? true} 
                       onCheckedChange={(c: boolean) => setData({ ...data, metadata: { ...data.metadata, tracker_preferences: { ...data.metadata?.tracker_preferences, show_streaks: c } }})} 
                     />
                   </div>
                   <div className="flex items-center justify-between">
                     <Label className="text-black dark:text-white">{t('profile.showScore') || 'Show Score'}</Label>
                     <Switch 
                       checked={data.metadata?.tracker_preferences?.show_score ?? true} 
                       onCheckedChange={(c: boolean) => setData({ ...data, metadata: { ...data.metadata, tracker_preferences: { ...data.metadata?.tracker_preferences, show_score: c } }})} 
                     />
                   </div>
                   <div className="flex items-center justify-between">
                     <Label className="text-black dark:text-white">{t('profile.showHeatmap') || 'Show Heatmaps'}</Label>
                     <Switch 
                       checked={data.metadata?.tracker_preferences?.show_heatmap ?? true} 
                       onCheckedChange={(c: boolean) => setData({ ...data, metadata: { ...data.metadata, tracker_preferences: { ...data.metadata?.tracker_preferences, show_heatmap: c } }})} 
                     />
                   </div>
                   <div className="space-y-2 pt-2">
                     <Label className="text-black dark:text-white">{t('profile.defaultView') || 'Default View'}</Label>
                     <Select 
                       value={data.metadata?.tracker_preferences?.default_view || 'grid'} 
                       onValueChange={(val: any) => setData({ ...data, metadata: { ...data.metadata, tracker_preferences: { ...data.metadata?.tracker_preferences, default_view: val } } })}
                     >
                       <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="grid">Grid (Tracker Cards)</SelectItem>
                         <SelectItem value="list">List</SelectItem>
                         <SelectItem value="reports">Reports / Minimal</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
              </div>

              {/* Digests */}
              <div className="space-y-4">
                <h4 className="font-semibold text-black dark:text-white flex items-center gap-2">
                  <Bell size={16} />
                  {t('profile.digestPrefs') || 'Email Digests'}
                </h4>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label className="text-black dark:text-white">{t('profile.digestFrequency') || 'Frequency'}</Label>
                     <Select 
                       value={data.metadata?.digest_frequency || 'off'} 
                       onValueChange={(val: any) => setData({ ...data, metadata: { ...data.metadata, digest_frequency: val } })}
                     >
                       <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="off">{t('profile.digest.off') || 'Off'}</SelectItem>
                         <SelectItem value="weekly">{t('profile.digest.weekly') || 'Weekly'}</SelectItem>
                         <SelectItem value="monthly">{t('profile.digest.monthly') || 'Monthly'}</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   {data.metadata?.digest_frequency === 'weekly' && (
                     <div className="space-y-2">
                       <Label className="text-black dark:text-white">{t('profile.digestDay') || 'Day of Week'}</Label>
                       <Select 
                         value={data.metadata?.digest_day_of_week || '1'} 
                         onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, digest_day_of_week: val } })}
                       >
                         <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="1">Monday</SelectItem>
                           <SelectItem value="5">Friday</SelectItem>
                           <SelectItem value="6">Saturday</SelectItem>
                           <SelectItem value="7">Sunday</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   )}
                   {data.metadata?.digest_frequency === 'monthly' && (
                     <div className="space-y-2">
                       <Label className="text-black dark:text-white">{t('profile.digestDay') || 'Day of Month'}</Label>
                       <Select 
                         value={data.metadata?.digest_day_of_month || '1'} 
                         onValueChange={(val: string) => setData({ ...data, metadata: { ...data.metadata, digest_day_of_month: val } })}
                       >
                         <SelectTrigger className="bg-transparent dark:text-white dark:border-zinc-700">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="1">1st of the month</SelectItem>
                           <SelectItem value="15">15th of the month</SelectItem>
                           <SelectItem value="28">End of the month</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
               <h4 className="font-semibold text-black dark:text-white mb-2">{t('profile.exportData') || 'Data Export'}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export all your blueprints, trackers, logs, and sub-goals as a JSON file.</p>
               <Button onClick={handleExportData} disabled={exporting} variant="outline" className="dark:text-white dark:border-zinc-700">
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {exporting ? t('profile.exporting') || 'Preparing export...' : t('profile.exportData') || 'Export my Data'}
               </Button>
            </div>
          </div>
          
          {/* Security Section */}
          <div className="mt-8 border-t border-gray-100 dark:border-zinc-800 pt-8">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-black dark:text-white">
                <Lock size={20} className="text-gray-400" />
                {t('profile.security')}
             </h3>

             <div className="space-y-8">
                {/* Change Password */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-black dark:text-white">{t('profile.changePassword')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 relative">
                            <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                            <div className="relative">
                                <Input 
                                    id="newPassword" 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                    className="bg-transparent dark:text-white dark:border-zinc-700 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                            <div className="relative">
                                <Input 
                                    id="confirmPassword" 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                    className="bg-transparent dark:text-white dark:border-zinc-700 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleUpdatePassword} 
                            disabled={passwordLoading || !newPassword}
                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black cursor-pointer"
                        >
                            {passwordLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t('profile.updatePassword')
                            )}
                        </Button>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                {/* Linked Accounts */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-black dark:text-white">{t('profile.linkedAccounts')}</h4>
                    <div className="space-y-3">
                        {['google', 'github'].map((provider) => {
                            const isLinked = identities?.some((id) => id.provider === provider);
                            const identityId = identities?.find((id) => id.provider === provider)?.identity_id;

                            return (
                                <div key={provider} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="capitalize font-medium text-black dark:text-white">{t(`profile.provider.${provider}`) || provider}</div>
                                        {isLinked && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Connected</span>}
                                    </div>
                                    {isLinked ? (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => identityId && handleUnlinkAccount(identityId)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer"
                                        >
                                            {t('profile.unlinkAccount')}
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleLinkAccount(provider as 'google' | 'github')}
                                            className="cursor-pointer dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
                                        >
                                            {t('profile.linkAccount')}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
             </div>


          {/* Danger Zone */}
          <div className="mt-8 border-t border-red-100 dark:border-red-900/30 pt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600 dark:text-red-500">
                    <TriangleAlert size={20} />
                    {t('profile.dangerZone') || 'Danger Zone'}
                </h3>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6">
                    <h4 className="font-bold text-red-900 dark:text-red-200 mb-2">{t('profile.deleteAccount') || 'Delete Account'}</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        {t('profile.deleteAccountDescription') || 'Once you delete your account, there is no going back. Please be certain.'}
                    </p>
                    
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white border-transparent">
                                {t('profile.deleteAccount') || 'Delete Account'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <DialogHeader>
                                <DialogTitle className="text-black dark:text-white">{t('profile.deleteAccountConfirmationTitle') || 'Are you absolutely sure?'}</DialogTitle>
                                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                                    {t('profile.deleteAccountConfirmationDesc') || 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.'}
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4 space-y-4">
                                <Label htmlFor="delete-confirm" className="text-black dark:text-white">
                                    {t('profile.typeDeleteToConfirm') || 'Type DELETE to confirm'}
                                </Label>
                                <Input 
                                    id="delete-confirm"
                                    value={deleteInput}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteInput(e.target.value)}
                                    className="bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-zinc-200 dark:border-zinc-700"
                                />
                            </div>

                            <DialogFooter>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteAccount}
                                    disabled={deleteInput !== 'DELETE' || loading}
                                    className="w-full sm:w-auto cursor-pointer bg-red-600 hover:bg-red-700 text-white border-transparent"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('profile.confirmDelete') || 'Delete Account'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
