import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { card: string; status: string; error?: string }[] = [];

  try {
    const { prisma } = await import('@/lib/db/prisma');
    const { CARDS } = await import('@/lib/utils/cardData');
    const { fetchCardPrices } = await import('@/lib/api/pricetracker');

    for (const cardMeta of CARDS) {
      try {
        const card = await prisma.card.findUnique({
          where: { slug: cardMeta.slug },
        });

        if (!card) {
          results.push({ card: cardMeta.slug, status: 'skip', error: 'Card not in DB' });
          continue;
        }

        const priceData = await fetchCardPrices(cardMeta.name, cardMeta.set, cardMeta.cardNumber);

        if (priceData) {
          await prisma.priceSnapshot.create({
            data: {
              cardId: card.id,
              source: 'pricetracker',
              rawMarket: priceData.rawMarket ?? null,
              rawLow: priceData.rawLow ?? null,
              rawMid: priceData.rawMid ?? null,
              rawHigh: priceData.rawHigh ?? null,
              psa10: priceData.psa10 ?? null,
              psa9: priceData.psa9 ?? null,
            },
          });
          results.push({ card: cardMeta.slug, status: 'ok' });
        } else {
          results.push({ card: cardMeta.slug, status: 'no-data' });
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (error) {
        results.push({ card: cardMeta.slug, status: 'error', error: String(error) });
      }
    }
  } catch (error) {
    return NextResponse.json({ error: 'Database not connected', details: String(error) }, { status: 500 });
  }

  return NextResponse.json({ fetched: results.length, results });
}
