import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/components/language-provider';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsData {
  frameworks: { name: string; count: number }[];
  activity: { date: string; count: number }[];
}

export function AnalyticsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }
    
    (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return; 
        }

        // Fetch events for this user
        const { data: events } = await supabase
            .from('analytics_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (!events) {
            setLoading(false);
            return;
        }

        // Process Framework Usage
        const frameworkCounts: Record<string, number> = {};
        events.forEach(e => {
            if (e.event_type === 'blueprint_created' || e.event_type === 'framework_selected') {
                const fw = e.data?.framework || 'unknown';
                frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;
            }
        });

        const frameworks = Object.entries(frameworkCounts).map(([name, count]) => ({ name, count }));

        // Process Activity (Last 7 days or all time)
        const activityCounts: Record<string, number> = {};
        events.forEach(e => {
            const date = new Date(e.created_at).toLocaleDateString();
            activityCounts[date] = (activityCounts[date] || 0) + 1;
        });

        const activity = Object.entries(activityCounts).map(([date, count]) => ({ date, count }));

        setData({ frameworks, activity });
        setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 dark:bg-zinc-900 border-none shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Framework Usage</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.frameworks}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }} />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 dark:bg-zinc-900 border-none shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Activity Over Time</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.activity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }} />
                                <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
}
