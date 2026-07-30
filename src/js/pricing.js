/**
 * Модель цены — единственное место с числами.
 * Правьте здесь: квиз, карточки вилок и подписи пересчитаются сами.
 *
 * ВНИМАНИЕ: цифры условные, поставлены как каркас. Замените на свои
 * до публикации — иначе квиз будет называть выдуманные суммы.
 *
 * Цена считается так:
 *   (база типа сайта × множитель масштаба + доплаты за недостающее) × срочность
 * Все вилки — пары [минимум, максимум].
 */
export const TYPES = {
  landing: {
    label: 'Лендинг',
    note: 'Одна страница под рекламу',
    base: [50000, 80000],
    weeks: [2, 3],
    scale: [
      { id: 'short', label: 'До 6 экранов', factor: 1 },
      { id: 'long', label: '7–12 экранов', factor: 1.35 },
      { id: 'multi', label: 'Несколько версий под разные объявления', factor: 1.7 },
    ],
  },
  corporate: {
    label: 'Корпоративный сайт',
    note: 'WordPress, контент правите сами',
    base: [120000, 180000],
    weeks: [4, 6],
    scale: [
      { id: 'small', label: 'До 10 страниц', factor: 1 },
      { id: 'medium', label: '10–30 страниц', factor: 1.4 },
      { id: 'large', label: 'Больше 30 страниц', factor: 1.8 },
    ],
  },
  catalog: {
    label: 'Сайт-каталог',
    note: 'Фильтры, выгрузка из Excel',
    base: [150000, 230000],
    weeks: [5, 7],
    scale: [
      { id: 'small', label: 'До 200 позиций', factor: 1 },
      { id: 'medium', label: '200–1000 позиций', factor: 1.35 },
      { id: 'large', label: 'Больше 1000 позиций', factor: 1.75 },
    ],
  },
  shop: {
    label: 'Интернет-магазин',
    note: 'Корзина, оплата, доставка',
    base: [200000, 320000],
    weeks: [6, 10],
    scale: [
      { id: 'small', label: 'До 100 товаров', factor: 1 },
      { id: 'medium', label: '100–500 товаров', factor: 1.4 },
      { id: 'large', label: 'Больше 500 товаров', factor: 1.9 },
    ],
  },
};

/** Чего у клиента нет — за это доплата. «Есть всё» доплат не дает. */
export const EXTRAS = [
  { id: 'texts', label: 'Тексты для страниц', price: 15000 },
  { id: 'logo', label: 'Логотип и фирменный стиль', price: 12000 },
  { id: 'photo', label: 'Фото и иллюстрации', price: 8000 },
  { id: 'domain', label: 'Домен и хостинг', price: 5000 },
];

export const URGENCY = [
  { id: 'rush', label: 'Горит — нужен вчера', factor: 1.25, weeks: -1 },
  { id: 'normal', label: 'Месяц-полтора', factor: 1, weeks: 0 },
  { id: 'relaxed', label: 'Не тороплюсь', factor: 0.95, weeks: 1 },
];

/** До скольки рублей округляем итог: «87 000», а не «86 750» */
const ROUND_TO = 5000;

/**
 * Считает вилку цены и срок по ответам квиза.
 * answers: { type, scale, missing: string[], urgency }
 */
export function calculate(answers) {
  const type = TYPES[answers.type];
  if (!type) return null;

  const scale = type.scale.find((item) => item.id === answers.scale) || type.scale[0];
  const urgency = URGENCY.find((item) => item.id === answers.urgency) || URGENCY[1];

  // Доплаты не зависят от масштаба: тексты пишутся один раз
  const missing = answers.missing || [];
  const addons = EXTRAS.filter((extra) => missing.includes(extra.id)).reduce(
    (sum, extra) => sum + extra.price,
    0
  );

  const price = type.base.map((value) => roundTo(value * scale.factor + addons) * urgency.factor);
  const weeks = type.weeks.map((value) => Math.max(1, Math.round(value * scale.factor) + urgency.weeks));

  return {
    price: price.map(roundTo),
    weeks,
    typeLabel: type.label,
  };
}

function roundTo(value) {
  return Math.round(value / ROUND_TO) * ROUND_TO;
}

/** «85 000 – 130 000 ₽» */
export function formatPrice([min, max]) {
  return `${formatNumber(min)} – ${formatNumber(max)} ₽`;
}

/** «3–4 недели» с правильным окончанием */
export function formatWeeks([min, max]) {
  const label = min === max ? `${min}` : `${min}–${max}`;
  return `${label} ${pluralWeeks(max)}`;
}

function formatNumber(value) {
  return value.toLocaleString('ru-RU');
}

function pluralWeeks(count) {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return 'недель';

  switch (count % 10) {
    case 1:
      return 'неделя';
    case 2:
    case 3:
    case 4:
      return 'недели';
    default:
      return 'недель';
  }
}
