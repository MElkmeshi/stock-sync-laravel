<?php

use App\Console\Commands\SyncStockCommand;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Setting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Run stock sync every minute if enabled
        $schedule->command(SyncStockCommand::class, ['--once'])
            ->everyMinute()
            ->when(function () {
                return Setting::get('sync_enabled', false);
            })
            ->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
