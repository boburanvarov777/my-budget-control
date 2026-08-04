import { PrismaClient } from '@prisma/client';

const query = process.argv[2]?.trim();
if (!query) {
  console.error('Usage: npx ts-node scripts/delete-user.ts <username|firstName|telegramId>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: query, mode: 'insensitive' } },
        { firstName: { equals: query, mode: 'insensitive' } },
        { telegramId: query },
      ],
    },
  });

  if (!user) {
    console.log('Foydalanuvchi topilmadi:', query);
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(
    `O'chirildi: id=${user.id} username=${user.username} firstName=${user.firstName} telegramId=${user.telegramId}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
