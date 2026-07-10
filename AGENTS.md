<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Правила проекта NOMEN — обязательно

**Перед работой прочти свод правил:**
`/Users/mac/Desktop/Nomen/01_Продукт/2026-07-11_правила-проекта.md`
Новые правила записывай ТУДА (не в комментарии, не в чат).

Ключевое для этого репо:
- **Два чистых прогона вживую** (браузер, сквозной сценарий) перед «готово»;
  баг на прогоне → фикс → счётчик обнуляется.
- Формула шарика — только `lib/ballFormula.js` (ползунки/чат/Claude читают оттуда).
- Адреса кошельков — только `data/wallets.json`; PLACEHOLDER = оплата заблокирована.
- Новый внешний хост → добавить в CSP `connect-src` (`app/layout.js`), иначе молча упадёт в проде.
- Секреты в бандл не класть (исключение — TG-токен уведомлений, осознанный MVP-риск).
- Деплой = push в `main` (GitHub Actions → GitHub Pages → nomen.website).
