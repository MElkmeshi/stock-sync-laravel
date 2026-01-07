import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { PlayCircle, PauseCircle, RefreshCw, Package, GitCompare, Activity, CheckCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardStats {
    total_presto_items: number;
    total_mappings: number;
    recent_events_count: number;
    successful_syncs: number;
}

interface SyncEvent {
    id: number;
    pos_product_id: string;
    product_name: string;
    action: string;
    status: string;
    stock_quantity: number;
    created_at: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([]);
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/dashboard');
            setStats(response.data.stats);
            setRecentEvents(response.data.recent_events);
            setSyncEnabled(response.data.sync_enabled || false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSync = async () => {
        setToggling(true);
        try {
            const response = await axios.post('/api/dashboard/toggle-sync', {
                enabled: !syncEnabled,
            });
            setSyncEnabled(response.data.sync_enabled);
        } catch (error) {
            console.error('Failed to toggle sync:', error);
        } finally {
            setToggling(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Stock Sync Dashboard</h1>
                        <p className="text-muted-foreground">Monitor your Presto stock synchronization</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="mr-2 size-4" />
                            Refresh
                        </Button>
                        <Button
                            variant={syncEnabled ? 'destructive' : 'default'}
                            size="sm"
                            onClick={toggleSync}
                            disabled={toggling}
                        >
                            {syncEnabled ? (
                                <>
                                    <PauseCircle className="mr-2 size-4" />
                                    Disable Sync
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="mr-2 size-4" />
                                    Enable Sync
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Presto Items</CardTitle>
                            <Package className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_presto_items || 0}</div>
                            <p className="text-xs text-muted-foreground">Total items in catalog</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mapped Products</CardTitle>
                            <GitCompare className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_mappings || 0}</div>
                            <p className="text-xs text-muted-foreground">Products linked to POS</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                            <Activity className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.recent_events_count || 0}</div>
                            <p className="text-xs text-muted-foreground">Events in last 24h</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Successful Syncs</CardTitle>
                            <CheckCircle className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.successful_syncs || 0}</div>
                            <p className="text-xs text-muted-foreground">All time successful</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sync Events</CardTitle>
                        <CardDescription>Latest stock synchronization activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentEvents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent events</p>
                            ) : (
                                recentEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{event.product_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.pos_product_id} • Stock: {event.stock_quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    event.action === 'enable'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {event.action}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    event.status === 'success'
                                                        ? 'default'
                                                        : event.status === 'failed'
                                                          ? 'destructive'
                                                          : 'secondary'
                                                }
                                            >
                                                {event.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(event.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {syncEnabled && (
                    <Card className="border-green-500/50 bg-green-50 dark:bg-green-950">
                        <CardHeader>
                            <CardTitle className="text-green-900 dark:text-green-100">
                                Automatic Sync Enabled
                            </CardTitle>
                            <CardDescription className="text-green-700 dark:text-green-300">
                                Stock levels are being monitored and synced to Presto every minute
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
