"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import wallets from "@/data/wallets.json";
import { useResult } from "./ResultProvider";
import {
  notifyTelegram,
  makeOrderCode,
  makeNumericTag,
  cleanField,
} from "@/lib/notify";
import { fetchCryptoAmount } from "@/lib/rates";
import { encodePrefill } from "@/lib/readingLink";
import { ymGoal } from "./Analytics";
import QRCode from "./QRCode";
import CoinIcon, { networkColor } from "./CoinIcon";

const EASE = [0.22, 1, 0.36, 1];
const WISE_URL = "https://wise.com/pay/me/artemi463";

// Аккуратный формат количества монеты: без «хвоста» лишних нулей.
function formatCrypto(n) {
  if (n >= 1) return Number(n.toFixed(4)).toString();
  return Number(n.toPrecision(3)).toString();
}

// Значение memo/тега для опознания платежа. XRP требует числовой Destination
// Tag → используем numericTag; для TON (текстовый comment) — код заказа.
function memoValueFor(w, order) {
  if (!w.memo || !order) return null;
  return w.coin === "XRP" ? order.numericTag : order.code.replace("#", "");
}

// Что кодируем в QR: базовая схема с адресом там, где кошельки её понимают;
// иначе просто адрес. Сумму и memo пользователь ставит вручную (надёжнее, чем
// зашивать в URI, который часть кошельков не разберёт).
function qrValueFor(w) {
  if (!w?.address) return "";
  switch (w.uri) {
    case "bitcoin":
      return `bitcoin:${w.address}`;
    case "ethereum":
      return `ethereum:${w.address}`;
    case "ton":
      return `ton://transfer/${w.address}`;
    default:
      return w.address;
  }
}

