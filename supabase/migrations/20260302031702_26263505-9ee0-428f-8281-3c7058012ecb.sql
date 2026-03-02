
-- Create a demo auth user for the public test agent
INSERT INTO auth.users (id, email, created_at, updated_at, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@deployx402.xyz',
  now(), now(), 'authenticated', 'authenticated'
)
ON CONFLICT (id) DO NOTHING;
