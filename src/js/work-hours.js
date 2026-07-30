/**
 * Живой статус связи под формой заявки: «сейчас на связи» или
 * «перезвоним завтра с 10:00».
 *
 * Считаем по московскому времени, а не по локальному времени посетителя:
 * клиент из Владивостока в 10 утра пишет нам в 3 ночи, и обещание
 * «перезвоним за 15 минут» для него было бы враньем.
 *
 * Без JS в разметке остается общая формулировка — она верна всегда.
 */
const TZ = 'Europe/Moscow';
const WORK_DAYS = [1, 2, 3, 4, 5]; // пн–пт (0 — воскресенье)
const OPEN_MIN = 10 * 60; // 10:00
const CLOSE_MIN = 19 * 60; // 19:00
const OPEN_LABEL = '10:00';
const CALLBACK = '15 минут';

// Предложный падеж: «перезвоним в понедельник»
const DAY_NAMES = [
  'в воскресенье',
  'в понедельник',
  'во вторник',
  'в среду',
  'в четверг',
  'в пятницу',
  'в субботу',
];

export function initWorkHours() {
  const nodes = document.querySelectorAll('[data-work-status]');
  if (!nodes.length) return;

  render(nodes);
  // Страницу могут держать открытой — раз в минуту пересчитываем,
  // чтобы статус не завис на «сейчас на связи» после 19:00.
  setInterval(() => render(nodes), 60 * 1000);
}

function render(nodes) {
  const { day, minutes } = moscowNow();
  const open = WORK_DAYS.includes(day) && minutes >= OPEN_MIN && minutes < CLOSE_MIN;

  const text = open
    ? `Сейчас на связи — свяжемся в течение ${CALLBACK}`
    : `Сейчас нерабочее время — свяжемся ${nextOpening(day, minutes)} с ${OPEN_LABEL}`;

  nodes.forEach((node) => {
    const label = node.querySelector('.work-status__text');
    if (label) label.textContent = text;
    node.classList.toggle('is-open', open);
    node.classList.toggle('is-closed', !open);
  });
}

/** Когда ближайшее открытие: «сегодня», «завтра» или день недели */
function nextOpening(day, minutes) {
  if (WORK_DAYS.includes(day) && minutes < OPEN_MIN) return 'сегодня';

  let next = (day + 1) % 7;
  let ahead = 1;
  while (!WORK_DAYS.includes(next)) {
    next = (next + 1) % 7;
    ahead += 1;
  }

  return ahead === 1 ? 'завтра' : DAY_NAMES[next];
}

/**
 * Текущее московское время. Собираем «московские» части как UTC-дату —
 * тогда getUTCDay() отдает правильный день недели независимо от того,
 * в каком часовом поясе открыт браузер.
 */
function moscowNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23', // иначе полночь в части браузеров приходит как «24»
  }).formatToParts(new Date());

  const get = (type) => Number(parts.find((part) => part.type === type).value);
  const date = new Date(
    Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  );

  return {
    day: date.getUTCDay(),
    minutes: date.getUTCHours() * 60 + date.getUTCMinutes(),
  };
}
