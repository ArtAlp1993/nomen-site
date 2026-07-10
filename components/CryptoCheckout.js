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
import CoinIcon, { networkColor } from "./CoinIcon";

const EASE = [0.22, 1, 0.36, 1];

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

  // Текст заказа для Telegram.
  const buildOrderText = (paid, w, amount) => {
    const r = result || {};
    const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
    const birth = [r.birthDate, r.birthTime, r.birthPlace]
      .filter(Boolean)
      .join(", ");
    const memo = memoValueFor(w, order);
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
      `Оплата: ${w.label}`,
      `Сумма: ${amount}`,
      memo ? `${w.memoLabel}: ${memo}` : null,
      `Адрес: ${w.address}`,
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
        const amount = selected.isStable
          ? `${(basePrice + tail / 100).toFixed(2)} ${selected.coin}`
          : `≈ $${basePrice.toFixed(2)} in ${selected.coin}`;
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
            `Оплата: ${selected.label}`,
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

  // Курс для не-стейбла — при открытии и смене монеты (сеть курс не меняет).
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
  }, [open, coinName]);

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

            {/* Шаг 1 — монета (выпадающий список со значками) */}
            <label className="mt-5 block text-xs uppercase tracking-wide text-foreground-muted">
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
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNetIdx(i)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-transparent text-background"
                            : "border-foreground-muted/30 text-foreground-muted hover:text-foreground"
                        }`}
                        style={active ? { background: networkColor(n.network) } : {}}
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
