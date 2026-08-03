# Budget Control — Telegram Mini App

Shaxsiy moliyaviy boshqaruv ilovasi: daromad, xarajat, kredit, mikroqarz, maqsadlar, jamg'arma va AI tavsiyalar.

## Texnologiyalar

- **Frontend:** Angular 20, TailwindCSS, Telegram Mini App SDK, Signals
- **Backend:** NestJS, PostgreSQL, Prisma, JWT, Redis
- **Deploy:** Docker, Nginx, Railway, GitHub Actions

## Xavfsizlik

Faqat sizning **telefon raqamingiz** va **Telegram username**ingiz mos kelsa ma'lumotlar ko'rinadi. Boshqa odam kirsa — ma'lumotlar ko'rsatilmaydi.

## Tez boshlash (local)

### 1. Environment

```bash
cp backend/.env.example backend/.env
```

`backend/.env` ni to'ldiring:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/budget_control?schema=public"
JWT_SECRET="uzun-random-secret"
TELEGRAM_BOT_TOKEN="bot-token"
ALLOWED_PHONE="+998XXXXXXXXX"
ALLOWED_USERNAME="sizning_username"
```

> **Muhim:** Bot tokenni hech qachon GitHubga commit qilmang!

### 2. Database

```bash
docker compose up -d postgres redis
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:4200`

## Telegram Bot sozlash

1. [@BotFather](https://t.me/BotFather) da bot yarating
2. `/newapp` — Mini App URL ni Railway deploy URL qiling
3. `ALLOWED_PHONE` va `ALLOWED_USERNAME` ni `.env` ga qo'ying

## Railway deploy

1. GitHub repoga push qiling
2. [Railway](https://railway.app) da New Project → GitHub repo
3. PostgreSQL va Redis servislari qo'shing
4. Environment variables:
   - `DATABASE_URL` (PostgreSQL dan)
   - `REDIS_URL` (Redis dan)
   - `JWT_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `ALLOWED_PHONE`
   - `ALLOWED_USERNAME`
5. Deploy — Dockerfile avtomatik ishlatiladi

## Modullar

| Modul | Yo'l |
|-------|------|
| Dashboard | `/dashboard` |
| Daromad | `/income` |
| Xarajat | `/expenses` |
| Kredit | `/credits` |
| Mikroqarz | `/micro-loans` |
| Muddatli to'lov | `/installments` |
| Maqsad | `/goals` |
| Jamg'arma | `/savings` |
| Budget Planner | `/budget` |
| Kalendar | `/calendar` |
| Statistika | `/statistics` |
| AI Assistant | `/ai` |
| Sozlamalar | `/settings` |

## API

Barcha endpointlar `/api` prefiksi ostida. Auth: `POST /api/auth/telegram`

```json
{
  "initData": "telegram_init_data",
  "phone": "+998901234567",
  "username": "yourusername"
}
```

## License

Private — faqat shaxsiy foydalanish uchun.
