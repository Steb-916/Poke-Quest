import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardSlug = searchParams.get('cardSlug');
    const grader = searchParams.get('grader');

    if (!cardSlug) {
      return NextResponse.json({ error: 'cardSlug required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db/prisma');

    const card = await prisma.card.findUnique({ where: { slug: cardSlug } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const where: Record<string, unknown> = { cardId: card.id };
    if (grader) where.grader = grader;

    const snapshots = await prisma.popSnapshot.findMany({
      where,
      orderBy: { date: 'desc' },
      distinct: ['grader'],
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
