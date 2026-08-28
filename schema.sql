CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base table for tenant data
CREATE TABLE IF NOT EXISTS tenant_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security
ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

-- Define RLS Policy for isolation
-- This policy ensures a user can only access rows where tenant_id matches the session variable 'app.current_tenant_id'
-- We use NULLIF to avoid errors if the setting is missing, it returns NULL which fails the comparison
CREATE POLICY tenant_isolation_policy ON tenant_data
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Insert some dummy data for testing
INSERT INTO tenant_data (tenant_id, data) VALUES ('tenant1', 'tenant1_secret_data_1');
INSERT INTO tenant_data (tenant_id, data) VALUES ('tenant1', 'tenant1_secret_data_2');
INSERT INTO tenant_data (tenant_id, data) VALUES ('tenant2', 'tenant2_secret_data_1');
INSERT INTO tenant_data (tenant_id, data) VALUES ('tenant3', 'tenant3_secret_data_1');