export default function CryptoCheckout({ tier, open, onClose }) {
  const router = useRouter();
  const { result } = useResult();

  // Двухуровневый выбор: сначала монета, затем (если у неё несколько) сеть.
  const [coinName, setCoinName] = useState(wallets[0].coin);
  const [netIdx, setNetIdx] = useState(0);
  const [coinDropOpen, setCoinDropOpen] = useState(false);
  const [order, setOrder] = useState(null); // { code, numericTag }
  const [tailCents, setTailCents] = useState(0);
  const [cryptoAmount, setCryptoAmount] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [cryptoOpen, setCryptoOpen] = useState(false); // крипта-аккордеон (Wise — главный)

  const leadRef = useRef(false); // лид Артёму — один раз за открытие
  const paidRef = useRef(false); // «оплатил» — один раз за открытие

  const coin = wallets.find((c) => c.coin === coinName) || wallets[0];
  const net = coin.networks[netIdx] || coin.networks[0];
  const multiNetwork = coin.networks.length > 1;

  // Плоский объект выбранного кошелька (монета + сеть) — удобно для отрисовки,
  // QR, memo и текста заказа.
  const selected = {
    coin: coin.coin,
    isStable: coin.isStable,
    coingeckoId: coin.coingeckoId,
    network: net.network,
    address: net.address,
    memo: net.memo,
    memoLabel: net.memoLabel,
    uri: net.uri,
    label: `${coin.coin} (${net.network})`,
  };

  const basePrice = parseFloat(tier?.price || "0");

  // Сумма к оплате: стейбл — точная с «хвостиком» центов (для опознания);
  // не-стейбл — эквивалент по курсу (или «≈ $X», если курс не пришёл).
  const stableAmount = (basePrice + tailCents / 100).toFixed(2);
  const amountText = selected.isStable
    ? `${stableAmount} ${selected.coin}`
    : cryptoAmount != null
      ? `${formatCrypto(cryptoAmount)} ${selected.coin}  (≈ $${basePrice.toFixed(2)})`
      : `≈ $${basePrice.toFixed(2)} in ${selected.coin}`;

  const memoValue = memoValueFor(selected, order);

  // Ссылка-заготовка для /studio: тап из Telegram открывает студию с уже
  // заполненной карточкой клиента — Артёму остаётся собрать ссылку разбора.
  const studioPrefillUrl = () => {
    const r = result || {};
    try {
      const token = encodePrefill({
        fn: cleanField(r.firstName),
        ln: cleanField(r.lastName),
        g: r.gender || "",
        bd: r.birthDate || "",
        bt: r.birthTime || "",
        bp: cleanField(r.birthPlace),
        br: cleanField(r.brand),
        em: cleanField(r.email),
        oc: order?.code || "",
        tier: tier ? `${tier.name} — $${tier.price}` : "",
      });
      return `${window.location.origin}/studio/#o=${token}`;
    } catch {
      return null;
    }
  };

  // Текст заказа для Telegram.
  const buildOrderText = (paid, w, amount) => {
    const r = result || {};
    // Поля клиента чистим от переносов строк — иначе можно подделать строки
    // «Адрес:/Сумма:» в сообщении оператору.
    const name =
      cleanField([r.firstName, r.lastName].filter(Boolean).join(" ")) || "—";
    const birth = cleanField(
      [r.birthDate, r.birthTime, r.birthPlace].filter(Boolean).join(", ")
    );
    const memo = memoValueFor(w, order);
    return [
      paid
        ? "💰 NOMEN — клиент совершил ОПЛАТУ"
        : "🛒 NOMEN — новый заказ (ждём оплату)",
      `Заказ ${order?.code || ""}`,
      `Тариф: ${tier?.name} — $${tier?.price}`,
      `Имя: ${name}`,
      r.gender ? `Пол: ${r.gender === "f" ? "жен" : "муж"}` : null,
      birth ? `Дата рождения: ${birth}` : null,
      r.brand ? `Бренд/ник: ${cleanField(r.brand)}` : null,
      `Email: ${cleanField(r.email) || "—"}`,
      `Оплата: ${w.label}`,
      `Сумма: ${amount}`,
      memo ? `${w.memoLabel}: ${memo}` : null,
      `Адрес: ${w.address}`,
      paid ? `Студия (собрать разбор): ${studioPrefillUrl() || "—"}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  // При открытии: генерируем заказ и шлём Артёму лид (один раз). При закрытии
  // сбрасываем — следующее открытие = новый заказ.
  useEffect(() => {
    if (open) {
      if (!leadRef.current) {
        leadRef.current = true;
        const code = makeOrderCode();
        const numericTag = makeNumericTag();
        const tail = 1 + Math.floor(Math.random() * 8); // 1..8 центов
        setOrder({ code, numericTag });
        setTailCents(tail);
        ymGoal("checkout_opened");
        // Лид «новый заказ»: монету/сумму НЕ пишем — они ещё не выбраны
        // (иначе лид покажет USDT по умолчанию, а платёж может уйти в другой).
        // Финальное сообщение по «I've paid» содержит выбранную монету и сумму.
        const r = result || {};
        const name =
          cleanField([r.firstName, r.lastName].filter(Boolean).join(" ")) || "—";
        const birth = cleanField(
          [r.birthDate, r.birthTime, r.birthPlace].filter(Boolean).join(", ")
        );
        notifyTelegram(
          [
            "🛒 NOMEN — новый заказ (ждём оплату)",
            `Заказ ${code}`,
            `Тариф: ${tier?.name} — $${tier?.price}`,
            `Имя: ${name}`,
            r.gender ? `Пол: ${r.gender === "f" ? "жен" : "муж"}` : null,
            birth ? `Дата рождения: ${birth}` : null,
            r.brand ? `Бренд/ник: ${cleanField(r.brand)}` : null,
            `Email: ${cleanField(r.email) || "—"}`,
          ]
            .filter(Boolean)
            .join("\n")
        );
      }
    } else {
      leadRef.current = false;
      paidRef.current = false;
      setOrder(null);
      setCopied("");
      setCryptoOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Курс для не-стейбла — при открытии и смене монеты (сеть курс не меняет).
  // Считаем от УНИКАЛЬНОЙ суммы (цена + хвостик центов), чтобы у каждого заказа
  // была своя сумма — так BTC/ETH (без memo) тоже опознаются при сверке.
  useEffect(() => {
    if (!open || selected.isStable || !tailCents) {
      setCryptoAmount(null);
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    setCryptoAmount(null);
    fetchCryptoAmount(selected.coingeckoId, basePrice + tailCents / 100).then(
      (amt) => {
        if (!cancelled) {
          setCryptoAmount(amt);
          setRateLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coinName, tailCents]);

  const copy = async (field, text) => {
    if (!text) return; // нечего копировать (напр. курс не пришёл) — без ложной «✓»
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? "" : c)), 1500);
    } catch {
      /* буфер недоступен — не критично */
    }
  };

  // Значение суммы для копирования: то же, что показано (стейбл — точное;
  // не-стейбл — форматированное количество монеты, либо пусто если курс не пришёл).
  const amountCopy = selected.isStable
    ? stableAmount
    : cryptoAmount != null
      ? formatCrypto(cryptoAmount)
      : "";

  // Счёт для пересылки тому, кто платит (пример: квиз прошла она, платит он):
  // телефон открывает нативное «поделиться», на десктопе — копирование.
  const invoiceText = () => {
    const memo = memoValueFor(selected, order);
    return [
      `NOMEN — ${tier?.name} ($${tier?.price})`,
      order ? `Order ${order.code}` : null,
      ``,
      `Pay with ${selected.coin} (${selected.network}):`,
      `Amount: ${amountText}`,
      `Address: ${selected.address}`,
      memo ? `${selected.memoLabel} (required): ${memo}` : null,
      ``,
      `Send the exact amount. Once the payment is confirmed, a personal link to the reading is emailed to you.`,
    ]
      .filter((l) => l !== null)
      .join("\n");
  };

  const shareInvoice = async () => {
    const text = invoiceText();
    ymGoal("invoice_shared");
    try {
      if (navigator.share) {
        await navigator.share({ title: "NOMEN — payment details", text });
        return;
      }
    } catch {
      /* пользователь закрыл шэринг — не ошибка */
      return;
    }
    copy("invoice", text); // десктоп без Web Share — копируем счёт целиком
  };

  const handlePaid = () => {
    if (!paidRef.current) {
      paidRef.current = true;
      ymGoal("checkout_paid");
      notifyTelegram(buildOrderText(true, selected, amountText));
    }
    const code = order?.code?.replace("#", "") || "";
    onClose?.();
    router.push(`/thank-you/?order=${code}`);
  };

  // Wise (USD) — главный способ. Опознание платежа: та же модель, что у крипты —
  // уникальная сумма ($9.9X с хвостиком) + код заказа в примечании перевода;
  // Артём сверяет вручную в Wise-приложении (правила 5.2/5.3).
  const wiseWallet = {
    coin: "Wise",
    label: "Wise (USD transfer)",
    address: WISE_URL,
    network: "USD",
    memo: false,
    memoLabel: null,
  };
  const payWise = () => {
    if (!paidRef.current) {
      paidRef.current = true;
      ymGoal("checkout_paid");
      notifyTelegram(buildOrderText(true, wiseWallet, `$${stableAmount}`));
    }
    const code = order?.code?.replace("#", "") || "";
    onClose?.();
    router.push(`/thank-you/?order=${code}`);
  };

  const isPlaceholder = selected.address?.startsWith("PLACEHOLDER");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            data-lenis-prevent
            className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-accent-turquoise/40 bg-background-alt p-6 shadow-2xl sm:p-7"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-3 text-xl text-foreground-muted transition-colors hover:text-foreground"
            >
              ×
            </button>

            <p className="font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
              Payment
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold">
              {tier?.name} — ${tier?.price}
            </h3>
            {order && (
              <p className="mt-1 text-sm text-foreground-muted">
                Order <span className="text-foreground">{order.code}</span>
              </p>
            )}

            {/* Wise (USD) — главный способ. Активный способ всегда один и
                сверху: выбрал крипту — Wise уступает ей место и уходит в
                кнопку-переключатель внизу (просьба Артёма: «поменялись местами»). */}
            {!cryptoOpen && (
            <div className="mt-5 rounded-xl border border-accent-turquoise/40 bg-accent-turquoise/5 p-4">
              <p className="font-heading text-xs uppercase tracking-[0.25em] text-accent-turquoise">
                Pay in USD · Wise
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                Send exactly{" "}
                <span className="font-semibold text-foreground">${stableAmount}</span>{" "}
                and add your order code{" "}
                <span className="font-semibold text-foreground">{order?.code}</span>{" "}
                in the payment reference so we can match it.
              </p>
              <a
                href={WISE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ymGoal("wise_opened")}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-accent-violet to-accent-turquoise px-8 py-3 font-heading text-sm font-semibold tracking-wide text-background glow-violet transition-transform duration-200 hover:scale-[1.02]"
              >
                Pay with Wise ↗
              </a>
              <button
                type="button"
                onClick={payWise}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-accent-turquoise/50 px-8 py-2.5 font-heading text-sm font-semibold tracking-wide text-accent-turquoise transition-colors hover:bg-accent-turquoise/10"
              >
                I&apos;ve paid
              </button>
            </div>
            )}

            {/* Крипта — раскрывается на месте Wise */}
            {cryptoOpen && (
            <div className="mt-4">
            {/* Шаг 1 — монета (выпадающий список со значками) */}
            <label className="mt-2 block text-xs uppercase tracking-wide text-foreground-muted">
              Coin
            </label>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setCoinDropOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-foreground-muted/40 bg-background px-3 py-2.5 text-left transition-colors hover:border-accent-turquoise"
              >
                <span className="flex items-center gap-2.5">
                  <CoinIcon coin={coin.coin} size={26} />
                  <span className="text-sm text-foreground">{coin.coin}</span>
                </span>
                <span
                  className={`text-foreground-muted transition-transform ${coinDropOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>
              {coinDropOpen && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-foreground-muted/30 bg-background shadow-2xl">
                  {wallets.map((c) => (
                    <button
                      key={c.coin}
                      type="button"
                      onClick={() => {
                        setCoinName(c.coin);
                        setNetIdx(0);
                        setCoinDropOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-foreground/5 ${
                        c.coin === coinName ? "bg-foreground/10" : ""
                      }`}
                    >
                      <CoinIcon coin={c.coin} size={22} />
                      <span className="flex-1 text-sm text-foreground">
                        {c.coin}
                      </span>
                      {c.networks.length > 1 && (
                        <span className="text-[10px] text-foreground-muted">
                          {c.networks.length} networks
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Шаг 2 — сеть (только если у монеты их несколько) */}
            {multiNetwork && (
              <>
                <label className="mt-4 block text-xs uppercase tracking-wide text-foreground-muted">
                  Network
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {coin.networks.map((n, i) => {
                    const active = i === netIdx;
                    const c = networkColor(n.network);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNetIdx(i)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 ${
                          active
                            ? "scale-105 border-transparent text-white"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                        style={
                          active
                            ? {
                                // Неоновый бейдж в стиле сайта: сочная заливка
                                // + свечение цветом сети (как glow у кнопок).
                                background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                                boxShadow: `0 0 18px -2px ${c}, inset 0 0 8px ${c}55`,
                                textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                              }
                            : {
                                borderColor: `${c}66`,
                                color: c,
                                background: `${c}14`,
                              }
                        }
                      >
                        {n.network}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* QR + адрес */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <QRCode
                value={qrValueFor(selected)}
                size={190}
                overlay={<CoinIcon coin={selected.coin} size={34} />}
              />
              <div className="w-full">
                <span className="text-xs uppercase tracking-wide text-foreground-muted">
                  Address · {selected.network}
                </span>
                <button
                  type="button"
                  onClick={() => copy("addr", selected.address)}
                  className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-foreground-muted/30 bg-background px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-accent-turquoise"
                >
                  <span className="break-all font-mono">{selected.address}</span>
                  <span className="shrink-0 text-accent-turquoise">
                    {copied === "addr" ? "✓" : "copy"}
                  </span>
                </button>
              </div>
            </div>

            {/* Сумма */}
            <div className="mt-4 rounded-lg border border-foreground-muted/20 bg-background/60 px-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-foreground-muted">
                Amount to send
              </span>
              <button
                type="button"
                onClick={() => copy("amount", amountCopy)}
                className="mt-1 flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="font-heading text-lg font-semibold text-foreground">
                  {rateLoading ? "…" : amountText}
                </span>
                <span className="shrink-0 text-xs text-accent-turquoise">
                  {copied === "amount" ? "✓" : amountCopy ? "copy" : ""}
                </span>
              </button>
            </div>

            {/* memo / destination tag */}
            {selected.memo && memoValue && (
              <div className="mt-3 rounded-lg border border-accent-turquoise/30 bg-accent-turquoise/5 px-3 py-2.5">
                <span className="text-xs uppercase tracking-wide text-accent-turquoise">
                  {selected.memoLabel} — required
                </span>
                <button
                  type="button"
                  onClick={() => copy("memo", memoValue)}
                  className="mt-1 flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="font-mono text-base text-foreground">
                    {memoValue}
                  </span>
                  <span className="shrink-0 text-xs text-accent-turquoise">
                    {copied === "memo" ? "✓" : "copy"}
                  </span>
                </button>
                <p className="mt-1 text-xs text-foreground-muted">
                  Add this {selected.memoLabel} to your transfer so we can match
                  your payment.
                </p>
              </div>
            )}

            {isPlaceholder && (
              <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-300">
                Payments aren&apos;t live yet. This is a demo address, so don&apos;t
                send funds. Checkout will activate once real wallets are set.
              </div>
            )}

            <p className="mt-4 text-xs text-foreground-muted">
              Send the exact amount to the address above. Once your payment is
              confirmed, we email you a personal link to your full reading,
              usually within a few hours.
            </p>

            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handlePaid}
                disabled={isPlaceholder}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-accent-violet to-accent-turquoise px-8 py-3 font-heading text-sm font-semibold tracking-wide text-background glow-violet transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {isPlaceholder ? "Payments coming soon" : "I've paid"}
              </button>
              <button
                type="button"
                onClick={shareInvoice}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent-turquoise/50 px-8 py-2.5 font-heading text-sm font-semibold tracking-wide text-accent-turquoise transition-colors hover:bg-accent-turquoise/10"
              >
                {copied === "invoice" ? "Invoice copied ✓" : "Share invoice ↗"}
              </button>
            </div>
            </div>
            )}

            {/* Переключатель второго способа — активный всегда сверху */}
            <button
              type="button"
              onClick={() => setCryptoOpen((o) => !o)}
              className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-foreground-muted/30 bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-accent-turquoise"
            >
              <span>
                <span className="text-foreground-muted">or</span>{" "}
                {cryptoOpen ? "Pay in USD via Wise" : "Pay with crypto"}
              </span>
              <span className="text-foreground-muted">▾</span>
            </button>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
