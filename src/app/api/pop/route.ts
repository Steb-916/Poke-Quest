import { NextResponse } from 'next/server';
import { validatePopSubmission } from '@/lib/api/psapop';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!validatePopSubmission(body)) {
      return NextResponse.json(
        { error: 'Invalid pop data. Required: cardSlug, grader, total, grade10' },
        { status: 400 }
      );
    }

    try {
      const { prisma } = await import('@/lib/db/prisma');

      const card = await prisma.card.findUnique({ where: { slug: body.cardSlug } });
      if (!card) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }

      const result = await prisma.popSnapshot.create({
        data: {
          cardId: card.id,
          grader: body.grader,
          total: body.total,
          grade10: body.grade10,
          blackLabel: body.blackLabel ?? 0,
          grade95: body.grade95 ?? 0,
          grade9: body.grade9 ?? 0,
          grade85: body.grade85 ?? 0,
          grade8: body.grade8 ?? 0,
          grade7AndBelow: body.grade7AndBelow ?? 0,
          authentic: body.authentic ?? 0,
        },
      });

      return NextResponse.json(result);
    } catch {
      console.warn('Database not connected. Returning mock response.');
      return NextResponse.json({ success: true, mock: true, ...body });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
