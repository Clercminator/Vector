import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminPayments } from './admin/AdminPayments';
import { UserDetailModal } from './admin/UserDetailModal';

import { useEffect, useState } from 'react';
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
  ArrowLeft,
  MessageCircle
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

interface AdminDashboardProps {
  onBack: () => void;
  onStartImpersonating?: (target: { userId: string; email: string; tier: string }) => void;
}

export function AdminDashboard({ onBack, onStartImpersonating }: AdminDashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
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
  const [usersPage, setUsersPage] = useState(0);
  const PAGE_SIZE = 10;


  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesPage, setTemplatesPage] = useState(0);

  // Feedback State
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const FEEDBACK_PAGE_SIZE = 15;

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
      const from = usersPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (searchQuery) {
          query = query.ilike('display_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      
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
      const from = templatesPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('community_templates')
        .select('*, profiles(display_name)')
        .order('created_at', { ascending: false })
        .range(from, to);

      
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
  }, [activeTab, usersPage, searchQuery]); // Re-fetch on page/search change

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, templatesPage]); // Re-fetch on page change

  const fetchFeedback = async () => {
    if (!supabase) return;
    setLoadingFeedback(true);
    try {
      const from = feedbackPage * FEEDBACK_PAGE_SIZE;
      const to = from + FEEDBACK_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error) {
      toast.error('Failed to fetch feedback');
      console.error(error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feedback') fetchFeedback();
  }, [activeTab, feedbackPage]);

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

  // Filtered users (server-side now, so just identity)
  const filteredUsers = users; 

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      {/* ... Header ... */}
      
      {/* Add UserDetailModal */}
      <UserDetailModal
        userId={selectedUser}
        onClose={() => setSelectedUser(null)}
        onStartImpersonating={onStartImpersonating}
      />

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
          <TabsTrigger value="feedback" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black">
            <MessageCircle size={16} />
            {t('feedback.admin.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
           <AdminAnalytics />
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
                      <TableRow key={user.user_id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => setSelectedUser(user.user_id)}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.display_name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400 font-mono">{user.user_id.slice(0, 16)}...</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Input 
                            type="number" 
                            className="w-20 h-8 text-center"
                            defaultValue={user.credits}
                            onBlur={(e) => handleUpdateUser(user.user_id, { credits: parseInt(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedUser(user.user_id); }}>
                             <MoreHorizontal size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {/* Pagination controls */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-zinc-800">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                    disabled={usersPage === 0 || loadingUsers}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setUsersPage(p => p + 1)}
                    disabled={users.length < PAGE_SIZE || loadingUsers}
                  >
                    Next
                  </Button>
              </div>

            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
           {/* Existing Templates code ... */}
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
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-zinc-800">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTemplatesPage(p => Math.max(0, p - 1))}
                    disabled={templatesPage === 0 || loadingTemplates}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTemplatesPage(p => p + 1)}
                    disabled={templates.length < PAGE_SIZE || loadingTemplates}
                  >
                    Next
                  </Button>
              </div>

          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
           <AdminPayments />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
           <AdminAnalytics />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card className="dark:bg-zinc-900 border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t('feedback.admin.title')}</CardTitle>
              <CardDescription>Feedback submitted via the Feedback button across the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50">
                      <TableHead>{t('feedback.admin.rating')}</TableHead>
                      <TableHead>{t('feedback.admin.page')}</TableHead>
                      <TableHead className="min-w-[200px]">{t('feedback.admin.message')}</TableHead>
                      <TableHead>{t('feedback.admin.contact')}</TableHead>
                      <TableHead>{t('feedback.admin.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingFeedback ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">{t('common.loading')}</TableCell></TableRow>
                    ) : feedbackList.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">{t('feedback.admin.empty')}</TableCell></TableRow>
                    ) : (
                      feedbackList.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            {row.rating != null ? (
                              <span className="flex items-center gap-1">
                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                {row.rating}/5
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono">{row.page_context || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate" title={row.message}>{row.message}</TableCell>
                          <TableCell className="text-sm">
                            {row.email ? (
                              <a href={`mailto:${row.email}`} className="text-blue-500 hover:underline">{row.email}</a>
                            ) : row.user_id ? (
                              <button
                                type="button"
                                onClick={() => { setSelectedUser(row.user_id); setActiveTab('users'); }}
                                className="text-blue-500 hover:underline font-medium"
                              >
                                View user
                              </button>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-zinc-800">
                <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => Math.max(0, p - 1))} disabled={feedbackPage === 0 || loadingFeedback}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => p + 1)} disabled={feedbackList.length < FEEDBACK_PAGE_SIZE || loadingFeedback}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
