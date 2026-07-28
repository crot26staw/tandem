/**
 * 3D-наклон карточек при наведении: карточка ведет себя как физическая
 * пластина — точка под курсором продавливается вглубь, противоположный
 * край приподнимается к зрителю.
 *
 * Работает только с точным указателем (мышь): на тач-устройствах
 * наклонять нечего, там карточка остается плоской.
 * Углы и позицию блика отдаем в CSS через переменные — сама анимация в CSS.
 */
const MAX_TILT = 7; // максимальный угол наклона, град
const MAX_SHADOW = 12; // максимальный сдвиг тени, px

export function initTilt() {
  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  cards.forEach(setupCard);
}

function setupCard(card) {
  // Класс ставит JS: без скрипта карточка работает по обычным hover-стилям
  card.classList.add('tilt');

  let frame = 0;
  let lastEvent = null;

  const apply = () => {
    frame = 0;
    const rect = card.getBoundingClientRect();
    // Позиция курсора внутри карточки: 0 — левый/верхний край, 1 — правый/нижний
    const px = (lastEvent.clientX - rect.left) / rect.width;
    const py = (lastEvent.clientY - rect.top) / rect.height;

    // Курсор сверху (py -> 0) дает положительный rotateX: верх уходит назад,
    // низ поднимается. По горизонтали так же — край под курсором продавлен.
    const rx = (0.5 - py) * 2 * MAX_TILT;
    const ry = (px - 0.5) * 2 * MAX_TILT;

    card.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`);
    card.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`);
    // Тень уходит в сторону приподнятого края
    card.style.setProperty('--tilt-sx', `${((0.5 - px) * 2 * MAX_SHADOW).toFixed(1)}px`);
    card.style.setProperty('--tilt-sy', `${((0.5 - py) * 2 * MAX_SHADOW).toFixed(1)}px`);
    // Затемнение в точке продавливания
    card.style.setProperty('--tilt-gx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--tilt-gy', `${(py * 100).toFixed(1)}%`);
  };

  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    lastEvent = event;
    apply();
    card.classList.add('is-tilting');
  });

  card.addEventListener('pointermove', (event) => {
    if (!card.classList.contains('is-tilting')) return;
    lastEvent = event;
    // Пересчитываем не чаще кадра: pointermove сыпется чаще отрисовки
    if (!frame) frame = requestAnimationFrame(apply);
  });

  const reset = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    card.classList.remove('is-tilting');
    // Углы обнуляем, чтобы карточка плавно вернулась в плоскость
    card.style.setProperty('--tilt-rx', '0deg');
    card.style.setProperty('--tilt-ry', '0deg');
    card.style.setProperty('--tilt-sx', '0px');
    card.style.setProperty('--tilt-sy', '0px');
  };

  card.addEventListener('pointerleave', reset);
  // Тач/стилус по карточке не должен оставлять ее наклоненной
  card.addEventListener('pointercancel', reset);
}
