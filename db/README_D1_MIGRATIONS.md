# Cloudflare D1 Database Migration Guide

## Current Status
Your database schema already supports `gala_dinner` as an INTEGER (count), so no migration is needed for the gala dinner changes. The column `gala_dinner INTEGER DEFAULT 0` can store 0, 1, 2, or any number of tickets.

## How to Update Your Cloudflare D1 Database

### Option 1: Using Wrangler CLI (Recommended)

1. **Check your database structure:**
   ```bash
   npx wrangler d1 execute isir-registrations --local --command "PRAGMA table_info(registrations);"
   ```
   

2. **For production database:**
   ```bash
   npx wrangler d1 execute isir-registrations --command "PRAGMA table_info(registrations);"
   ```

3. **Run SQL commands directly:**
   ```bash
   # Local database
   npx wrangler d1 execute isir-registrations --local --file=./db/schema.sql
   
   # Production database
   npx wrangler d1 execute isir-registrations --file=./db/schema.sql
   ```

4. **Run a specific migration:**
   ```bash
   # Local
   npx wrangler d1 execute isir-registrations --local --file=./db/migration_add_corresponding_author.sql
   
   # Production
   npx wrangler d1 execute isir-registrations --file=./db/migration_add_corresponding_author.sql
   ```

   **If the Stripe webhook fails with "no such column: payment_intent_id":**
   ```bash
   npx wrangler d1 execute isir-registrations --file=./db/migration_add_payment_intent_id.sql
   ```

### Option 2: Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **D1**
3. Select your database: `isir-registrations`
4. Click on **"Console"** tab
5. Run SQL queries directly in the console

### Option 3: Interactive SQL Shell

```bash
# Open interactive shell for local database
npx wrangler d1 execute isir-registrations --local --interactive

# Open interactive shell for production database
npx wrangler d1 execute isir-registrations --interactive
```

## Verify Current Schema

Run this to check if `gala_dinner` column exists and its type:

```sql
PRAGMA table_info(registrations);
```

You should see `gala_dinner` as type `INTEGER` with default value `0`.

## If You Need to Create/Update the Table

If the table doesn't exist or you need to recreate it, run:

```bash
npx wrangler d1 execute isir-registrations --file=./db/schema.sql
```

**Note:** This will create tables if they don't exist (using `IF NOT EXISTS`), but won't modify existing tables. To modify existing tables, you'll need to create a migration file.

## Creating a Migration

If you ever need to modify the schema, create a new migration file:

1. Create a new file in `db/` directory, e.g., `db/migration_update_gala_dinner.sql`
2. Write your ALTER TABLE statements
3. Run it using wrangler as shown above

## Important Notes

- **Local vs Production:** Always test migrations on local database first using `--local` flag
- **Backup:** Consider exporting data before running migrations on production
- **Data Safety:** The current schema change (gala_dinner count) is backward compatible - existing boolean values (0/1) will work as counts
