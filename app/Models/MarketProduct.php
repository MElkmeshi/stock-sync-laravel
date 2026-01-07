<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketProduct extends Model
{
    protected $fillable = [
        'pos_product_id',
        'product_name',
        'image_url',
    ];
}
