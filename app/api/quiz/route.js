import { execFile } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";

const ENGINE_API_URL = process.env.NOMEN_ENGINE_API_URL || "http://127.0.0.1:8000";
const ENGINE_DIR = path.join(homedir(), "Desktop", "Code", "nomen-engine");

/** ISO-дата из <input type="date"> (YYYY-MM-DD) → ДД.ММ.ГГГГ, формат движка. */
function toEngineDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Передаёт данные квиза в Диспетчер профиля (паспорт 00):
 *   cd ~/Desktop/Code/nomen-engine && python3 profile.py ДД.ММ.ГГГГ "Имя Фамилия" [--brand ...] [--city ...]
 * Пустые бренд/город — флаг пропускается; диспетчер сам пропустит пункты без данных.
 * Карточку в cards/ и запись в статистику (source="profile") делает сам скрипт.
 */
function runProfileDispatcher({ firstName, lastName, birthDate, birthPlace, brand }) {
  const args = ["profile.py", toEngineDate(birthDate), `${firstName} ${lastName}`];
  if (brand && brand.trim()) args.push("--brand", brand.trim());
  if (birthPlace && birthPlace.trim()) args.push("--city", birthPlace.trim());

  execFile("python3", args, { cwd: ENGINE_DIR }, (err, stdout, stderr) => {
    if (err) {
      console.error("profile.py dispatcher failed:", err, stderr);
    }
  });
}

export async function POST(request) {
  const body = await request.json();
  const { firstName, lastName, birthDate, email } = body;

  if (!firstName || !lastName || !birthDate || !email) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  runProfileDispatcher(body);

  let points;
  try {
    const engineRes = await fetch(`${ENGINE_API_URL}/teaser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${firstName} ${lastName}`, date: birthDate }),
    });
    if (!engineRes.ok) throw new Error("engine error");
    const data = await engineRes.json();
    points = data.points;
  } catch (err) {
    console.error("nomen-engine /teaser call failed:", err);
    return Response.json(
      { error: "Could not calculate your preview right now." },
      { status: 502 }
    );
  }

  // TODO (Фаза 5, после Фазы 0 — аккаунты Vercel Postgres + Resend):
  //   - записать лид (firstName, lastName, birthDate, email, UTM) в Postgres через Prisma
  //   - добавить email в Resend Audience и отправить письмо с тем же тизером
  // Пока переменные окружения DATABASE_URL / RESEND_API_KEY не заданы, этот шаг
  // пропускается молча — сама воронка (живой тизер) уже работает.
  if (process.env.RESEND_API_KEY) {
    // будет реализовано в Фазе 5
  }

  return Response.json({ points });
}
