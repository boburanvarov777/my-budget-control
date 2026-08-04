/**
 * Foydalanuvchilarni ko'rish va o'chirish uchun skript.
 *
 * Ishlatish (Railway shell yoki lokal, DATABASE_URL o'rnatilgan holda):
 *
 *   npx ts-node scripts/db-admin.ts list
 *       -> barcha userlar va ularning yozuvlari soni
 *
 *   npx ts-node scripts/db-admin.ts show <username|firstName|telegramId|phone>
 *       -> bitta userning batafsil ma'lumoti (hech narsa o'chirilmaydi)
 *
 *   npx ts-node scripts/db-admin.ts delete <username|firstName|telegramId|phone> --yes
 *       -> userni VA uning barcha yozuvlarini o'chiradi (cascade).
 *          --yes bo'lmasa faqat nima o'chishini ko'rsatadi, o'chirmaydi.
 *
 * DIQQAT: user o'chirilganda uning barcha daromad/harajat/kredit/qarz
 * yozuvlari ham cascade bo'yicha o'chadi. Shuning uchun `delete` avval
 * "dry run" qiladi va faqat --yes bilan haqiqatan o'chiradi.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Command = 'list' | 'show' | 'delete';

interface UserCounts {
  incomes: number;
  expenses: number;
  credits: number;
  microLoans: number;
  installments: number;
  goals: number;
  savings: number;
  budgetPlans: number;
  categories: number;
  notifications: number;
}

const USER_SUMMARY_SELECT = {
  id: true,
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
  _count: {
    select: {
      incomes: true,
      expenses: true,
      credits: true,
      microLoans: true,
      installments: true,
      goals: true,
      savings: true,
      budgetPlans: true,
      categories: true,
      notifications: true,
    },
  },
} as const;

function totalRecords(counts: UserCounts): number {
  return (Object.keys(counts) as (keyof UserCounts)[]).reduce(
    (sum, key) => sum + counts[key],
    0,
  );
}

function findWhere(query: string) {
  // Telefon raqami har xil formatda saqlangan bo'lishi mumkin, shuning uchun
  // faqat raqamlar bo'yicha ham qidiramiz.
  const digits = query.replace(/\D/g, '');
  return {
    OR: [
      { username: { equals: query, mode: 'insensitive' as const } },
      { firstName: { equals: query, mode: 'insensitive' as const } },
      { telegramId: query },
      ...(digits ? [{ phone: { contains: digits } }] : []),
    ],
  };
}

function printUser(user: {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  _count: UserCounts;
}) {
  const name = user.username ? `@${user.username}` : (user.firstName ?? '—');
  console.log(
    [
      `  ${name}`,
      `    id=${user.id}`,
      `    telegramId=${user.telegramId}  phone=${user.phone ?? '—'}  role=${user.role}`,
      `    ro'yxatdan o'tgan: ${user.createdAt.toISOString()}`,
      `    yozuvlar: jami ${totalRecords(user._count)} ` +
        `(daromad ${user._count.incomes}, harajat ${user._count.expenses}, ` +
        `kredit ${user._count.credits}, mikroqarz ${user._count.microLoans}, ` +
        `muddatli ${user._count.installments}, maqsad ${user._count.goals}, ` +
        `jamg'arma ${user._count.savings}, byudjet ${user._count.budgetPlans})`,
    ].join('\n'),
  );
}

async function list() {
  const users = await prisma.user.findMany({
    select: USER_SUMMARY_SELECT,
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log("Bazada birorta ham foydalanuvchi yo'q.");
    return;
  }

  console.log(`Jami ${users.length} ta foydalanuvchi:\n`);
  for (const user of users) printUser(user);
}

async function show(query: string) {
  const user = await prisma.user.findFirst({
    where: findWhere(query),
    select: USER_SUMMARY_SELECT,
  });

  if (!user) {
    console.log(`Topilmadi: ${query}`);
    return;
  }
  printUser(user);
}

async function remove(query: string, confirmed: boolean) {
  const user = await prisma.user.findFirst({
    where: findWhere(query),
    select: USER_SUMMARY_SELECT,
  });

  if (!user) {
    console.log(`Topilmadi: ${query} — hech narsa o'chirilmadi.`);
    return;
  }

  console.log("O'chiriladigan foydalanuvchi:\n");
  printUser(user);

  if (!confirmed) {
    console.log(
      `\nBu faqat ko'rsatish (dry run). Haqiqatan o'chirish uchun:\n` +
        `  npx ts-node scripts/db-admin.ts delete ${query} --yes`,
    );
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(
    `\n✅ O'chirildi: ${user.username ?? user.firstName ?? user.telegramId} ` +
      `(${totalRecords(user._count)} ta yozuvi bilan birga).`,
  );
}

function usage(): never {
  console.error(
    [
      'Ishlatish:',
      '  npx ts-node scripts/db-admin.ts list',
      '  npx ts-node scripts/db-admin.ts show <username|telegramId|phone>',
      '  npx ts-node scripts/db-admin.ts delete <username|telegramId|phone> [--yes]',
    ].join('\n'),
  );
  process.exit(1);
}

async function main() {
  const [rawCommand, rawQuery] = process.argv.slice(2);
  const command = rawCommand?.trim() as Command | undefined;
  const confirmed = process.argv.includes('--yes');

  if (!command) usage();

  switch (command) {
    case 'list':
      return list();
    case 'show':
      if (!rawQuery) usage();
      return show(rawQuery.trim());
    case 'delete':
      if (!rawQuery) usage();
      return remove(rawQuery.trim(), confirmed);
    default:
      usage();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
