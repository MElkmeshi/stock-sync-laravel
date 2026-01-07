<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sync_events', function (Blueprint $table) {
            $table->id();
            $table->string('pos_product_id');
            $table->string('product_name');
            $table->string('action'); // 'enable' or 'disable'
            $table->string('status'); // 'success', 'failed', 'pending'
            $table->text('error_message')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->timestamps();

            $table->index(['created_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_events');
    }
};
