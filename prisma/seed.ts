import { PrismaClient } from '../src/generated/prisma/client';
import { CARDS } from '../src/lib/utils/cardData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 15 cards...');

  for (const card of CARDS) {
    await prisma.card.upsert({
      where: { slug: card.slug },
      update: {
        name: card.name,
        pokemon: card.pokemon,
        set: card.set,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        artType: card.artType,
        illustrator: card.illustrator,
        hp: card.hp,
        typing: card.typing,
        stage: card.stage,
        displayOrder: card.displayOrder,
        imageUrl: card.imageUrl,
        imageUrlSmall: card.imageUrlSmall,
      },
      create: {
        slug: card.slug,
        name: card.name,
        pokemon: card.pokemon,
        set: card.set,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        artType: card.artType,
        illustrator: card.illustrator,
        hp: card.hp,
        typing: card.typing,
        stage: card.stage,
        displayOrder: card.displayOrder,
        imageUrl: card.imageUrl,
        imageUrlSmall: card.imageUrlSmall,
      },
    });
    console.log(`  ✓ ${card.name}`);
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
