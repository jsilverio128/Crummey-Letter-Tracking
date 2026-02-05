import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Placeholder: client will persist to localStorage; server not required.
  return NextResponse.json({ ok: true });
}
