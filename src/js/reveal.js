import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Шаги таймлайна выезжают по мере прокрутки страницы (GSAP + ScrollTrigger).
 * Анимация привязана к позиции скролла (scrub): вниз — шаги поочередно
 * выезжают, вверх — так же поочередно уезжают обратно.
 * Без JS шаги просто видны сразу — начальное состояние ставит сам GSAP.
 */
gsap.registerPlugin(ScrollTrigger);

const SHIFT = 40; // сдвиг снизу перед появлением, px
const STAGGER = 0.25; // сдвиг соседних шагов по шкале анимации

export function initReveal() {
  const items = gsap.utils.toArray('#process .timeline__item');
  if (!items.length) return;

  // Уважаем системную настройку: без анимации шаги видны сразу
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Прячем шаги сразу. Без этого при stagger в момент времени 0 GSAP
  // отрисовывает только первый под-твин, а шаги 2-5 до своей очереди
  // остаются в обычном CSS-состоянии — то есть видимыми при первом подходе
  // к блоку (после первого прохода плейхеда значения уже записаны).
  gsap.set(items, { opacity: 0, y: SHIFT });

  // Именно fromTo, а не from: from ставит runBackwards и переворачивает
  // порядок stagger — первый шаг появлялся бы последним
  gsap.fromTo(
    items,
    { opacity: 0, y: SHIFT },
    {
      opacity: 1,
      y: 0,
      // Линейная кривая: шаг движется ровно за скроллом, без доводки
      ease: 'none',
      stagger: STAGGER,
      scrollTrigger: {
        trigger: '#process .timeline',
        // Старт — когда верх списка поднялся выше нижней трети экрана:
        // раньше этого блок только выглядывает снизу и анимация читается
        // как сработавшая заранее. Финиш — когда низ списка прошел середину.
        start: 'top 70%',
        end: 'bottom 45%',
        // Небольшая инерция: шаги догоняют скролл за 0.4с, а не дергаются
        scrub: 0.4,
        invalidateOnRefresh: true,
        // Для подбора границ: markers: true покажет линии start/end на экране
      },
    }
  );
}
