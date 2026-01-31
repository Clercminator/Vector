import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Star, 
  MoreHorizontal,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/app/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/components/language-provider';
import { toast } from 'sonner';
import { TIER_CONFIGS, TierId } from '@/lib/tiers';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('stats');
  
  // Stats State
  const [stats, setStats] = useState({
    users: 0,
    blueprints: 0,
    templates: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!supabase) return;
    setLoadingStats(true);
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: blueprintCount } = await supabase.from('blueprints').select('*', { count: 'exact', head: true });
      const { count: templateCount } = await supabase.from('community_templates').select('*', { count: 'exact', head: true });
      
      setStats({
        users: userCount || 0,
        blueprints: blueprintCount || 0,
        templates: templateCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTemplates = async () => {
    if (!supabase) return;
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('community_templates')
        .select('*, profiles(display_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast.error('Failed to fetch templates');
      console.error(error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const handleUpdateUser = async (userId: string, updates: any) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
      if (error) throw error;
      toast.success('User updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleUpdateTemplate = async (templateId: string, updates: any) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('community_templates').update(updates).eq('id', templateId);
      if (error) throw error;
      toast.success('Template updated');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="dark:text-white dark:hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white uppercase flex items-center gap-3">
              <Shield className="text-red-500" />
              {t('admin.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{t('admin.subtitle')}</p>
          </div>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm" className="gap-2">
            <RefreshCcw size={14} className={loadingStats ? "animate-spin" : ""} />
            {t('admin.actions.refresh')}
        </Button>
      </div>

      <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-gray-100 dark:bg-zinc-900 p-1 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-x-auto flex-nowrap w-full justify-start md:w-auto">
          <TabsTrigger value="stats" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <BarChart3 size={16} />
            {t('admin.tabs.stats')}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <Users size={16} />
            {t('admin.tabs.users')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <FileText size={16} />
            {t('admin.tabs.templates')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <Settings size={16} />
            {t('admin.tabs.payments')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <BarChart3 size={16} />
            {t('admin.tabs.analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="dark:bg-zinc-900 border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('admin.stats.totalUsers')}</CardDescription>
                <CardTitle className="text-4xl font-bold">{stats.users}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="dark:bg-zinc-900 border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('admin.stats.totalBlueprints')}</CardDescription>
                <CardTitle className="text-4xl font-bold">{stats.blueprints}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="dark:bg-zinc-900 border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t('admin.stats.totalTemplates')}</CardDescription>
                <CardTitle className="text-4xl font-bold">{stats.templates}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Search className="text-gray-400" size={20} />
            <Input 
              placeholder={t('admin.users.search')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 text-lg p-0"
            />
          </div>

          <Card className="dark:bg-zinc-900 border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50">
                    <TableHead className="w-[300px]">{t('admin.users.table.email')}</TableHead>
                    <TableHead>{t('admin.users.table.tier')}</TableHead>
                    <TableHead>{t('admin.users.table.credits')}</TableHead>
                    <TableHead>{t('admin.users.table.admin')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions.save')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">{t('admin.users.loading')}</TableCell></TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">{t('admin.search.noResults')}</TableCell></TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.display_name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400 font-mono">{user.user_id.slice(0, 16)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select 
                            value={user.tier || 'architect'} 
                            onChange={(e) => handleUpdateUser(user.user_id, { tier: e.target.value })}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                          >
                            <option value="architect">{t('tier.architect')}</option>
                            <option value="standard">{t('tier.standard')}</option>
                            <option value="max">{t('tier.max')}</option>
                            <option value="enterprise">{t('tier.enterprise')}</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            className="w-20 h-8 text-center"
                            defaultValue={user.credits}
                            onBlur={(e) => handleUpdateUser(user.user_id, { credits: parseInt(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleUpdateUser(user.user_id, { is_admin: !user.is_admin })}
                                className={user.is_admin ? "text-red-500" : "text-gray-400"}
                            >
                                <Shield size={16} className={user.is_admin ? "fill-current" : ""} />
                            </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="dark:bg-zinc-900 border-none shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.templates.table.title')}</TableHead>
                  <TableHead>{t('admin.templates.table.author')}</TableHead>
                  <TableHead>{t('admin.templates.table.status')}</TableHead>
                  <TableHead>{t('admin.templates.table.featured')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions.save')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTemplates ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">{t('admin.templates.loading')}</TableCell></TableRow>
                ) : templates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">{t('admin.templates.noResults')}</TableCell></TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.title}</TableCell>
                      <TableCell>{template.profiles?.display_name || 'Anonymous'}</TableCell>
                      <TableCell>
                        <Badge variant={template.status === 'approved' ? 'default' : template.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {template.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.is_featured && <Star size={16} className="text-yellow-500 fill-current" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={t('admin.actions.approve')}
                            onClick={() => handleUpdateTemplate(template.id, { status: 'approved' })}
                          >
                            <CheckCircle2 size={18} className="text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={t('admin.actions.reject')}
                            onClick={() => handleUpdateTemplate(template.id, { status: 'rejected' })}
                          >
                            <XCircle size={18} className="text-red-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={template.is_featured ? t('admin.actions.unfeature') : t('admin.actions.feature')}
                            onClick={() => handleUpdateTemplate(template.id, { is_featured: !template.is_featured })}
                          >
                            <Star size={18} className={template.is_featured ? "text-yellow-500 fill-current" : "text-gray-400"} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
           <Card className="dark:bg-zinc-900 border-none shadow-sm p-12 text-center">
                <Settings className="mx-auto mb-4 opacity-20" size={64} />
                <h3 className="text-xl font-bold mb-2">{t('admin.payments.title')}</h3>
                <p className="max-w-md mx-auto text-gray-500 mb-6">{t('admin.payments.desc')}</p>
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-zinc-800">
                    <p className="text-gray-400 italic">{t('admin.payments.empty')}</p>
                </div>
           </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
           <Card className="dark:bg-zinc-900 border-none shadow-sm p-12 text-center">
                <BarChart3 className="mx-auto mb-4 opacity-20" size={64} />
                <h3 className="text-xl font-bold mb-2">{t('admin.analytics.title')}</h3>
                <p className="max-w-md mx-auto text-gray-500">{t('admin.analytics.desc')}</p>
           </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
