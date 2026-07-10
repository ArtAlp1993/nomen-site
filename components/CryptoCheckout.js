"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import wallets from "@/data/wallets.json";
import { useResult } from "./ResultProvider";
import { notifyTelegram, makeOrderCode } from "@/lib/notify";
import { fetchCryptoAmount } from "@/lib/rates";
import { ymGoal } from "./Analytics";
import QRCode from "./QRCode";

const EASE = [0.22, 1, 0.36, 1];

// Аккуратный формат количества монеты: без «хвоста» лишних нулей.
function formatCrypto(n) {
  if (n >= 1) return Number(n.toFixed(4)).toString();
  return Number(n.toPrecision(3)).toString();
}

// Значение memo/тега для опознания платежа. XRP требует числовой Destination
// Tag → используем numericTag; для TON (текстовый comment) — код заказа.
function memoValueFor(wallet, order) {
  if (!wallet.memo || !order) return null;
  return wallet.coin === "XRP" ? order.numericTag : order.code.replace("#", "");
}

// Что кодируем в QR: базовая схема с адресом там, где кошельки её понимают;
// иначе просто адрес. Сумму и memo пользователь ставит вручную (надёжнее, чем
// зашивать в URI, который часть кошельков не разберёт).
function qrValueFor(wallet) {
  if (!wallet?.address) return "";
  switch (wallet.uri) {
    case "bitcoin":
      return `bitcoin:${wallet.address}`;
    case "ethereum":
      return `ethereum:${wallet.address}`;
    case "ton":
      return `ton://transfer/${wallet.address}`;
    default:
      return wallet.address;
  }
}

export default function CryptoCheckout({ tier, open, onClose }) {
  const router = useRouter();
  const { result } = useResult();

  const [selectedId, setSelectedId] = useState(wallets[0].id);
  const [order, setOrder] = useState(null); // { code, numericTag }
  const [tailCents, setTailCents] = useState(0);
  const [cryptoAmount, setCryptoAmount] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const leadRef = useRef(false); // лид Артёму — один раз за открытие
  const paidRef = useRef(false); // «оплатил» — один раз за открытие

  const selected = wallets.find((w) => w.id === selectedId) || wallets[0];
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

  // Текст заказа для Telegram.
  const buildOrderText = (paid, wallet, amount) => {
    const r = result || {};
    const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
    const birth = [r.birthDate, r.birthTime, r.birthPlace]
      .filter(Boolean)
      .join(", ");
    const memo = memoValueFor(wallet, order);
    return [
      paid
        ? "💰 NOMEN — клиент отметил ОПЛАТУ"
        : "🛒 NOMEN — новый заказ (ждём оплату)",
      `Заказ ${order?.code || ""}`,
      `Тариф: ${tier?.name} — $${tier?.price}`,
      `Имя: ${name}`,
      birth ? `Дата рождения: ${birth}` : null,
      r.brand ? `Бренд/ник: ${r.brand}` : null,
      `Email: ${r.email || "—"}`,
      `Оплата: ${wallet.label}`,
      `Сумма: ${amount}`,
      memo ? `${wallet.memoLabel}: ${memo}` : null,
      `Адрес: ${wallet.address}`,
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
        const numericTag = String(100000 + Math.floor(Math.random() * 899999));
        const tail = 1 + Math.floor(Math.random() * 8); // 1..8 центов
        setOrder({ code, numericTag });
        setTailCents(tail);
        ymGoal("checkout_opened");
        const w = wallets.find((x) => x.id === selectedId) || wallets[0];
        const amount = w.isStable
          ? `${(basePrice + tail / 100).toFixed(2)} ${w.coin}`
          : `≈ $${basePrice.toFixed(2)} in ${w.coin}`;
        // order ещё не в стейте на этот тик — строим текст с локальными данными.
        const r = result || {};
        const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
        const birth = [r.birthDate, r.birthTime, r.birthPlace]
          .filter(Boolean)
          .join(", ");
        notifyTelegram(
          [
            "🛒 NOMEN — новый заказ (ждём оплату)",
            `Заказ ${code}`,
            `Тариф: ${tier?.name} — $${tier?.price}`,
            `Имя: ${name}`,
            birth ? `Дата рождения: ${birth}` : null,
            r.brand ? `Бренд/ник: ${r.brand}` : null,
            `Email: ${r.email || "—"}`,
            `Оплата: ${w.label}`,
            `Сумма: ${amount}`,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Курс для не-стейбла — при открытии и смене монеты.
  useEffect(() => {
    if (!open || selected.isStable) {
      setCryptoAmount(null);
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    setCryptoAmount(null);
    fetchCryptoAmount(selected.coingeckoId, basePrice).then((amt) => {
      if (!cancelled) {
        setCryptoAmount(amt);
        setRateLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedId]);

  const copy = async (field, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? "" : c)), 1500);
    } catch {
      /* буфер недоступен — не критично */
    }
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
              Pay with crypto
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold">
              {tier?.name} — ${tier?.price}
            </h3>
            {order && (
              <p className="mt-1 text-sm text-foreground-muted">
                Order <span className="text-foreground">{order.code}</span>
              </p>
            )}

            {/* Выбор монеты/сети — выпадающий список */}
            <label className="mt-5 block text-xs uppercase tracking-wide text-foreground-muted">
              Coin & network
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-foreground-muted/40 bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent-turquoise focus:outline-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>

            {/* QR + адрес */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <QRCode value={qrValueFor(selected)} size={190} />
              <div className="w-full">
                <span className="text-xs uppercase tracking-wide text-foreground-muted">
                  Address
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
                onClick={() =>
                  copy(
                    "amount",
                    selected.isStable ? stableAmount : String(cryptoAmount ?? "")
                  )
                }
                className="mt-1 flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="font-heading text-lg font-semibold text-foreground">
                  {rateLoading ? "…" : amountText}
                </span>
                <span className="shrink-0 text-xs text-accent-turquoise">
                  {copied === "amount" ? "✓" : "copy"}
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
              <p className="mt-3 text-xs text-amber-400/80">
                Demo address — real wallet not set yet.
              </p>
            )}

            <p className="mt-4 text-xs text-foreground-muted">
              Send the exact amount to the address above. After we confirm your
              payment on-chain, your full reading is emailed to you — usually
              within a few hours.
            </p>

            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handlePaid}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-accent-violet to-accent-turquoise px-8 py-3 font-heading text-sm font-semibold tracking-wide text-background glow-violet transition-transform duration-200 hover:scale-[1.02]"
              >
                I&apos;ve paid
              </button>
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
