// Иконка для каждого из 16 пунктов. Смысл иконки — из паспорта пункта:
// путь (компас), дар дня (подарок), миссия (звезда), душа (сердце),
// личность (маска), зрелость (дерево), уроки (книга), психоматрица (сетка 3×3),
// долги (звенья цепи), солнечный знак (солнце), китайское животное (лапа),
// стихия года (пламя), таро (карта), натальная карта (орбиты),
// Ба-цзы (4 столпа), Human Design (фигура-бодиграф).
//
// Каждый набор фигур нарисован в системе координат 24×24, stroke=currentColor.
// Используется и как самостоятельный <svg> (карточки), и вложенным в SVG-диаграмму.

const SHAPES = {
  A1: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2.5 5.5L9 15l2.5-5.5z" />
    </>
  ),
  A2: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M4 13h16M12 9v11" />
      <path d="M12 9c-2-4-6-3-6-1 0 1.6 3 1 6 1zM12 9c2-4 6-3 6-1 0 1.6-3 1-6 1z" />
    </>
  ),
  A3: <path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />,
  A4: <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 1.5c0 5-7 10.5-7 10.5z" />,
  A5: (
    <>
      <path d="M4 6c0 8 3 12 8 12s8-4 8-12c-5-2-11-2-16 0z" />
      <circle cx="9.5" cy="11" r="1" />
      <circle cx="14.5" cy="11" r="1" />
    </>
  ),
  A7: (
    <>
      <path d="M12 21v-6" />
      <path d="M12 15c-3 0-5-2-5-5s2-6 5-6 5 3 5 6-2 5-5 5z" />
    </>
  ),
  A9: (
    <>
      <path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v13c-3-1-5-1-8 1-3-2-5-2-8-1z" />
      <path d="M12 7v12" />
    </>
  ),
  A10: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16" />
    </>
  ),
  A11: (
    <>
      <rect x="3" y="9" width="10" height="6" rx="3" />
      <rect x="11" y="9" width="10" height="6" rx="3" />
    </>
  ),
  B1: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  C1: (
    <>
      <circle cx="12" cy="15" r="4" />
      <circle cx="6" cy="10" r="1.5" />
      <circle cx="10" cy="7" r="1.5" />
      <circle cx="14" cy="7" r="1.5" />
      <circle cx="18" cy="10" r="1.5" />
    </>
  ),
  C2: <path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5-1-8z" />,
  D1: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M12 8l1 2.4 2.5.1-2 1.6.7 2.4L12 14.6l-2.2 1.5.7-2.4-2-1.6 2.5-.1z" />
    </>
  ),
  B2: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </>
  ),
  C3: (
    <>
      <path d="M6 6v12M10 6v12M14 6v12M18 6v12" />
      <path d="M4 6h16M4 18h16" />
    </>
  ),
  F: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M12 8.5V15M8 11l4-1 4 1M9 20l3-5 3 5" />
    </>
  ),
};

// Фигуры пункта (без обёртки) — для вложения прямо в SVG-диаграмму.
export function iconShapes(code) {
  return SHAPES[code] || SHAPES.A1;
}

// Самостоятельная иконка для HTML-карточек.
export default function PointIcon({ code, size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconShapes(code)}
    </svg>
  );
}
