import React, { useEffect, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/components/language-provider';
import { Loader2, DollarSign, Calendar, ExternalLink } from 'lucide-react';

export function AdminPayments() {
    const { t } = useLanguage();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchPayments();
    }, [page]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // We need to join with profiles to get user email
            // Note: Supabase join syntax depends on foreign keys being set up correctly.
            // Our migration user_id references auth.users which is not accessible easily via join in client lib 
            // unless we have a public view or if we join on 'profiles' (which we assume exists and has user_id).
            // Let's assume profiles has user_id FK to auth.users (it usually does).
            // But 'payments.user_id' -> 'auth.users.id'. 
            // We want 'profiles' where 'profiles.user_id' = 'payments.user_id'.
            // This requires a relationship definition in Supabase. 
            // If it's not defined, we might need to fetch manually or relying on mapped relation.
            // Let's try select with embedded resource.
            
            const { data, error } = await supabase
                .from('payments')
                .select('*, profiles(display_name, email)') // Try forcing profiles join
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="dark:bg-zinc-900 border-none shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50">
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : payments.length === 0 ? (
                             <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No payments found</TableCell></TableRow>
                        ) : (
                            payments.map((p) => (
                                <TableRow key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{p.profiles?.display_name || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400 font-mono">{p.profiles?.email || p.user_id.slice(0, 8) + '...'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        {p.currency === 'USD' ? '$' : p.currency} {p.amount}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={p.status === 'approved' ? 'default' : 'secondary'} className={p.status === 'approved' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm">
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-gray-400">
                                        {p.provider_payment_id || p.id.slice(0, 8)}
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
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={payments.length < PAGE_SIZE || loading}
                  >
                    Next
                  </Button>
              </div>
             </div>
        </Card>
    );
}
