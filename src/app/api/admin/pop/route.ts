import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prisma } = await import('@/lib/db/prisma');

    // Support bulk mode (array of entries) or single entry
    const entries = Array.isArray(body) ? body : [body];
    const results = [];

    for (const entry of entries) {
      const card = await prisma.card.findUnique({ where: { slug: entry.cardSlug } });
      if (!card) {
        results.push({ slug: entry.cardSlug, status: 'error', error: 'Card not found' });
        continue;
      }

      // For CGC: compute grade10 as sum of three tiers for backward compatibility
      const cgcPerfect10 = entry.cgcPerfect10 || 0;
      const cgcPristine10 = entry.cgcPristine10 || 0;
      const cgcGemMint10 = entry.cgcGemMint10 || 0;
      const grade10 = entry.grader === 'CGC'
        ? (entry.grade10 || (cgcPerfect10 + cgcPristine10 + cgcGemMint10))
        : (entry.grade10 || 0);

      const result = await prisma.popSnapshot.create({
        data: {
          cardId: card.id,
          grader: entry.grader,
          total: entry.total || 0,
          grade10,
          blackLabel: entry.blackLabel || 0,
          grade95: entry.grade95 || 0,
          grade9: entry.grade9 || 0,
          grade85: entry.grade85 || 0,
          grade8: entry.grade8 || 0,
          grade7AndBelow: entry.grade7AndBelow || 0,
          authentic: entry.authentic || 0,
          cgcPerfect10,
          cgcPristine10,
          cgcGemMint10,
        },
      });

      results.push({ slug: entry.cardSlug, status: 'ok', id: result.id });
    }

    return NextResponse.json({ saved: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
