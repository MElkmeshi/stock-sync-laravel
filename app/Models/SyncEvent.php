<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncEvent extends Model
{
    public const ACTION_ENABLE = 'enable';
    public const ACTION_DISABLE = 'disable';

    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';
    public const STATUS_PENDING = 'pending';

    protected $fillable = [
        'pos_product_id',
        'product_name',
        'action',
        'status',
        'error_message',
        'stock_quantity',
    ];

    protected function casts(): array
    {
        return [
            'stock_quantity' => 'integer',
        ];
    }
}
