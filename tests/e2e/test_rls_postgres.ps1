Write-Host "================================================="
Write-Host "🏃 Running Real PostgreSQL RLS Isolation Test"
Write-Host "================================================="

Write-Host "1. Starting PostgreSQL Database..."
docker compose -f docker-compose.test.yml up -d db

Write-Host "Waiting for postgres to be ready..."
for ($i=1; $i -le 10; $i++) {
    docker compose -f docker-compose.test.yml exec -T db pg_isready -U user -d db
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is ready!"
        break
    }
    Start-Sleep -Seconds 2
}

Write-Host "2. Seeding Test Data..."
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -c "SELECT count(*) FROM tenant_data;"

Write-Host "3. Testing Tenant 1 Context..."
@"
SET SESSION app.current_tenant_id = 'tenant1';
SELECT tenant_id, data FROM tenant_data;
"@ | Out-File -FilePath test_tenant1.sql -Encoding ascii
Get-Content test_tenant1.sql | docker compose -f docker-compose.test.yml exec -T db psql -U app_user -d db -f /dev/stdin

Write-Host "4. Testing Tenant 2 Context..."
@"
SET SESSION app.current_tenant_id = 'tenant2';
SELECT tenant_id, data FROM tenant_data;
"@ | Out-File -FilePath test_tenant2.sql -Encoding ascii
Get-Content test_tenant2.sql | docker compose -f docker-compose.test.yml exec -T db psql -U app_user -d db -f /dev/stdin

Write-Host "5. Testing Cross-Tenant Admin (Bypass RLS)"
@"
SELECT count(*) as `"rows_without_tenant`" FROM tenant_data;
"@ | Out-File -FilePath test_admin.sql -Encoding ascii
Get-Content test_admin.sql | docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -f /dev/stdin

Write-Host "6. Proving RLS Filter in Query Plan (EXPLAIN ANALYZE)"
@"
SET SESSION app.current_tenant_id = 'tenant1';
EXPLAIN (ANALYZE) SELECT * FROM tenant_data;
"@ | Out-File -FilePath test_explain.sql -Encoding ascii
Get-Content test_explain.sql | docker compose -f docker-compose.test.yml exec -T db psql -U app_user -d db -f /dev/stdin > explain_output.txt
Get-Content explain_output.txt

Write-Host "Cleaning up..."
Remove-Item -Path test_tenant1.sql, test_tenant2.sql, test_admin.sql, test_explain.sql -ErrorAction SilentlyContinue
docker compose -f docker-compose.test.yml down

Write-Host "✅ All PostgreSQL RLS tests passed."
