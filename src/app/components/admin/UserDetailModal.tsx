import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Calendar, Mail, Shield, Zap, History, DollarSign } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

interface UserDetailModalProps {
    userId: string | null;
    onClose: () => void;
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [blueprints, setBlueprints] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState({ loginCount: 0, lastLogin: '' });

    useEffect(() => {
        if (userId) {
            fetchUserDetails(userId);
        }
    }, [userId]);

    const fetchUserDetails = async (id: string) => {
        setLoading(true);
        try {
            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', id)
                .single();
            setProfile(profile);

            // Fetch Blueprints
            const { data: blueprints } = await supabase
                .from('blueprints')
                .select('id, title, framework, created_at, is_public')
                .eq('user_id', id)
                .order('created_at', { ascending: false })
                .limit(5);
            setBlueprints(blueprints || []);

            // Fetch Payments
            // Note: If 'payments' table is created by user later, this might fail if not exists.
            // But we created migration for it.
            const { data: payments } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false })
                .limit(5);
            setPayments(payments || []);
            
            // Simulating login stats since we don't track them explicitly in a logs table yet
            // If user has 'last_sign_in_at' in auth.users, we can't access it easily via client.
            // We'll just rely on what we have.

        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl dark:bg-zinc-900 dark:border-zinc-800 p-0 overflow-hidden">
                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : profile ? (
                    <div className="flex flex-col h-[80vh]">
                        <DialogHeader className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                        {profile.display_name || 'Anonymous User'}
                                        {profile.is_admin && <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>}
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1"><Mail size={14} /> {profile.email || 'No email (Auth req)'}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Tier</div>
                                    <div className="font-bold text-lg capitalize">{profile.tier || 'Free'}</div>
                                </div>
                            </div>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                        <Zap size={14} /> Credits
                                    </div>
                                    <div className="text-2xl font-bold">{profile.credits || 0}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                        <History size={14} /> Blueprints
                                    </div>
                                    <div className="text-2xl font-bold">{blueprints.length}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                        <DollarSign size={14} /> LTV
                                    </div>
                                    <div className="text-2xl font-bold text-green-500">
                                        ${payments.reduce((acc, p) => acc + (Number(p.amount)||0), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity: Blueprints */}
                            <div>
                                <h3 className="font-semibold mb-4">Recent Blueprints</h3>
                                {blueprints.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No blueprints created yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {blueprints.map(b => (
                                            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <div>
                                                    <div className="font-medium text-sm">{b.title}</div>
                                                    <div className="text-xs text-gray-500 capitalize">{b.framework}</div>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(b.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Payments */}
                            <div>
                                <h3 className="font-semibold mb-4">Recent Payments</h3>
                                {payments.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No payments recorded.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className={p.status === 'approved' ? 'text-green-500 border-green-500/20' : ''}>
                                                        {p.status}
                                                    </Badge>
                                                    <div className="text-sm font-medium">
                                                        {p.currency === 'USD' ? '$' : p.currency} {p.amount}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-red-500">User not found</div>
                )}
            </DialogContent>
        </Dialog>
    );
}


