import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { path } = await request.json();

    if (!path || typeof path !== 'string' || !path.startsWith('/api/cron/')) {
      return NextResponse.json({ error: 'Invalid cron path' }, { status: 400 });
    }

    // Build absolute URL from the request
    const url = new URL(path, request.url);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
