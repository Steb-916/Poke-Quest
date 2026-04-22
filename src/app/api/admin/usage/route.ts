import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db/prisma');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [pricetrackerToday, soldcompsMonth] = await Promise.all([
      prisma.apiUsage.count({ where: { service: 'pricetracker', date: { gte: startOfDay } } }),
      prisma.apiUsage.count({ where: { service: 'soldcomps', date: { gte: startOfMonth } } }),
    ]);

    return NextResponse.json({
      pricetracker: { used: pricetrackerToday, limit: 85, period: 'day' },
      soldcomps: { used: soldcompsMonth, limit: 22, period: 'month' },
    });
  } catch {
    return NextResponse.json({
      pricetracker: { used: 0, limit: 85, period: 'day' },
      soldcomps: { used: 0, limit: 22, period: 'month' },
    });
  }
}
