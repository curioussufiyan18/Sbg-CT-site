AWS SBGL MANUU Hiring Site - Vercel + Supabase

Project files:
- index.html: your original hiring website, updated to submit to /api/apply
- api/apply.js: secure Vercel serverless API
- package.json: Supabase dependency

Deploy:
1. Upload these files to a GitHub repository, preserving the api folder.
2. Import the repository into Vercel. Framework preset: Other.
3. In Vercel Project Settings > Environment Variables, add:
   SUPABASE_URL = your Supabase project URL
   SUPABASE_SECRET_KEY = your Supabase secret key (sb_secret_...)
4. Apply to Production, Preview and Development if needed. Save, then redeploy.
5. Test a submission and verify it appears in Supabase > Table Editor > applications.

Never put the Supabase secret key in index.html or share it publicly.
