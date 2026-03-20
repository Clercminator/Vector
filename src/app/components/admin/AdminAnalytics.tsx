import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/components/language-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

export function AdminAnalytics() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [userGrowth, setUserGrowth] = useState<any[]>([]);
    const [frameworkUsage, setFrameworkUsage] = useState<any[]>([]);
    const [funnel, setFunnel] = useState<{ landing: number; wizardStarted: number; wizardCompleted: number } | null>(null);
    const [topExitPages, setTopExitPages] = useState<{ path: string; count: number }[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 0. Funnel & exit tracking (from analytics_events)
            try {
                const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
                const { data: events } = await supabase
                    .from('analytics_events')
                    .select('user_id, event_type, data')
                    .gte('created_at', since);
                if (events) {
                    const landing = new Set<string>();
                    const wizardStarted = new Set<string>();
                    const wizardCompleted = new Set<string>();
                    events.forEach((e: any) => {
                        const uid = e.user_id || '';
                        if (e.event_type === 'view_landing' || (e.event_type === 'page_view' && e.data?.path === '/')) {
                            landing.add(uid);
                        } else if (e.event_type === 'wizard_started') {
                            wizardStarted.add(uid);
                        } else if (e.event_type === 'wizard_completed') {
                            wizardCompleted.add(uid);
                        }
                    });
                    setFunnel({
                        landing: landing.size,
                        wizardStarted: wizardStarted.size,
                        wizardCompleted: wizardCompleted.size,
                    });
                    const exitCounts: Record<string, number> = {};
                    events.filter((e: any) => e.event_type === 'session_end').forEach((e: any) => {
                        const p = e.data?.path || '/';
                        exitCounts[p] = (exitCounts[p] || 0) + 1;
                    });
                    setTopExitPages(
                        Object.entries(exitCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([path, count]) => ({ path, count }))
                    );
                }
            } catch (_) { /* analytics_events may not be available yet */ }

            // 1. User Growth (Last 30 days)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: true });

            if (profiles) {
                const growthMap = new Map();
                // Initialize last 30 days
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().split('T')[0];
                    growthMap.set(key, 0);
                }

                profiles.forEach(p => {
                    const key = new Date(p.created_at).toISOString().split('T')[0];
                    if (growthMap.has(key)) {
                        growthMap.set(key, growthMap.get(key) + 1);
                    }
                });

                const growthData = Array.from(growthMap.entries()).map(([date, count]) => ({
                    date,
                    users: count
                }));
                
                // Cumulative
                let total = 0;
                const cumulativeData = growthData.map(d => {
                    total += d.users;
                    return { ...d, total };
                });
                
                setUserGrowth(cumulativeData);
            }

            // 2. Framework Usage
            // Helper function to count occurrences in blueprints
            const { data: blueprints } = await supabase
                .from('blueprints')
                .select('framework');

            if (blueprints) {
                 const usageMap: Record<string, number> = {};
                 blueprints.forEach(b => {
                     const fw = b.framework || 'unknown';
                     usageMap[fw] = (usageMap[fw] || 0) + 1;
                 });
                 
                 const usageData = Object.entries(usageMap)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
                 
                 setFrameworkUsage(usageData);
            }

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Funnel & Exit Points */}
            <div className="grid md:grid-cols-2 gap-6">
                {funnel && (
                    <Card className="dark:bg-zinc-900 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Conversion Funnel (Last 14 Days)</CardTitle>
                            <CardDescription>Landing → Wizard Started → Wizard Completed</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-medium">
                                    Landing: {funnel.landing}
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="flex-1 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-medium">
                                    Started: {funnel.wizardStarted}
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="flex-1 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-medium">
                                    Completed: {funnel.wizardCompleted}
                                </div>
                            </div>
                            {funnel.landing > 0 && (
                                <p className="text-xs text-gray-500">
                                    Conversion: {((funnel.wizardCompleted / funnel.landing) * 100).toFixed(1)}% (landing→completed)
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
                {topExitPages.length > 0 && (
                    <Card className="dark:bg-zinc-900 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Top Exit Pages</CardTitle>
                            <CardDescription>Where users leave (session_end events)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {topExitPages.map(({ path, count }) => (
                                    <li key={path} className="flex justify-between font-mono">
                                        <span className="truncate text-gray-300">{path || '/'}</span>
                                        <span className="text-gray-500">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="dark:bg-zinc-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>User Growth (Last 30 Days)</CardTitle>
                        <CardDescription>Cumulative new users over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={userGrowth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    stroke="#888"
                                    fontSize={12}
                                />
                                <YAxis stroke="#888" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    labelStyle={{ color: '#888' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="dark:bg-zinc-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Popular Frameworks</CardTitle>
                        <CardDescription>Blueprint usage by framework</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={frameworkUsage} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.1} />
                                <XAxis type="number" stroke="#888" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                                <Tooltip 
                                     cursor={{fill: 'transparent'}}
                                     contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
