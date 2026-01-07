import AppLayout from '@/layouts/app-layout';
import { marketProducts } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ImageIcon, RefreshCw, Loader2, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Product Images',
        href: marketProducts().url,
    },
];

interface MarketProductWithImage {
    id: number;
    pos_product_id: string;
    product_name: string;
    stock_quantity: number;
    image_url: string | null;
}

interface ImageResult {
    url: string;
    thumbnail: string;
    title: string;
    width: number;
    height: number;
}

export default function MarketProducts() {
    const [products, setProducts] = useState<MarketProductWithImage[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<MarketProductWithImage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [imageResults, setImageResults] = useState<ImageResult[]>([]);
    const [searchingImages, setSearchingImages] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setError(null);
            const response = await axios.get('/api/market-products');
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setError('Failed to fetch products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openImageSearch = (product: MarketProductWithImage) => {
        setSelectedProduct(product);
        setSearchQuery(product.product_name);
        setImageResults([]);
        setError(null);
        setImageModalOpen(true);
    };

    const handleSearchImages = async () => {
        if (!selectedProduct || !searchQuery.trim()) {
            return;
        }

        setSearchingImages(true);
        setError(null);
        try {
            const response = await axios.post(`/api/market-products/${selectedProduct.id}/search-images`, {
                query: searchQuery,
            });

            if (response.data.success) {
                setImageResults(response.data.results);
                if (response.data.results.length === 0) {
                    setError('No images found for this search. Try a different query.');
                }
            } else {
                setError(response.data.message || 'Failed to search images');
            }
        } catch (error: any) {
            console.error('Image search failed:', error);
            setError(error.response?.data?.message || 'Failed to search images. Please check your API credentials.');
        } finally {
            setSearchingImages(false);
        }
    };

    const handleSelectImage = async (imageUrl: string) => {
        if (!selectedProduct) {
            return;
        }

        try {
            setError(null);
            await axios.put(`/api/market-products/${selectedProduct.id}/image`, {
                image_url: imageUrl,
            });

            // Update local state
            setProducts((prev) =>
                prev.map((p) => (p.id === selectedProduct.id ? { ...p, image_url: imageUrl } : p)),
            );

            // Close modal
            setImageModalOpen(false);
            setSelectedProduct(null);
            setImageResults([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Failed to save image:', error);
            setError('Failed to save image. Please try again.');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(
        (product) =>
            product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.pos_product_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const productsWithImages = filteredProducts.filter((p) => p.image_url);
    const productsWithoutImages = filteredProducts.filter((p) => !p.image_url);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Images" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Product Images</h1>
                        <p className="text-muted-foreground">
                            Manage product images using Google Image Search
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
                        <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>With Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{productsWithImages.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Without Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{productsWithoutImages.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Products</CardTitle>
                        <CardDescription>Click on a product to search and add images</CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? 'No products found' : 'No products available'}
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            {product.image_url ? (
                                                <div
                                                    className="relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted"
                                                    onClick={() => setPreviewImageUrl(product.image_url)}
                                                >
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.product_name}
                                                        className="size-full object-cover transition-transform hover:scale-110"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex size-20 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                                    <ImageIcon className="size-8" />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-tight">
                                                    {product.product_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ID: {product.pos_product_id}
                                                </p>
                                                <Badge variant="secondary" className="text-xs">
                                                    Stock: {product.stock_quantity}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => openImageSearch(product)} className="w-full">
                                            <ImageIcon className="mr-2 size-4" />
                                            {product.image_url ? 'Change Image' : 'Add Image'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Image Search Dialog */}
            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Search Google Images</DialogTitle>
                        <DialogDescription>
                            {selectedProduct && (
                                <span>
                                    Searching images for: <strong>{selectedProduct.product_name}</strong>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Edit search query..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchImages();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button onClick={handleSearchImages} disabled={searchingImages || !searchQuery.trim()}>
                                {searchingImages ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 size-4" />
                                        Search
                                    </>
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {searchingImages ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : imageResults.length > 0 ? (
                            <div className="max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                    {imageResults.map((image, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSelectImage(image.url)}
                                            className="group relative cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary hover:shadow-lg"
                                        >
                                            <div className="aspect-square">
                                                <img
                                                    src={image.thumbnail}
                                                    alt={image.title || 'Product image'}
                                                    className="size-full object-cover transition-transform group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button size="sm" variant="secondary">
                                                    Select Image
                                                </Button>
                                            </div>
                                            {image.width && image.height && (
                                                <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                                                    {image.width}×{image.height}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Preview Modal */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <button
                            className="absolute -right-4 -top-4 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            <X className="size-5" />
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="Product preview"
                            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
