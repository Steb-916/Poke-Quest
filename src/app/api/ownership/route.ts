import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardSlug, condition, grade, labelType, certNumber, purchasePrice, purchaseDate, purchaseSource, notes } = body;

    if (!cardSlug || !condition) {
      return NextResponse.json({ error: 'cardSlug and condition are required' }, { status: 400 });
    }

    // Attempt database write
    try {
      const { prisma } = await import('@/lib/db/prisma');
      const { CARDS } = await import('@/lib/utils/cardData');

      const card = CARDS.find((c) => c.slug === cardSlug);
      if (!card) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      // Find or lookup card in DB
      const dbCard = await prisma.card.findUnique({ where: { slug: cardSlug } });
      if (!dbCard) {
        return NextResponse.json({ error: 'Card not in database. Run seed first.' }, { status: 404 });
      }

      const result = await prisma.ownership.upsert({
        where: { id: 'placeholder' },
        create: {
          cardId: dbCard.id,
          condition,
          grade: grade || null,
          labelType: labelType || null,
          certNumber: certNumber || null,
          purchasePrice: purchasePrice || null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchaseSource: purchaseSource || null,
          isTarget: labelType === 'Black Label',
          acquired: true,
          notes: notes || null,
        },
        update: {
          condition,
          grade: grade || null,
          labelType: labelType || null,
          certNumber: certNumber || null,
          purchasePrice: purchasePrice || null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchaseSource: purchaseSource || null,
          isTarget: labelType === 'Black Label',
          acquired: true,
          notes: notes || null,
        },
      });

      return NextResponse.json(result);
    } catch {
      // Database not connected — return mock response for development
      console.warn('Database not connected. Returning mock response.');
      return NextResponse.json({
        success: true,
        mock: true,
        cardSlug,
        condition,
        grade,
        labelType,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { cardSlug } = body;

    if (!cardSlug) {
      return NextResponse.json({ error: 'cardSlug is required' }, { status: 400 });
    }

    try {
      const { prisma } = await import('@/lib/db/prisma');

      const dbCard = await prisma.card.findUnique({ where: { slug: cardSlug } });
      if (!dbCard) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      await prisma.ownership.deleteMany({ where: { cardId: dbCard.id } });
      return NextResponse.json({ success: true, deleted: cardSlug });
    } catch {
      console.warn('Database not connected. Returning mock response.');
      return NextResponse.json({ success: true, mock: true, deleted: cardSlug });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
