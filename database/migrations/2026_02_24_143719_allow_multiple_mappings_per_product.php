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
        Schema::table('product_mappings', function (Blueprint $table) {
            $table->dropUnique(['pos_product_id']);
            $table->unique(['pos_product_id', 'presto_item_id'], 'product_mappings_pos_presto_unique');
        });
    }

    public function down(): void
    {
        Schema::table('product_mappings', function (Blueprint $table) {
            $table->dropUnique('product_mappings_pos_presto_unique');
            $table->unique('pos_product_id');
        });
    }
};
