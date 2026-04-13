import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prisma } = await import('@/lib/db/prisma');

    const card = await prisma.card.findUnique({ where: { slug: body.cardSlug } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const result = await prisma.gradedSale.create({
      data: {
        cardId: card.id,
        date: new Date(body.date),
        platform: body.platform,
        grader: body.grader,
        grade: body.grade,
        price: body.price,
        shippingCost: body.shippingCost || null,
        listingUrl: body.listingUrl || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { prisma } = await import('@/lib/db/prisma');

    await prisma.gradedSale.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db/prisma');
    const sales = await prisma.gradedSale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { card: { select: { name: true, slug: true } } },
    });
    return NextResponse.json(sales);
  } catch {
    return NextResponse.json([]);
  }
}
