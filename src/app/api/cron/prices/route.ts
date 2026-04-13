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
    const { fetchCardData } = await import('@/lib/api/pokemontcg');

    for (const cardMeta of CARDS) {
      try {
        const tcgData = await fetchCardData(cardMeta.setCode, cardMeta.cardNumber);

        const card = await prisma.card.findUnique({
          where: { slug: cardMeta.slug },
        });

        if (!card) {
          results.push({ card: cardMeta.slug, status: 'skip', error: 'Card not in DB' });
          continue;
        }

        const prices = tcgData?.tcgplayer?.prices;
        const holofoil = prices?.holofoil;

        await prisma.priceSnapshot.create({
          data: {
            cardId: card.id,
            source: 'tcgplayer',
            rawLow: holofoil?.low ?? null,
            rawMid: holofoil?.mid ?? null,
            rawHigh: holofoil?.high ?? null,
            rawMarket: holofoil?.market ?? null,
          },
        });

        results.push({ card: cardMeta.slug, status: 'ok' });
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
