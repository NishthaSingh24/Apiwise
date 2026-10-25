-- Flyway Migration V2__seed_demo_account.sql
-- Seed default demo user and workspace

INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'demo@apiwise.dev',
    '$2a$10$EznCDaE60bckRHHYDJwHxOxnL.aVNfKq0b1BMGR92wtrp18Ar.Eym',
    'Demo Lead Engineer',
    'ROLE_USER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO workspaces (id, name, slug, description, owner_id, created_at, updated_at)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Demo Showcase Workspace',
    'demo-showcase-ws',
    'Pre-loaded demo workspace with sample test suites',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at, updated_at)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'OWNER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO environments (id, workspace_id, name, is_default, created_at, updated_at)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Development',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO environment_variables (id, environment_id, var_key, var_value, is_secret, enabled, created_at, updated_at)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'baseUrl',
    'https://httpbin.org',
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'E-Commerce & Orders API',
    'Core microservices demo endpoints and test suite',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO collections (id, project_id, parent_id, name, description, order_index, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    NULL,
    'Payment & Checkout',
    'Order verification requests and assertions',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO api_requests (id, collection_id, name, description, method, url, query_params, headers, auth_config, body_type, body_content, order_index, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Get Sample Slideshow JSON',
    'Verifies public JSON slideshow endpoint',
    'GET',
    'https://httpbin.org/json',
    '[]',
    '[{"key":"Accept","value":"application/json","enabled":true}]',
    '{}',
    'NONE',
    NULL,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assertions (id, api_request_id, name, assertion_type, target, operator, expected_value, enabled, order_index, created_at, updated_at)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Status code is 200',
    'STATUS_CODE',
    NULL,
    'EQUALS',
    '200',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;
