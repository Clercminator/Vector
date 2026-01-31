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

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
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
