import AppLayout from '@/layouts/app-layout';
import { mappings } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Trash2, Plus, RefreshCw, ImageIcon, X, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mappings',
        href: mappings().url,
    },
];

interface PrestoItem {
    id: number;
    presto_id: number;
    vendor_reference_id: string | null;
    name_ar: string | null;
    name_en: string | null;
    price: number;
    stock: number;
    is_active: boolean;
    is_available: boolean;
}

interface ProductMapping {
    id: number;
    pos_product_id: string;
    presto_item_id: number;
    presto_item: PrestoItem;
}

interface MarketProduct {
    id: number;
    pos_product_id: string;
    product_name: string;
    stock_quantity: number;
    image_url: string | null;
}

export default function Mappings() {
    const [mappings, setMappings] = useState<ProductMapping[]>([]);
    const [prestoItems, setPrestoItems] = useState<PrestoItem[]>([]);
    const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [prestoSearchTerm, setPrestoSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedMarketProduct, setSelectedMarketProduct] = useState<MarketProduct | null>(null);
    const [selectedPrestoItem, setSelectedPrestoItem] = useState<PrestoItem | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [availableStockOnly, setAvailableStockOnly] = useState(false);

    const fetchData = async () => {
        try {
            const [mappingsRes, prestoRes, marketRes] = await Promise.all([
                axios.get('/api/mappings'),
                axios.get('/api/presto/items'),
                axios.get('/api/market-products'),
            ]);
            setMappings(mappingsRes.data);
            setPrestoItems(prestoRes.data);
            setMarketProducts(marketRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const createMapping = async () => {
        if (!selectedMarketProduct || !selectedPrestoItem) {
            return;
        }

        try {
            await axios.post('/api/mappings', {
                pos_product_id: selectedMarketProduct.pos_product_id,
                presto_item_id: selectedPrestoItem.id,
            });
            setSelectedMarketProduct(null);
            setSelectedPrestoItem(null);
            fetchData();
        } catch (error) {
            console.error('Failed to create mapping:', error);
        }
    };

    const deleteMapping = async (posProductId: string) => {
        try {
            await axios.delete(`/api/mappings/${posProductId}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete mapping:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredMarketProducts = marketProducts.filter((product) => {
        const matchesSearch =
            product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.pos_product_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = !availableStockOnly || product.stock_quantity > 0;
        return matchesSearch && matchesStock;
    });

    const filteredPrestoItems = prestoItems.filter((item) => {
        const name = item.name_en || item.name_ar || '';
        const vendorRef = item.vendor_reference_id || '';
        return (
            name.toLowerCase().includes(prestoSearchTerm.toLowerCase()) ||
            vendorRef.toLowerCase().includes(prestoSearchTerm.toLowerCase())
        );
    });

    const mappedPosIds = new Set(mappings.map((m) => m.pos_product_id));
    const unmappedMarketProducts = filteredMarketProducts.filter((p) => !mappedPosIds.has(p.pos_product_id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Mappings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Product Mappings</h1>
                        <p className="text-muted-foreground">Map POS products to Presto catalog items</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="mr-2 size-4" />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Mappings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{mappings.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Presto Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{prestoItems.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Market Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{marketProducts.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Market Database Products</CardTitle>
                            <CardDescription>Available products from your POS system</CardDescription>
                            <div className="mt-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="available-stock"
                                        checked={availableStockOnly}
                                        onCheckedChange={(checked) => setAvailableStockOnly(checked === true)}
                                    />
                                    <Label
                                        htmlFor="available-stock"
                                        className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
                                    >
                                        <Package className="size-4" />
                                        Available stock only
                                    </Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[500px] space-y-2 overflow-y-auto">
                                {unmappedMarketProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {searchTerm ? 'No products found' : 'All products are mapped'}
                                    </p>
                                ) : (
                                    unmappedMarketProducts.map((product) => (
                                        <div
                                            key={product.pos_product_id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                selectedMarketProduct?.pos_product_id === product.pos_product_id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            {product.image_url ? (
                                                <div
                                                    className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setImageModalUrl(product.image_url);
                                                    }}
                                                >
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.product_name}
                                                        className="size-full object-cover transition-transform hover:scale-110"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                                    <ImageIcon className="size-6" />
                                                </div>
                                            )}
                                            <div
                                                className="flex-1 space-y-1"
                                                onClick={() => setSelectedMarketProduct(product)}
                                            >
                                                <p className="text-sm font-medium">{product.product_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    ID: {product.pos_product_id} • Stock: {product.stock_quantity}
                                                </p>
                                            </div>
                                            <div onClick={() => setSelectedMarketProduct(product)}>
                                                {selectedMarketProduct?.pos_product_id === product.pos_product_id && (
                                                    <Badge>Selected</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Presto Catalog Items</CardTitle>
                            <CardDescription>Items from your Presto menu</CardDescription>
                            <div className="relative mt-4">
                                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search items..."
                                    value={prestoSearchTerm}
                                    onChange={(e) => setPrestoSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[500px] space-y-2 overflow-y-auto">
                                {filteredPrestoItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No items found</p>
                                ) : (
                                    filteredPrestoItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                selectedPrestoItem?.id === item.id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            {item.image_url ? (
                                                <div
                                                    className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setImageModalUrl(item.image_url);
                                                    }}
                                                >
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name_en || item.name_ar || ''}
                                                        className="size-full object-cover transition-transform hover:scale-110"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                                    <ImageIcon className="size-6" />
                                                </div>
                                            )}
                                            <div
                                                className="flex-1 space-y-1"
                                                onClick={() => setSelectedPrestoItem(item)}
                                            >
                                                <p className="text-sm font-medium">{item.name_en || item.name_ar}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.vendor_reference_id && `Ref: ${item.vendor_reference_id} • `}
                                                    ${item.price}
                                                </p>
                                            </div>
                                            <div className="flex gap-2" onClick={() => setSelectedPrestoItem(item)}>
                                                {selectedPrestoItem?.id === item.id && <Badge>Selected</Badge>}
                                                <Badge variant={item.is_available ? 'default' : 'secondary'}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {selectedMarketProduct && selectedPrestoItem && (
                    <Card className="border-primary bg-primary/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        {selectedMarketProduct.image_url && (
                                            <div
                                                className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageModalUrl(selectedMarketProduct.image_url);
                                                }}
                                            >
                                                <img
                                                    src={selectedMarketProduct.image_url}
                                                    alt={selectedMarketProduct.product_name}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Market Product</p>
                                            <p className="font-medium">{selectedMarketProduct.product_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                ID: {selectedMarketProduct.pos_product_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xl">→</div>
                                    <div className="flex items-center gap-3">
                                        {selectedPrestoItem.image_url && (
                                            <div
                                                className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageModalUrl(selectedPrestoItem.image_url);
                                                }}
                                            >
                                                <img
                                                    src={selectedPrestoItem.image_url}
                                                    alt={selectedPrestoItem.name_en || selectedPrestoItem.name_ar || ''}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Presto Item</p>
                                            <p className="font-medium">
                                                {selectedPrestoItem.name_en || selectedPrestoItem.name_ar}
                                            </p>
                                            <p className="text-xs text-muted-foreground">ID: {selectedPrestoItem.id}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedMarketProduct(null);
                                            setSelectedPrestoItem(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={createMapping}>
                                        <Plus className="mr-2 size-4" />
                                        Create Mapping
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Active Mappings</CardTitle>
                        <CardDescription>Current product mappings between POS and Presto</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {mappings.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No mappings created yet</p>
                            ) : (
                                mappings.map((mapping) => {
                                    const marketProduct = marketProducts.find(
                                        (p) => p.pos_product_id === mapping.pos_product_id,
                                    );
                                    return (
                                        <div
                                            key={mapping.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3">
                                                    {marketProduct?.image_url && (
                                                        <div
                                                            className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setImageModalUrl(marketProduct.image_url);
                                                            }}
                                                        >
                                                            <img
                                                                src={marketProduct.image_url}
                                                                alt={marketProduct.product_name}
                                                                className="size-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">POS Product</p>
                                                        <p className="text-sm font-medium">
                                                            {marketProduct?.product_name || mapping.pos_product_id}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: {mapping.pos_product_id}
                                                            {marketProduct &&
                                                                ` • Stock: ${marketProduct.stock_quantity}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            <div className="text-muted-foreground">→</div>
                                            <div className="flex items-center gap-3">
                                                {mapping.presto_item.image_url && (
                                                    <div
                                                        className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setImageModalUrl(mapping.presto_item.image_url);
                                                        }}
                                                    >
                                                        <img
                                                            src={mapping.presto_item.image_url}
                                                            alt={
                                                                mapping.presto_item.name_en ||
                                                                mapping.presto_item.name_ar ||
                                                                ''
                                                            }
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">Presto Item</p>
                                                    <p className="text-sm font-medium">
                                                        {mapping.presto_item.name_en || mapping.presto_item.name_ar}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {mapping.presto_item_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteMapping(mapping.pos_product_id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                );
                            })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {imageModalUrl && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setImageModalUrl(null)}
                    >
                        <div className="relative max-h-[90vh] max-w-[90vw]">
                            <button
                                className="absolute -right-4 -top-4 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
                                onClick={() => setImageModalUrl(null)}
                            >
                                <X className="size-5" />
                            </button>
                            <img
                                src={imageModalUrl}
                                alt="Product"
                                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
