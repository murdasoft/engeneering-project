# AI-чатбот «Агрегатор» — Telegram MVP

## Быстрый старт (локально)

```bash
cd app
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Создайте `.env` файл (вручную, **не** коммитить!):

```bash
cp .env.example .env
# Отредактируйте .env — вставьте реальные значения
```

### Запуск:

```bash
uvicorn main:app --reload --port 8000
```

### Регистрация webhook (для ngrok/production):

```bash
curl https://your-domain/setup
```

## Архитектура

```
app/
├── main.py              # FastAPI entry point, webhook endpoints
├── bot/
│   ├── config.py        # Typed settings from env
│   ├── models.py        # Session, enums (State, Lang, City)
│   ├── sessions.py      # Session store (in-memory → Supabase)
│   ├── handlers.py      # Main orchestrator
│   ├── content.py       # Bilingual text templates
│   ├── lang_detect.py   # Language detection
│   └── telegram_client.py  # Telegram API wrapper
├── requirements.txt
├── vercel.json          # Vercel deployment config
└── .env.example         # Template for secrets
```

## Деплой на Vercel

```bash
vercel deploy --prod
# Установите переменные окружения через Vercel Dashboard
```

## Безопасность

- Секреты ТОЛЬКО в `.env` / переменных окружения
- `.env` в `.gitignore` — никогда не коммитится
- Webhook проверяется через `X-Telegram-Bot-Api-Secret-Token`
- Rate limiting будет добавлен в следующей итерации
