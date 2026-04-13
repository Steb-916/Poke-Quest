import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { card: string; status: string; newSales?: number; error?: string }[] = [];

  try {
    const { prisma } = await import('@/lib/db/prisma');
    const { CARDS } = await import('@/lib/utils/cardData');
    const { fetchCardSoldData } = await import('@/lib/api/soldcomps');

    for (const cardMeta of CARDS) {
      try {
        const card = await prisma.card.findUnique({
          where: { slug: cardMeta.slug },
        });

        if (!card) {
          results.push({ card: cardMeta.slug, status: 'skip', error: 'Card not in DB' });
          continue;
        }

        const soldData = await fetchCardSoldData(cardMeta.name, cardMeta.cardNumber);

        let newCount = 0;
        for (const sale of soldData) {
          // Deduplicate by listingUrl
          if (sale.listingUrl) {
            const existing = await prisma.gradedSale.findFirst({
              where: { listingUrl: sale.listingUrl },
            });
            if (existing) continue;
          }

          await prisma.gradedSale.create({
            data: {
              cardId: card.id,
              date: sale.date,
              platform: sale.platform,
              grader: sale.grader,
              grade: sale.grade,
              price: sale.price,
              shippingCost: sale.shippingCost ?? null,
              listingUrl: sale.listingUrl ?? null,
            },
          });
          newCount++;
        }

        results.push({ card: cardMeta.slug, status: 'ok', newSales: newCount });
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        results.push({ card: cardMeta.slug, status: 'error', error: String(error) });
      }
    }
  } catch (error) {
    return NextResponse.json({ error: 'Database not connected', details: String(error) }, { status: 500 });
  }

  return NextResponse.json({ fetched: results.length, results });
}
