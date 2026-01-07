<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrestoItem extends Model
{
    protected $fillable = [
        'presto_id',
        'vendor_reference_id',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'price',
        'stock',
        'sku',
        'barcode',
        'is_active',
        'is_available',
        'category_ids',
        'image_url',
        'brand_id',
        'cached_at',
    ];

    protected function casts(): array
    {
        return [
            'presto_id' => 'integer',
            'price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'category_ids' => 'array',
            'brand_id' => 'integer',
            'cached_at' => 'datetime',
        ];
    }

    public function mappings(): HasMany
    {
        return $this->hasMany(ProductMapping::class);
    }

    public function getNameAttribute(): string
    {
        return $this->name_en ?: $this->name_ar ?: 'Unnamed Product';
    }
}
