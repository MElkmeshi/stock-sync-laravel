<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('mappings', function () {
        return Inertia::render('mappings');
    })->name('mappings');

    Route::get('settings-page', function () {
        return Inertia::render('settings');
    })->name('settings-page');

    Route::get('logs', function () {
        return Inertia::render('logs');
    })->name('logs');

    Route::get('market-products', function () {
        return Inertia::render('market-products');
    })->name('market-products');
});

// API Routes
Route::prefix('api')->middleware('auth')->group(function () {
    // Dashboard
    Route::get('dashboard', [App\Http\Controllers\Api\DashboardController::class, 'index']);
    Route::post('dashboard/toggle-sync', [App\Http\Controllers\Api\DashboardController::class, 'toggleSync']);

    // Settings
    Route::get('settings', [App\Http\Controllers\Api\SettingsController::class, 'index']);
    Route::post('settings', [App\Http\Controllers\Api\SettingsController::class, 'update']);
    Route::post('settings/test-database', [App\Http\Controllers\Api\SettingsController::class, 'testDatabase']);

    // Presto API
    Route::post('presto/authenticate', [App\Http\Controllers\Api\PrestoController::class, 'authenticate']);
    Route::get('presto/test', [App\Http\Controllers\Api\PrestoController::class, 'testConnection']);
    Route::post('presto/sync-catalog', [App\Http\Controllers\Api\PrestoController::class, 'syncCatalog']);
    Route::get('presto/items', [App\Http\Controllers\Api\PrestoController::class, 'getItems']);

    // Product Mappings
    Route::get('mappings', [App\Http\Controllers\Api\MappingsController::class, 'index']);
    Route::post('mappings', [App\Http\Controllers\Api\MappingsController::class, 'store']);
    Route::delete('mappings/{posProductId}', [App\Http\Controllers\Api\MappingsController::class, 'destroy']);
    Route::get('mappings/stats', [App\Http\Controllers\Api\MappingsController::class, 'stats']);

    // Market DB
    Route::get('market-db/products', [App\Http\Controllers\Api\MarketDbController::class, 'getProducts']);
    Route::get('market-db/tables', [App\Http\Controllers\Api\MarketDbController::class, 'getTables']);
    Route::get('market-db/columns/{tableName}', [App\Http\Controllers\Api\MarketDbController::class, 'getColumns']);

    // Market Products (with images)
    Route::get('market-products', [App\Http\Controllers\Api\MarketProductController::class, 'index']);
    Route::post('market-products/{id}/search-images', [App\Http\Controllers\Api\MarketProductController::class, 'searchImages']);
    Route::put('market-products/{id}/image', [App\Http\Controllers\Api\MarketProductController::class, 'updateImage']);

    // Sync Events
    Route::get('sync-events', function () {
        return App\Models\SyncEvent::latest()->limit(100)->get();
    });
});

require __DIR__.'/settings.php';
