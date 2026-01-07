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
        Schema::create('presto_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('presto_id')->unique();
            $table->string('vendor_reference_id')->nullable()->index();
            $table->string('name_ar')->nullable();
            $table->string('name_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_available')->default(true);
            $table->json('category_ids')->nullable();
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->timestamp('cached_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presto_items');
    }
};
