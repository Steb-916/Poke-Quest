import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prisma } = await import('@/lib/db/prisma');

    const card = await prisma.card.findUnique({ where: { slug: body.cardSlug } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const result = await prisma.priceSnapshot.create({
      data: {
        cardId: card.id,
        source: body.source || 'manual',
        rawLow: body.rawLow || null,
        rawMid: body.rawMid || null,
        rawHigh: body.rawHigh || null,
        rawMarket: body.rawMarket || null,
        psa10: body.psa10 || null,
        psa9: body.psa9 || null,
        bgs10Pristine: body.bgs10Pristine || null,
        bgs10BlackLabel: body.bgs10BlackLabel || null,
        bgs95: body.bgs95 || null,
        cgc10Perfect: body.cgc10Perfect || null,
        cgc10Pristine: body.cgc10Pristine || null,
        cgc95: body.cgc95 || null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
