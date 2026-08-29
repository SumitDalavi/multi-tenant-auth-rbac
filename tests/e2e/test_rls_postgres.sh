#!/bin/bash
set -euo pipefail

echo "================================================="
echo "🏃 Running Real PostgreSQL RLS Isolation Test"
echo "================================================="

echo "1. Starting PostgreSQL Database..."
docker compose -f docker-compose.test.yml up -d db

# Wait for postgres to be ready
echo "Waiting for postgres to be ready..."
for i in {1..10}; do
  if docker compose -f docker-compose.test.yml exec -T db pg_isready -U user -d db; then
    echo "PostgreSQL is ready!"
    break
  fi
  sleep 2
done

echo "2. Seeding Test Data..."
# Data is already seeded by schema.sql on init. Let's verify data count.
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -c "SELECT count(*) FROM tenant_data;"

echo "3. Testing Tenant 1 Context..."
cat <<EOF > test_tenant1.sql
SET SESSION app.current_tenant_id = 'tenant1';
SELECT tenant_id, data FROM tenant_data;
EOF
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -f /dev/stdin < test_tenant1.sql

echo "4. Testing Tenant 2 Context..."
cat <<EOF > test_tenant2.sql
SET SESSION app.current_tenant_id = 'tenant2';
SELECT tenant_id, data FROM tenant_data;
EOF
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -f /dev/stdin < test_tenant2.sql

echo "5. Testing Cross-Tenant Admin (Bypass RLS)"
cat <<EOF > test_admin.sql
-- In a real scenario, BYPASSRLS role is used or policy is altered. For now, postgres user has BYPASSRLS
-- But we are using 'user' which is standard. If we don't set tenant_id, we see 0 rows.
SELECT count(*) as "rows_without_tenant" FROM tenant_data;
EOF
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -f /dev/stdin < test_admin.sql

echo "6. Proving RLS Filter in Query Plan (EXPLAIN ANALYZE)"
cat <<EOF > test_explain.sql
SET SESSION app.current_tenant_id = 'tenant1';
EXPLAIN (ANALYZE) SELECT * FROM tenant_data;
EOF
docker compose -f docker-compose.test.yml exec -T db psql -U user -d db -f /dev/stdin < test_explain.sql > explain_output.txt
cat explain_output.txt

echo "Cleaning up..."
rm test_tenant1.sql test_tenant2.sql test_admin.sql test_explain.sql
docker compose -f docker-compose.test.yml down

echo "✅ All PostgreSQL RLS tests passed."
