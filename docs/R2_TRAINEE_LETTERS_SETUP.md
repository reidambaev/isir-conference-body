# Cloudflare R2 Setup Guide for Trainee Letter Upload

This guide walks you through setting up Cloudflare R2 storage for the trainee/student verification letter upload feature.

## Overview

The trainee letter upload feature allows students and trainees registering for the conference to upload verification documents (PDF, JPG, PNG) that are stored in Cloudflare R2 object storage.

## Prerequisites

- Cloudflare account with Workers/Pages enabled
- Access to Cloudflare Dashboard

## Step 1: Create the R2 Bucket (Dashboard)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)

2. In the left sidebar, click **R2 Object Storage**

3. Click the **Create bucket** button

4. Enter the bucket name: `isir-trainee-letters`

5. Select your preferred location (or leave as automatic)

6. Click **Create bucket**

![R2 Create Bucket](https://developers.cloudflare.com/assets/r2-create-bucket.png)

## Step 2: Bind R2 Bucket to Your Worker (Dashboard)

1. Go to **Workers & Pages** in the left sidebar

2. Click on your Worker/Pages project (e.g., `isir-conference-2026`)

3. Go to **Settings** → **Bindings**

4. Scroll to **R2 Bucket Bindings** section

5. Click **Add binding**

6. Configure the binding:
   - **Variable name**: `TRAINEE_LETTERS_BUCKET`
   - **R2 bucket**: Select `isir-trainee-letters` from dropdown

7. Click **Save**

> **Important**: The variable name `TRAINEE_LETTERS_BUCKET` must match exactly what's used in the code.

## Step 3: Run Database Migration (Dashboard)

1. Go to **Workers & Pages** → **D1** in the left sidebar

2. Click on `isir-registrations` database

3. Click the **Console** tab

4. Paste and run each SQL statement one at a time:

```sql
ALTER TABLE registrations ADD COLUMN trainee_letter_url TEXT;
```

```sql
ALTER TABLE registrations ADD COLUMN trainee_letter_status TEXT DEFAULT 'pending';
```

```sql
ALTER TABLE registrations ADD COLUMN trainee_letter_uploaded_at INTEGER;
```

```sql
CREATE INDEX IF NOT EXISTS idx_registrations_trainee_letter_status ON registrations (trainee_letter_status);
```

5. Click **Execute** after each statement

## Step 4: Deploy the Application

After adding the R2 binding in the dashboard, redeploy your application:

**Option A: Via Dashboard**

1. Go to **Workers & Pages**
2. Select your project
3. Go to **Deployments**
4. Click **Retry deployment** on the latest deployment

**Option B: Via CLI**

```bash
npm run build
wrangler pages deploy dist
```

## Step 5: Verify the Setup

1. Go to your deployed site
2. Start a registration and select a trainee/student ticket
3. You should see the "Upload Verification Letter" step
4. Upload a test file (PDF, JPG, or PNG under 5MB)
5. Check R2 bucket in dashboard to confirm file appears

---

## Alternative: CLI Setup

If you prefer using the command line:

### Create Bucket via CLI

```bash
wrangler r2 bucket create isir-trainee-letters
```

### Verify Bucket

```bash
wrangler r2 bucket list
```

### Run Migration via CLI

```bash
wrangler d1 execute isir-registrations --file=./db/migration_add_trainee_letter.sql
```

---

## Wrangler Configuration Reference

The `wrangler.jsonc` file should have this R2 binding:

```jsonc
{
  // ... other config
  "r2_buckets": [
    {
      "binding": "TRAINEE_LETTERS_BUCKET",
      "bucket_name": "isir-trainee-letters",
    },
  ],
}
```

The `binding` name (`TRAINEE_LETTERS_BUCKET`) is how you access the bucket in your Worker code via `env.TRAINEE_LETTERS_BUCKET`.

## Step 4: Run Database Migration

Apply the database migration to add the trainee letter columns:

```bash
wrangler d1 execute isir-registrations --file=./db/migration_add_trainee_letter.sql
```

Or execute the SQL directly in the Cloudflare Dashboard:

1. Go to **Workers & Pages** → **D1**
2. Select `isir-registrations` database
3. Click **Console**
4. Run the migration SQL:

```sql
ALTER TABLE registrations ADD COLUMN trainee_letter_url TEXT;
ALTER TABLE registrations ADD COLUMN trainee_letter_status TEXT DEFAULT 'pending';
ALTER TABLE registrations ADD COLUMN trainee_letter_uploaded_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_registrations_trainee_letter_status ON registrations (trainee_letter_status);
```

## Step 5: Deploy the Application

Deploy your updated Worker with the R2 binding:

```bash
npm run build
wrangler deploy
```

Or for Pages deployment:

```bash
npm run build
wrangler pages deploy dist
```

## Step 6: Verify the Setup

1. Start local development:

   ```bash
   npm run dev
   ```

2. Navigate to registration and select a trainee/student ticket type

3. You should see the new "Upload Verification Letter" step

4. Try uploading a test file (PDF, JPG, or PNG under 5MB)

## Optional: Set Up Public Access for Admin Review

If you need to view uploaded files from an admin panel, you can:

### Option A: Use Signed URLs (Recommended for Security)

The uploaded files remain private, and you generate temporary signed URLs when needed:

```javascript
// In your admin API endpoint
const signedUrl = await env.TRAINEE_LETTERS_BUCKET.createSignedUrl(fileName, {
  expiresIn: 3600, // 1 hour
});
```

### Option B: Enable Public Access

**⚠️ Not recommended for sensitive documents**

1. In Cloudflare Dashboard, go to **R2**
2. Select `isir-trainee-letters` bucket
3. Go to **Settings** → **Public access**
4. Enable public access and note the public URL

## File Structure

Uploaded files are stored with the following naming convention:

```
trainee-letters/{sanitized_email}_{timestamp}_{random_id}.{extension}
```

Example: `trainee-letters/john_doe_example_com_1708123456789_ABC123DEF.pdf`

## Custom Metadata

Each uploaded file includes the following metadata:

- `email`: Registrant's email address
- `registrationType`: The ticket type (trainee-member or trainee-non-member)
- `uploadedAt`: ISO timestamp of upload
- `originalName`: Original filename

## Admin Review Workflow

The `trainee_letter_status` column tracks the review status:

| Status         | Description               |
| -------------- | ------------------------- |
| `pending`      | Uploaded, awaiting review |
| `approved`     | Verified as valid         |
| `rejected`     | Document not accepted     |
| `not_required` | Non-trainee registration  |

## Troubleshooting

### "File storage not configured" Error

This means the R2 bucket binding is not available. Check:

1. The bucket exists: `wrangler r2 bucket list`
2. The binding is in `wrangler.jsonc`
3. You've redeployed after adding the binding

### Upload Fails with CORS Error

Ensure the API endpoint handles OPTIONS preflight requests. The worker includes CORS headers.

### Files Not Appearing in Bucket

1. Check the Workers logs in Cloudflare Dashboard
2. Verify the bucket name matches exactly in `wrangler.jsonc`
3. Ensure the file meets size/type requirements

## Local Development

For local development, R2 bindings work with `wrangler dev`:

```bash
wrangler dev
```

Files uploaded locally are stored in `.wrangler/state/r2/` directory.

## Security Considerations

1. **File Type Validation**: Only PDF, JPG, and PNG files are accepted
2. **File Size Limit**: Maximum 5MB per file
3. **Private by Default**: R2 buckets are private unless explicitly made public
4. **Metadata Storage**: Email and upload timestamp are stored for audit purposes

## API Endpoints

### Upload Trainee Letter

**Endpoint**: `POST /api/upload-trainee-letter`

**Content-Type**: `multipart/form-data`

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The document to upload |
| `email` | String | Yes | Registrant's email |
| `registrationType` | String | No | Ticket type |

**Response (Success)**:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileUrl": "trainee-letters/...",
  "fileName": "trainee-letters/..."
}
```

**Response (Error)**:

```json
{
  "success": false,
  "error": "Error description"
}
```
