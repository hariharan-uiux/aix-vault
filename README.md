# AIX Vault

A single-screen directory for developer and design tools.

The interface stays on `/`. Search, filters, collections, saved items, resource details, and add-resource all happen in the same shell.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Catalog data ships as local seed data so the app is usable immediately.
- Saves, collections, and added resources persist in the browser.
- `/auth` stores a local session. Production Google and email auth belong in Supabase.
- `db/migrations/001_init.sql` is the PostgreSQL schema and RLS policies.
- Copy `.env.example` to `.env.local` when connecting Supabase.

Keyboard: `/` or `⌘K` / `Ctrl+K` opens search.
