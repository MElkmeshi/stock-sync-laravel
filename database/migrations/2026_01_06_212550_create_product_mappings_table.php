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
        Schema::create('product_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('pos_product_id')->unique();
            $table->unsignedBigInteger('presto_item_id');
            $table->timestamps();

            $table->foreign('presto_item_id')->references('id')->on('presto_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_mappings');
    }
};
