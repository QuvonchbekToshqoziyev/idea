import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { slug: 'coding', label: 'Coding', icon: '💻' },
    { slug: 'design', label: 'Design', icon: '🎨' },
    { slug: 'carpentry', label: 'Carpentry', icon: '🪚' },
    { slug: 'writing', label: 'Writing', icon: '✍️' },
    { slug: 'music', label: 'Music', icon: '🎸' },
    { slug: 'art', label: 'Art', icon: '🖌️' },
    { slug: 'hardware', label: 'Hardware', icon: '🔩' },
    { slug: 'research', label: 'Research', icon: '🔬' },
    { slug: 'other', label: 'Other', icon: '📦' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('Categories seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
