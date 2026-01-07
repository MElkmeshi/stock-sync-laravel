# Stock Sync Agent - Laravel + React

A modern stock synchronization application built with Laravel 12 and React that syncs products between your Market MSSQL database and Presto food delivery platform.

## ✨ Features

- **Modern Tech Stack**: Laravel 12 + React 19 + Inertia.js + TypeScript + Tailwind CSS 4
- **Real-time Sync**: Automatic stock synchronization with configurable intervals
- **Two-way Product Management**:
  - View Market DB products and Presto catalog side-by-side
  - Easy product mapping interface
  - Import products from Presto API
- **Dashboard**: Real-time sync status and statistics
- **Settings Management**: Configure database connections, Presto API, and sync intervals
- **Event Logs**: Track all sync events and API calls
- **Authentication**: Secure login with Laravel Fortify + Sanctum

## 🚀 Getting Started

### Prerequisites
- PHP 8.4+
- Composer
- Node.js 18+
- MSSQL Server (for Market database)

### Installation

The application is already set up and running! Just access:

**http://127.0.0.1:8000**

### Default Login
Since this is a fresh installation, you'll need to create an account:
1. Click "Register" on the login page
2. Create your account
3. Log in to access the dashboard

## 📁 Project Structure

```
stock-sync-laravel/
├── app/
│   ├── Console/Commands/
│   │   └── SyncStockCommand.php      # Main sync command
│   ├── Http/Controllers/
│   │   └── Api/
│   │       ├── DashboardController.php  # Dashboard API
│   │       ├── MappingsController.php   # Product mappings
│   │       └── SettingsController.php   # Settings management
│   ├── Models/
│   │   ├── PrestoItem.php            # Presto product cache
│   │   ├── ProductMapping.php        # POS ↔ Presto mappings
│   │   ├── Setting.php               # Application settings
│   │   └── SyncEvent.php             # Sync event logs
│   └── Services/
│       ├── MarketDatabaseService.php # MSSQL connection
│       ├── PrestoApiService.php      # Presto API client
│       └── StockSyncService.php      # Sync engine
├── resources/js/Pages/
│   ├── dashboard.tsx                 # Main dashboard
│   ├── mappings.tsx                  # Product mapping UI
│   ├── settings.tsx                  # Settings page
│   └── logs.tsx                      # Event logs
└── database/migrations/              # Database schema
```

## 🎯 How to Use

### 1. Configure Settings

Go to **Settings** page and configure:

#### Database Settings
- **Server**: 127.0.0.1
- **Port**: 1433
- **Database**: Market
- **Username**: sa
- **Password**: Your MSSQL password
- **Stock Query**:
```sql
SELECT
    Pno as pos_product_id,
    PName as product_name,
    ISNULL(Qnt, 0) as stock_quantity
FROM Pieces
```

Click "Test Connection" to verify.

#### Presto API Settings
- **Base URL**: https://sys.prestoeat.com
- **Email**: Your Presto account email
- **Password**: Your Presto password

Click "Authenticate" to get an access token.

#### Sync Settings
- **Sync Interval**: 45 (seconds)
- **Poll Interval**: 45 (seconds)

Save settings.

### 2. Map Products

Go to **Mappings** page:

1. **Click "Import from Presto"** to cache all Presto products
2. **View both catalogs side-by-side**:
   - Left: Market DB products (Pno, Name, Stock)
   - Right: Presto catalog (ID, Name, Price)
3. **Create mappings**:
   - Find a Market product (note the Pno)
   - Find matching Presto item (note the ID)
   - Fill the form and click "Add Mapping"
4. **Mapped products** show with a green checkmark ✓

### 3. Start Sync

Go to **Dashboard**:

1. Click **"Start Sync"** to begin automatic synchronization
2. Monitor statistics:
   - Total products mapped
   - Products in stock / out of stock
   - Last sync time
   - Sync status
3. View recent sync events in real-time

### 4. View Logs

Go to **Logs** page to see:
- All sync events
- API calls to Presto
- Stock level changes
- Timestamps and event types

## 🔄 How Sync Works

1. **Polling**: Every 45 seconds, the sync engine:
   - Queries Market database for stock levels
   - Compares with cached state

2. **Change Detection**:
   - Detects when products cross the availability threshold (stock > 0 ↔ stock = 0)
   - Only syncs products that changed state

3. **API Update**:
   - Batch updates Presto availability
   - Implements exponential backoff retry (2s, 4s, 8s, 16s, 32s)
   - Logs all events

4. **State Cache**:
   - Remembers last known stock state
   - Prevents duplicate API calls
   - Persists across restarts

## 📊 Database Schema

### presto_items
- Caches all products from Presto API
- Updated when you click "Import from Presto"

### product_mappings
- Maps POS product IDs to Presto item IDs
- One-to-one relationship

### settings
- Stores configuration (database, API, sync intervals)
- Key-value structure

### sync_events
- Logs all sync activities
- Tracks changes and API calls

## 🛠️ Development Commands

```bash
# Start development server
php artisan serve

# Run frontend dev server (auto-rebuild)
npm run dev

# Build frontend for production
npm run build

# Run migrations
php artisan migrate

# Seed database with defaults
php artisan db:seed

# Run sync manually
php artisan sync:stock

# Run tests
php artisan test

# Format code
vendor/bin/pint
```

## 🔧 Background Sync (Production)

For production, set up Laravel scheduler in cron:

```bash
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

The scheduler is configured in `bootstrap/app.php` to run sync every 45 seconds.

## 🐛 Troubleshooting

### "Auth guard [sanctum] is not defined"
✅ Fixed! The sanctum guard has been added to `config/auth.php`

### Database connection fails
- Check MSSQL server is running
- Verify credentials in Settings page
- Test connection using "Test Connection" button

### Frontend not updating
- Run `npm run build` or `npm run dev`
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Sync not working
- Check Settings are saved
- Verify Presto authentication token is valid
- Check product mappings exist
- View Logs page for error details

## 📝 API Endpoints

All API routes are prefixed with `/api`:

- **GET** `/api/dashboard` - Get sync stats
- **POST** `/api/dashboard/toggle-sync` - Start/stop sync
- **GET** `/api/mappings` - List all mappings
- **POST** `/api/mappings` - Create mapping
- **DELETE** `/api/mappings/{id}` - Delete mapping
- **GET** `/api/settings` - Get all settings
- **POST** `/api/settings` - Update settings
- **POST** `/api/settings/test-database` - Test DB connection

## 🎨 Tech Stack Details

- **Backend**: Laravel 12, PHP 8.4
- **Frontend**: React 19, TypeScript, Inertia.js v2
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (app data), MSSQL (Market DB)
- **Authentication**: Laravel Fortify + Sanctum
- **Build Tool**: Vite 7

## 📄 License

This is a custom application built for stock synchronization with Presto.

---

Built with [Laravel Code](https://claude.com/claude-code) 🤖
