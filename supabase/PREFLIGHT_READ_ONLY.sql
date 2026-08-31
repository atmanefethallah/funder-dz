-- Funder database preflight — READ ONLY
-- Run in Supabase SQL Editor before migration 0005 and save the output.
BEGIN READ ONLY;

SELECT current_database() AS database_name, current_schema() AS schema_name, version() AS postgres_version;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT relname AS table_name, n_live_tup AS estimated_rows
FROM pg_stat_user_tables
ORDER BY relname;

-- Safety checks for balances and unique legacy tokens.
SELECT COUNT(*) AS negative_balances FROM "User" WHERE "balance" < 0;
SELECT COUNT(*) AS duplicate_qr_groups
FROM (SELECT "qrToken" FROM "Booking" WHERE "qrToken" IS NOT NULL GROUP BY "qrToken" HAVING COUNT(*) > 1) duplicates;
SELECT COUNT(*) AS orphan_bookings
FROM "Booking" b
LEFT JOIN "User" u ON u."id" = b."userId"
LEFT JOIN "Place" p ON p."id" = b."placeId"
WHERE u."id" IS NULL OR p."id" IS NULL;

ROLLBACK;
