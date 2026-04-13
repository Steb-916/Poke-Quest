interface RateLimitConfig {
  service: string;
  maxPerDay?: number;
  maxPerMonth?: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  pokemontcg: { service: 'pokemontcg', maxPerDay: 18000 },
  pricetracker: { service: 'pricetracker', maxPerDay: 85 },
  soldcomps: { service: 'soldcomps', maxPerMonth: 22 },
};

export async function checkRateLimit(service: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  period: string;
}> {
  const config = LIMITS[service];
  if (!config) return { allowed: true, used: 0, limit: Infinity, period: 'none' };

  try {
    const { prisma } = await import('@/lib/db/prisma');

    if (config.maxPerDay) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const used = await prisma.apiUsage.count({
        where: { service, date: { gte: startOfDay } },
      });

      return { allowed: used < config.maxPerDay, used, limit: config.maxPerDay, period: 'day' };
    }

    if (config.maxPerMonth) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const used = await prisma.apiUsage.count({
        where: { service, date: { gte: startOfMonth } },
      });

      return { allowed: used < config.maxPerMonth, used, limit: config.maxPerMonth, period: 'month' };
    }
  } catch {
    // DB not connected — allow the call
  }

  return { allowed: true, used: 0, limit: Infinity, period: 'none' };
}

export async function logApiCall(
  service: string,
  endpoint: string,
  success: boolean,
  responseMs?: number,
  creditsUsed: number = 1
) {
  try {
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.apiUsage.create({
      data: { service, endpoint, success, responseMs, creditsUsed },
    });
  } catch {
    // DB not connected — skip logging
  }
}

export function getLimits() {
  return LIMITS;
}
