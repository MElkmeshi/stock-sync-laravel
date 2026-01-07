<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMapping extends Model
{
    protected $fillable = [
        'pos_product_id',
        'presto_item_id',
    ];

    public function prestoItem(): BelongsTo
    {
        return $this->belongsTo(PrestoItem::class);
    }
}
