import AppLayout from '@/layouts/app-layout';
import { settingsPage } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, TestTube, RefreshCw, CheckCircle, XCircle, Database, Cloud, ImageIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: settingsPage().url,
    },
];

interface Settings {
    db_server: string;
    db_port: string;
    db_name: string;
    db_user: string;
    db_password: string;
    stock_query: string;
    presto_api_url: string;
    presto_email: string;
    presto_password: string;
    google_api_key: string;
    google_search_engine_id: string;
    sync_enabled: boolean;
}

export default function Settings() {
    const [settings, setSettings] = useState<Settings>({
        db_server: '',
        db_port: '1433',
        db_name: 'Market',
        db_user: '',
        db_password: '',
        stock_query: '',
        presto_api_url: 'https://integration.presto.app/v1',
        presto_email: '',
        presto_password: '',
        google_api_key: '',
        google_search_engine_id: '',
        sync_enabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingDb, setTestingDb] = useState(false);
    const [testingPresto, setTestingPresto] = useState(false);
    const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [prestoTestResult, setPrestoTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axios.post('/api/settings', settings);
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const testDatabase = async () => {
        setTestingDb(true);
        setDbTestResult(null);
        try {
            const response = await axios.post('/api/settings/test-database', {
                db_server: settings.db_server,
                db_port: settings.db_port,
                db_name: settings.db_name,
                db_user: settings.db_user,
                db_password: settings.db_password,
            });
            setDbTestResult(response.data);
        } catch (error: any) {
            setDbTestResult({
                success: false,
                message: error.response?.data?.message || 'Connection failed',
            });
        } finally {
            setTestingDb(false);
        }
    };

    const testPrestoConnection = async () => {
        setTestingPresto(true);
        setPrestoTestResult(null);
        try {
            const response = await axios.get('/api/presto/test');
            setPrestoTestResult(response.data);
        } catch (error: any) {
            setPrestoTestResult({
                success: false,
                message: error.response?.data?.message || 'Connection failed',
            });
        } finally {
            setTestingPresto(false);
        }
    };

    const authenticatePresto = async () => {
        try {
            const response = await axios.post('/api/presto/authenticate', {
                email: settings.presto_email,
                password: settings.presto_password,
            });
            if (response.data.success) {
                alert('Authentication successful! Token saved.');
                fetchSettings();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Authentication failed');
        }
    };

    const syncCatalog = async () => {
        try {
            const response = await axios.post('/api/presto/sync-catalog');
            alert(response.data.message);
            fetchSettings();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Catalog sync failed');
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Configure your stock sync system</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchSettings}>
                            <RefreshCw className="mr-2 size-4" />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={saveSettings} disabled={saving}>
                            <Save className="mr-2 size-4" />
                            {saving ? 'Saving...' : 'Save All'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="size-5" />
                                Market Database (MSSQL)
                            </CardTitle>
                            <CardDescription>Configure connection to your POS database</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="db_server">Server</Label>
                                <Input
                                    id="db_server"
                                    value={settings.db_server}
                                    onChange={(e) => setSettings({ ...settings, db_server: e.target.value })}
                                    placeholder="localhost"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db_port">Port</Label>
                                <Input
                                    id="db_port"
                                    value={settings.db_port}
                                    onChange={(e) => setSettings({ ...settings, db_port: e.target.value })}
                                    placeholder="1433"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db_name">Database Name</Label>
                                <Input
                                    id="db_name"
                                    value={settings.db_name}
                                    onChange={(e) => setSettings({ ...settings, db_name: e.target.value })}
                                    placeholder="Market"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db_user">Username</Label>
                                <Input
                                    id="db_user"
                                    value={settings.db_user}
                                    onChange={(e) => setSettings({ ...settings, db_user: e.target.value })}
                                    placeholder="sa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="db_password">Password</Label>
                                <Input
                                    id="db_password"
                                    type="password"
                                    value={settings.db_password}
                                    onChange={(e) => setSettings({ ...settings, db_password: e.target.value })}
                                />
                            </div>
                            <Button className="w-full" variant="outline" onClick={testDatabase} disabled={testingDb}>
                                <TestTube className="mr-2 size-4" />
                                {testingDb ? 'Testing...' : 'Test Connection'}
                            </Button>
                            {dbTestResult && (
                                <div
                                    className={`flex items-center gap-2 rounded-lg p-3 ${
                                        dbTestResult.success
                                            ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                                            : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                                    }`}
                                >
                                    {dbTestResult.success ? (
                                        <CheckCircle className="size-4" />
                                    ) : (
                                        <XCircle className="size-4" />
                                    )}
                                    <span className="text-sm">{dbTestResult.message}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cloud className="size-5" />
                                Presto API
                            </CardTitle>
                            <CardDescription>Configure Presto delivery platform connection</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="presto_api_url">API URL</Label>
                                <Input
                                    id="presto_api_url"
                                    value={settings.presto_api_url}
                                    onChange={(e) => setSettings({ ...settings, presto_api_url: e.target.value })}
                                    placeholder="https://integration.presto.app/v1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="presto_email">Email</Label>
                                <Input
                                    id="presto_email"
                                    type="email"
                                    value={settings.presto_email}
                                    onChange={(e) => setSettings({ ...settings, presto_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="presto_password">Password</Label>
                                <Input
                                    id="presto_password"
                                    type="password"
                                    value={settings.presto_password}
                                    onChange={(e) => setSettings({ ...settings, presto_password: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={authenticatePresto}>
                                    Authenticate
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={testPrestoConnection}
                                    disabled={testingPresto}
                                >
                                    <TestTube className="mr-2 size-4" />
                                    {testingPresto ? 'Testing...' : 'Test'}
                                </Button>
                            </div>
                            {prestoTestResult && (
                                <div
                                    className={`flex items-center gap-2 rounded-lg p-3 ${
                                        prestoTestResult.success
                                            ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                                            : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                                    }`}
                                >
                                    {prestoTestResult.success ? (
                                        <CheckCircle className="size-4" />
                                    ) : (
                                        <XCircle className="size-4" />
                                    )}
                                    <span className="text-sm">{prestoTestResult.message}</span>
                                </div>
                            )}
                            <Button className="w-full" variant="secondary" onClick={syncCatalog}>
                                <RefreshCw className="mr-2 size-4" />
                                Sync Catalog from Presto
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="size-5" />
                                Google Image Search
                            </CardTitle>
                            <CardDescription>Configure Google Custom Search API for product images</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="google_api_key">API Key</Label>
                                <Input
                                    id="google_api_key"
                                    type="password"
                                    value={settings.google_api_key}
                                    onChange={(e) => setSettings({ ...settings, google_api_key: e.target.value })}
                                    placeholder="Your Google API Key"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="google_search_engine_id">Search Engine ID</Label>
                                <Input
                                    id="google_search_engine_id"
                                    value={settings.google_search_engine_id}
                                    onChange={(e) =>
                                        setSettings({ ...settings, google_search_engine_id: e.target.value })
                                    }
                                    placeholder="Your Search Engine ID (cx)"
                                />
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">Setup Instructions:</p>
                                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        • Get API key from{' '}
                                        <a
                                            href="https://console.cloud.google.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline"
                                        >
                                            Google Cloud Console
                                        </a>
                                    </li>
                                    <li>• Enable Custom Search API in your project</li>
                                    <li>
                                        • Create search engine at{' '}
                                        <a
                                            href="https://programmablesearchengine.google.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline"
                                        >
                                            Programmable Search Engine
                                        </a>
                                    </li>
                                    <li>• Free tier: 100 searches/day</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Stock Query</CardTitle>
                        <CardDescription>SQL query to fetch stock levels from Market database</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_query">Query</Label>
                            <textarea
                                id="stock_query"
                                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={settings.stock_query}
                                onChange={(e) => setSettings({ ...settings, stock_query: e.target.value })}
                                placeholder="SELECT pos_product_id, product_name, stock_quantity FROM products"
                            />
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium">Query Requirements:</p>
                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <li>• Must return: pos_product_id, product_name, stock_quantity</li>
                                <li>• Use column aliases if your table has different column names</li>
                                <li>• Example: SELECT id as pos_product_id, name as product_name, qty as stock_quantity FROM items</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
