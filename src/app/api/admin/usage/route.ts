import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db/prisma');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [pokemontcgToday, pricetrackerToday, soldcompsMonth] = await Promise.all([
      prisma.apiUsage.count({ where: { service: 'pokemontcg', date: { gte: startOfDay } } }),
      prisma.apiUsage.count({ where: { service: 'pricetracker', date: { gte: startOfDay } } }),
      prisma.apiUsage.count({ where: { service: 'soldcomps', date: { gte: startOfMonth } } }),
    ]);

    return NextResponse.json({
      pokemontcg: { used: pokemontcgToday, limit: 18000, period: 'day' },
      pricetracker: { used: pricetrackerToday, limit: 85, period: 'day' },
      soldcomps: { used: soldcompsMonth, limit: 22, period: 'month' },
    });
  } catch {
    return NextResponse.json({
      pokemontcg: { used: 0, limit: 18000, period: 'day' },
      pricetracker: { used: 0, limit: 85, period: 'day' },
      soldcomps: { used: 0, limit: 22, period: 'month' },
    });
  }
}
