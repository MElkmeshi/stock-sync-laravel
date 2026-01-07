<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MarketDbService
{
    protected string $connectionName = 'market';

    public function __construct()
    {
        $this->configureConnection();
    }

    protected function configureConnection(): void
    {
        $config = [
            'driver' => 'sqlsrv',
            'host' => Setting::get('db_server', '127.0.0.1'),
            'port' => Setting::get('db_port', 1433),
            'database' => Setting::get('db_name', 'Market'),
            'username' => Setting::get('db_user', 'sa'),
            'password' => Setting::get('db_password', 'MyStr0ngP@ssw0rd!'),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
        ];

        config(["database.connections.{$this->connectionName}" => $config]);
    }

    public function testConnection(): bool
    {
        Log::info('Testing Market DB connection with settings:', [
            'host' => Setting::get('db_server', '127.0.0.1'),
            'port' => Setting::get('db_port', 1433),
            'database' => Setting::get('db_name', 'Market'),
            'username' => Setting::get('db_user', 'sa'),
        ]);

        try {
            // Try using tsql command (FreeTDS) as fallback for Mac ARM
            Log::info('Attempting tsql connection...');
            $result = $this->executeTsql('SELECT 1 as test');

            Log::info('Tsql result:', ['result' => $result]);

            if ($result && count($result) > 0) {
                Log::info('Market DB connection successful (using FreeTDS)');
                return true;
            }

            Log::warning('Tsql returned empty result, trying PDO...');

            // Try standard PDO connection
            DB::connection($this->connectionName)->getPdo();
            Log::info('Market DB connection successful (using PDO)');

            return true;
        } catch (\Exception $e) {
            Log::error('Market DB connection failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Throw exception instead of returning false
        }
    }

    public function getStockLevels(): array
    {
        $query = Setting::get('stock_query', $this->getDefaultStockQuery());

        try {
            // Try FreeTDS first (works on Mac ARM)
            try {
                $results = $this->executeTsql($query);
            } catch (\Exception $tsqlException) {
                // Fallback to PDO if tsql fails
                $results = DB::connection($this->connectionName)->select($query);
            }

            $stockLevels = [];
            foreach ($results as $row) {
                $stockLevels[] = [
                    'pos_product_id' => (string) ($row->pos_product_id ?? $row->Pno ?? ''),
                    'product_name' => $row->product_name ?? $row->PName ?? 'Unknown',
                    'stock_quantity' => (int) ($row->stock_quantity ?? $row->Qnt ?? 0),
                ];
            }

            return $stockLevels;
        } catch (\Exception $e) {
            Log::error('Failed to query stock levels: '.$e->getMessage());
            throw new \Exception('Failed to query stock levels: '.$e->getMessage());
        }
    }

    protected function getDefaultStockQuery(): string
    {
        return <<<'SQL'
            SELECT
                Pno as pos_product_id,
                PName as product_name,
                ISNULL(Qnt, 0) as stock_quantity
            FROM Pieces
        SQL;
    }

    public function getTableColumns(string $tableName): array
    {
        try {
            $query = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?';
            $results = DB::connection($this->connectionName)->select($query, [$tableName]);

            return array_map(fn ($row) => $row->COLUMN_NAME, $results);
        } catch (\Exception $e) {
            Log::error("Failed to get columns for table {$tableName}: ".$e->getMessage());

            return [];
        }
    }

    public function getTables(): array
    {
        try {
            $query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'";
            $results = DB::connection($this->connectionName)->select($query);

            return array_map(fn ($row) => $row->TABLE_NAME, $results);
        } catch (\Exception $e) {
            Log::error('Failed to get tables: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Execute SQL query using FreeTDS tsql command (fallback for Mac ARM without ODBC drivers)
     */
    protected function executeTsql(string $query): array
    {
        $host = Setting::get('db_server', '127.0.0.1');
        $port = Setting::get('db_port', 1433);
        $database = Setting::get('db_name', 'Market');
        $username = Setting::get('db_user', 'sa');
        $password = Setting::get('db_password', 'MyStr0ngP@ssw0rd!');

        Log::debug('Executing tsql command', [
            'host' => $host,
            'port' => $port,
            'database' => $database,
            'username' => $username,
            'query' => $query,
        ]);

        // Escape query for heredoc
        $query = str_replace("'", "''", $query);

        // Build tsql command with UTF-8 locale
        $cmd = sprintf(
            "LANG=en_US.UTF-8 tsql -H %s -p %d -U %s -P %s -D %s 2>&1 <<'EOF'\n%s\nGO\nEXIT\nEOF\n",
            escapeshellarg($host),
            $port,
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            $query
        );

        Log::debug('Tsql command built (password hidden)');

        // Execute command
        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);

        Log::debug('Tsql execution completed', [
            'return_code' => $returnCode,
            'output_lines' => count($output),
            'output' => $output,
        ]);

        if ($returnCode !== 0) {
            $errorOutput = implode("\n", $output);
            Log::error('Tsql command failed', ['output' => $errorOutput]);
            throw new \Exception('Failed to execute tsql command: '.$errorOutput);
        }

        // Parse output (skip locale lines and parse results)
        return $this->parseTsqlOutput($output);
    }

    protected function parseTsqlOutput(array $lines): array
    {
        $results = [];
        $headerParsed = false;
        $headers = [];

        foreach ($lines as $line) {
            // Trim each line first
            $line = trim($line);

            // Skip empty lines
            if ($line === '') {
                continue;
            }

            // Skip locale lines
            if (str_starts_with($line, 'locale') || str_starts_with($line, 'using default')) {
                continue;
            }

            // Remove prompt prefixes (e.g., "1> 2> test" -> "test")
            $line = preg_replace('/^(\d+>\s*)+/', '', $line);

            // Skip empty lines after removing prompts
            if (trim($line) === '') {
                continue;
            }

            // Skip "Setting ... as default database" lines
            if (str_starts_with($line, 'Setting') && str_contains($line, 'default database')) {
                continue;
            }

            // Skip "affected" lines
            if (str_contains($line, 'affected')) {
                continue;
            }

            // First non-skip line is headers
            if (! $headerParsed) {
                // Check if line contains tabs, otherwise use spaces
                if (str_contains($line, "\t")) {
                    $headers = explode("\t", trim($line));
                } else {
                    $headers = preg_split('/\s+/', trim($line));
                }
                $headerParsed = true;

                continue;
            }

            // Parse data line
            if ($headerParsed && trim($line) !== '') {
                // Use same delimiter as headers (tab or space)
                if (str_contains($line, "\t")) {
                    $values = explode("\t", trim($line));
                } else {
                    $values = preg_split('/\s+/', trim($line), count($headers));
                }

                if (count($values) === count($headers)) {
                    $row = [];
                    foreach ($headers as $index => $header) {
                        $row[$header] = $values[$index] ?? null;
                    }
                    $results[] = (object) $row;
                }
            }
        }

        return $results;
    }
}
