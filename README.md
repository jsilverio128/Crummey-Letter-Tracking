# Crummey Letter Tracking

This is a Next.js (App Router) TypeScript app for tracking ILIT policies and Crummey letters.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000

Notes

- Upload an Excel file (.xlsx or .xls) using the Upload button.
- After selecting a file you'll be shown a column-mapping dialog. Map your spreadsheet columns to the ILIT fields and import.
- Data is stored in `localStorage` (no backend database).
- You can filter, sort, edit, mark letters sent, and export CSV.

If `npm install` fails in your environment, ensure the Node/npm registry is reachable or run the commands on a machine with network access to the npm registry.
