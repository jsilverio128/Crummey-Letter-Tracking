import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This route is a placeholder; parsing happens client-side with XLSX.
  return NextResponse.json({ ok: true });
}
