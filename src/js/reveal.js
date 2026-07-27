/**
 * Поочередное появление шагов таймлайна при попадании в вьюпорт.
 * Без JS (или без IntersectionObserver) шаги просто видны сразу.
 */
const STEP_DELAY = 120; // мс между соседними шагами

export function initReveal() {
  const items = document.querySelectorAll('#process .timeline__item');
  if (!items.length || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('has-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      // Задержку считаем внутри текущей пачки: на десктопе шаги
      // въезжают каскадом, на мобайле — без долгого ожидания
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Number(a.target.dataset.revealIndex) - Number(b.target.dataset.revealIndex))
        .forEach((entry, index) => {
          entry.target.style.setProperty('--reveal-delay', `${index * STEP_DELAY}ms`);
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  items.forEach((item, index) => {
    item.dataset.revealIndex = String(index);
    observer.observe(item);
  });
}
