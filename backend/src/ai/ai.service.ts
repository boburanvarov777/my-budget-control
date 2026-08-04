import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async getAdvice(userId: string, message: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const q = message.toLowerCase();

    const [
      incomeAgg,
      expenseAgg,
      foodExpenses,
      credits,
      goals,
      microLoans,
      installments,
      savingsAgg,
      budgetPlan,
    ] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          userId,
          category: 'FOOD',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.credit.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.goal.findMany({ where: { userId } }),
      this.prisma.microLoan.findMany({ where: { userId, isPaid: false } }),
      this.prisma.installment.findMany({ where: { userId } }),
      this.prisma.saving.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.budgetPlan.findUnique({
        where: { userId_month_year: { userId, month, year } },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount ?? 0);
    const expense = Number(expenseAgg._sum.amount ?? 0);
    const foodTotal = Number(foodExpenses._sum.amount ?? 0);
    const totalDebt = credits.reduce((s, c) => s + Number(c.remainingDebt), 0);
    const installmentDebt = installments.reduce(
      (s, i) => s + Number(i.monthlyPayment) * Math.max(0, i.totalMonths - i.paidMonths),
      0,
    );
    const debt = totalDebt + installmentDebt;
    const savings = Number(savingsAgg._sum.amount ?? 0);
    const remaining = income - expense;

    const summary = { income, expense, debt, savings, remaining };
    const tips: string[] = [];

    if (this.mentions(q, ['tejash', 'jamg', 'zaxira', 'qanday'])) {
      if (remaining > 0) {
        tips.push(
          `Bu oy ${this.format(remaining)} qoldi. Kamida 20–35% ini (${this.format(Math.round(remaining * 0.25))}) jamg'armaga ajrating.`,
        );
      } else if (income > 0) {
        tips.push(
          'Xarajatlar daromaddan oshib ketgan. Avval keraksiz xarajatlarni (kafe, shopping) qisqartiring.',
        );
      } else {
        tips.push(
          "Daromad kiriting va byudjet rejasini tuzing — tejash uchun avval qancha qolishini bilish kerak.",
        );
      }
    }

    if (this.mentions(q, ['qarz', 'kredit', 'qarzlar'])) {
      if (totalDebt > 0) {
        tips.push(`Faol kredit qarzingiz: ${this.format(totalDebt)}. Yangi kredit olishdan oldin mavjudini kamaytiring.`);
      }
      if (microLoans.length) {
        const microTotal = microLoans.reduce((s, m) => s + Number(m.amount), 0);
        tips.push(
          `${microLoans.length} ta ochiq mikroqarz (${this.format(microTotal)}). Ularni yopish ustuvor.`,
        );
      }
      if (!totalDebt && !microLoans.length) {
        tips.push('Faol kredit yoki mikroqarzingiz yo\'q — yaxshi holat. Shunday davom eting.');
      }
    }

    if (this.mentions(q, ['byudjet', 'reja', 'to\'g\'ri'])) {
      if (budgetPlan) {
        const mandatory = budgetPlan.mandatoryExpenses as Array<{ amount: number }>;
        const mandatoryTotal = mandatory.reduce((s, i) => s + Number(i.amount), 0);
        const planRemaining = Number(budgetPlan.monthlyIncome) - mandatoryTotal;
        tips.push(
          `Byudjetingiz: daromad ${this.format(Number(budgetPlan.monthlyIncome))}, majburiy ${this.format(mandatoryTotal)}, qoladi ${this.format(planRemaining)}.`,
        );
      } else {
        tips.push('Byudjet bo\'limida oylik daromad va majburiy xarajatlarni kiriting — tavsiyalar avtomatik hisoblanadi.');
      }
    }

    if (this.mentions(q, ['maqsad', 'yetaman', 'mashina', 'uy'])) {
      const activeGoals = goals.filter(
        (g) => Number(g.savedAmount) < Number(g.targetAmount),
      );
      if (activeGoals.length) {
        const top = activeGoals[0];
        const left = Number(top.targetAmount) - Number(top.savedAmount);
        tips.push(`"${top.name}" maqsadi uchun yana ${this.format(left)} kerak.`);
      } else if (goals.length) {
        tips.push('Barcha maqsadlaringiz bajarilgan yoki yaqin — tabriklaymiz!');
      } else {
        tips.push('Maqsadlar bo\'limida mashina, uy yoki zaxira fond qo\'shing — progress kuzatiladi.');
      }
    }

    if (foodTotal > 3_000_000 && !tips.some((t) => t.includes('ovqat'))) {
      tips.push(
        `Bu oy ovqatga ${this.format(foodTotal)} sarflagansiz. Haftalik reja tuzsangiz 15–20% tejashingiz mumkin.`,
      );
    }

    const earlyPayoff = installments.find(
      (i) => i.paidMonths < i.totalMonths && i.paidMonths < 3,
    );
    if (earlyPayoff && this.mentions(q, ['telefon', 'muddatli', 'to\'lov', 'tejash'])) {
      const saveEstimate = Math.round(Number(earlyPayoff.monthlyPayment) * 2 * 0.15);
      tips.push(
        `"${earlyPayoff.name}" ni 2 oy oldin yopsangiz taxminan ${this.format(saveEstimate)} tejashingiz mumkin.`,
      );
    }

    const overdueLoans = microLoans.filter((m) => m.dueDate < now);
    if (overdueLoans.length) {
      tips.push(
        `${overdueLoans.length} ta mikroqarz muddati o\'tgan — avval ularni yoping, jarima oshmasin.`,
      );
    }

    if (!tips.length) {
      if (remaining < 0 && income > 0) {
        tips.push(
          `Bu oy ${this.format(Math.abs(remaining))} deficit bor. Xarajatlarni kamaytiring yoki qo'shimcha daromad qidiring.`,
        );
      } else if (debt > income && income > 0) {
        tips.push(
          `Qarz yuki daromadingizdan katta (${this.format(debt)}). Qo'shimcha qarz olishdan saqlaning.`,
        );
      } else {
        tips.push(
          'Moliyaviy holatingiz barqaror. Jamg\'arma, byudjet va maqsadlar bo\'yicha muntazam to\'lov qiling.',
        );
      }
    }

    const uniqueTips = [...new Set(tips)].slice(0, 4);

    return {
      question: message,
      answer: uniqueTips.join('\n\n'),
      tips: uniqueTips,
      summary,
    };
  }

  private mentions(text: string, words: string[]): boolean {
    return words.some((w) => text.includes(w));
  }

  private format(amount: number) {
    return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
  }
}
