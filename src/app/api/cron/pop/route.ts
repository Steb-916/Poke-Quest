import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // PSA pop data is primarily entered manually via /api/pop.
  // This cron route is a placeholder for future automated PSA scraping
  // (e.g., via Apify actor).

  return NextResponse.json({
    message: 'PSA pop cron — automated scraping not yet configured. Use POST /api/pop for manual entry.',
    timestamp: new Date().toISOString(),
  });
}
