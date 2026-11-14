SELECT table_schema, table_name
FROM information_schema.tables
WHERE LOWER(table_name) = 'user';

-- Dummy users for GoGoRent (PostgreSQL)
-- Shared password for all: password
-- Hash: bcrypt cost 10
INSERT INTO 'User' (
  "id",
  "name",
  "email",
  "passwordHash",
  "phone",
  "avatarUrl",
  "location",
  "bio",
  "role",
  "status",
  "isVerified",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'clseeduser000000000001',
    'Admin GoGo',
    'admin@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '0810000001',
    NULL,
    'Bangkok',
    'Platform administrator',
    'ADMIN',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ),
  (
    'clseeduser000000000002',
    'Somchai Owner',
    'somchai.owner@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '0810000002',
    NULL,
    'Chiang Mai',
    'Camera and drone rentals',
    'OWNER',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ),
  (
    'clseeduser000000000003',
    'Nicha Owner',
    'nicha.owner@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '0810000003',
    NULL,
    'Phuket',
    'Camping and outdoor gear',
    'OWNER',
    'ACTIVE',
    false,
    NOW(),
    NOW()
  ),
  (
    'clseeduser000000000004',
    'Arun Renter',
    'arun.renter@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '0810000004',
    NULL,
    'Bangkok',
    'Weekend camper',
    'RENTER',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ),
  (
    'clseeduser000000000005',
    'Mali Renter',
    'mali.renter@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '0810000005',
    NULL,
    'Nonthaburi',
    NULL,
    'RENTER',
    'ACTIVE',
    false,
    NOW(),
    NOW()
  ),
  (
    'clseeduser000000000006',
    'Suspended User',
    'suspended@gogorent.test',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NULL,
    NULL,
    NULL,
    'Test suspended account',
    'RENTER',
    'SUSPENDED',
    false,
    NOW(),
    NOW()
  );