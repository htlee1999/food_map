# Database Migration Scripts

This directory contains scripts for database migrations and maintenance tasks.

## Backfill Regions Script

The `backfill-regions.js` script automatically assigns regions to existing places in the database based on their addresses.

### Prerequisites

- Node.js installed
- `pg` npm package installed
- Database connection credentials

### Installation

```bash
# Install dependencies
npm install pg
```

### Usage

1. Set your database connection string:

```bash
export DATABASE_URL="postgresql://username:password@host:port/database"
```

2. Run the migration script:

```bash
node database/scripts/backfill-regions.js
```

### How It Works

The script:

1. Connects to your PostgreSQL database
2. Fetches all places from the `places` table
3. For each place without a region:
   - Extracts the 6-digit postal code from the address
   - Maps the postal code sector (first 2 digits) to one of Singapore's 5 regions
   - Falls back to keyword matching if no postal code is found
4. Updates the database with the classified regions

### Region Classification

Singapore is divided into 5 main regions:

- **Central**: CBD, Orchard, Marina, Toa Payoh, Bishan, etc. (Postal sectors: 01-18, 20-27, 29-42)
- **East**: Bedok, Tampines, Pasir Ris, Changi (Postal sectors: 43-52, 81)
- **West**: Jurong, Clementi, Bukit Batok (Postal sectors: 58-71)
- **North**: Woodlands, Yishun, Sembawang (Postal sectors: 72-78, 83)
- **North-East**: Sengkang, Punggol, Hougang, Ang Mo Kio (Postal sectors: 19, 28, 53-57, 79-80, 82)

### Example Output

```
Starting region backfill migration...

✅ Connected to database

📊 Found 50 total places

✅ Classified: Lao Fu Zi Zi Char -> East
✅ Classified: Ramen Keisuke Tonkotsu -> Central
⏭️  Skipped: Sushi Tei (already has region: Central)
⚠️  Failed to classify: Unknown Restaurant
   Address: No postal code available

🔄 Updating 30 places...
✅ Successfully updated 30 places

============================================================
MIGRATION SUMMARY
============================================================
Total places:        50
Updated:             30
Already had region:  15
Failed to classify:  5
============================================================

⚠️  Some places could not be classified automatically.
These will need manual region assignment through the admin interface.

✅ Migration completed successfully!
```

### Troubleshooting

**Error: DATABASE_URL environment variable is not set**
- Make sure you've exported the DATABASE_URL with your database credentials

**Error: Connection failed**
- Verify your database connection string is correct
- Check that your database is running and accessible

**Some places failed to classify**
- This is normal for addresses without postal codes
- These places can be manually assigned regions through the admin panel
- You can also update them directly in the database:
  ```sql
  UPDATE places SET region = 'Central' WHERE id = 123;
  ```

### Verifying Results

After running the script, you can verify the results:

```sql
-- Check distribution of regions
SELECT region, COUNT(*) as count
FROM places
GROUP BY region
ORDER BY count DESC;

-- Find places without regions
SELECT id, name, address
FROM places
WHERE region IS NULL OR region = '';
```
