import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

export interface CategoryItem {
  id: string | null;
  code: string;
  label: string;
  icon?: string | null;
  custom: boolean;
}

const SYSTEM_INCOME: CategoryItem[] = [
  { id: null, code: 'SALARY', label: 'Maosh', custom: false },
  { id: null, code: 'BONUS', label: 'Bonus', custom: false },
  { id: null, code: 'FREELANCE', label: 'Freelance', custom: false },
  { id: null, code: 'SALE', label: 'Sotuv', custom: false },
  { id: null, code: 'OTHER', label: 'Boshqa', custom: false },
];

const SYSTEM_EXPENSE: CategoryItem[] = [
  { id: null, code: 'FOOD', label: 'Oziq-ovqat', icon: '🥩', custom: false },
  { id: null, code: 'TRANSPORT', label: 'Transport', icon: '🚗', custom: false },
  { id: null, code: 'UTILITIES', label: 'Kommunal', icon: '🏠', custom: false },
  { id: null, code: 'CHILD', label: 'Bola', icon: '👶', custom: false },
  { id: null, code: 'CAFE', label: 'Kafe', icon: '🍔', custom: false },
  { id: null, code: 'PHONE', label: 'Telefon', icon: '📱', custom: false },
  { id: null, code: 'GAMING', label: "O'yin", icon: '🎮', custom: false },
  { id: null, code: 'GIFT', label: "Sovg'a", icon: '🎁', custom: false },
  { id: null, code: 'SHOPPING', label: 'Shopping', icon: '🛍', custom: false },
  { id: null, code: 'PHARMACY', label: 'Dori-darmon', icon: '💊', custom: false },
  { id: null, code: 'OTHER', label: 'Boshqa', icon: '📦', custom: false },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string, type: CategoryType): CategoryItem[] {
    return this.merge(type, []);
  }

  async findAllWithCustom(userId: string, type: CategoryType): Promise<CategoryItem[]> {
    const custom = await this.prisma.transactionCategory.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'asc' },
    });

    return this.merge(
      type,
      custom.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        icon: c.icon,
        custom: true,
      })),
    );
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const label = dto.label.trim();
    if (!label) throw new BadRequestException('Kategoriya nomi bo\'sh bo\'lmasin');

    const existing = await this.findAllWithCustom(userId, dto.type);
    if (existing.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      throw new BadRequestException('Bu kategoriya allaqachon mavjud');
    }

    const code = this.buildCode(label);
    return this.prisma.transactionCategory.create({
      data: {
        userId,
        type: dto.type,
        code,
        label,
        icon: dto.icon,
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.transactionCategory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Kategoriya topilmadi');

    const fallback = item.type === CategoryType.INCOME ? 'OTHER' : 'OTHER';
    if (item.type === CategoryType.INCOME) {
      await this.prisma.income.updateMany({
        where: { userId, category: item.code },
        data: { category: fallback },
      });
    } else {
      await this.prisma.expense.updateMany({
        where: { userId, category: item.code },
        data: { category: fallback },
      });
    }

    return this.prisma.transactionCategory.delete({ where: { id } });
  }

  private merge(type: CategoryType, custom: CategoryItem[]): CategoryItem[] {
    const system = type === CategoryType.INCOME ? SYSTEM_INCOME : SYSTEM_EXPENSE;
    return [...system, ...custom];
  }

  private buildCode(label: string): string {
    const base = label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'CUSTOM';
    return `CUSTOM_${base}_${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }
}
