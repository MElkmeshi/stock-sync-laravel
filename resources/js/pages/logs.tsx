import AppLayout from '@/layouts/app-layout';
import { logs } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Filter } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Logs',
        href: logs().url,
    },
];

interface SyncEvent {
    id: number;
    pos_product_id: string;
    product_name: string;
    action: string;
    status: string;
    stock_quantity: number;
    error_message: string | null;
    created_at: string;
}

export default function Logs() {
    const [events, setEvents] = useState<SyncEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<SyncEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/sync-events');
            setEvents(response.data);
            setFilteredEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch sync events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = events;

        if (searchTerm) {
            filtered = filtered.filter(
                (event) =>
                    event.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.pos_product_id.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((event) => event.status === statusFilter);
        }

        if (actionFilter !== 'all') {
            filtered = filtered.filter((event) => event.action === actionFilter);
        }

        setFilteredEvents(filtered);
    }, [searchTerm, statusFilter, actionFilter, events]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'success':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'pending':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getActionBadgeVariant = (action: string) => {
        return action === 'enable' ? 'default' : 'secondary';
    };

    const stats = {
        total: events.length,
        success: events.filter((e) => e.status === 'success').length,
        failed: events.filter((e) => e.status === 'failed').length,
        pending: events.filter((e) => e.status === 'pending').length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sync Logs" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Sync Logs</h1>
                        <p className="text-muted-foreground">View all stock synchronization events</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchEvents}>
                        <RefreshCw className="mr-2 size-4" />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Successful</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter and search sync events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="success">Success</option>
                                    <option value="failed">Failed</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="all">All Actions</option>
                                    <option value="enable">Enable</option>
                                    <option value="disable">Disable</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Log</CardTitle>
                        <CardDescription>
                            Showing {filteredEvents.length} of {events.length} events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredEvents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No events found</p>
                            ) : (
                                filteredEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium">{event.product_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    POS ID: {event.pos_product_id} • Stock: {event.stock_quantity}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getActionBadgeVariant(event.action)}>
                                                    {event.action}
                                                </Badge>
                                                <Badge variant={getStatusBadgeVariant(event.status)}>
                                                    {event.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{new Date(event.created_at).toLocaleString()}</span>
                                            {event.error_message && (
                                                <span className="text-red-600">{event.error_message}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
