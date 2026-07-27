/**
 * FAQ-аккордеон на нативных <details>.
 * Работает и без JS; скрипт добавляет плавное раскрытие
 * и оставляет открытым один пункт за раз.
 */
const DURATION = 320;

export function initFaq() {
  const items = Array.from(document.querySelectorAll('#faq-list .faq__item'));
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  items.forEach((item) => {
    const summary = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');
    if (!summary || !answer) return;

    summary.addEventListener('click', (event) => {
      // Отключаем нативный мгновенный toggle — открываем и закрываем сами
      event.preventDefault();
      if (item.dataset.animating) return;

      if (reduced.matches) {
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
        item.open = !item.open;
        return;
      }

      if (item.open) {
        collapse(item, answer);
        return;
      }

      items.forEach((other) => {
        if (other === item || !other.open) return;
        // Уже анимируется — закрываем без анимации, чтобы не было двух открытых
        if (other.dataset.animating) {
          other.open = false;
          return;
        }
        collapse(other, other.querySelector('.faq__answer'));
      });
      expand(item, answer);
    });
  });
}

/** Раскрывает пункт: 0 -> фактическая высота ответа */
function expand(item, answer) {
  item.open = true;
  animateHeight(item, answer, '0px', `${answer.scrollHeight}px`);
}

/**
 * Схлопывает пункт. Атрибут open снимаем только в конце,
 * иначе контент исчезнет до начала анимации.
 */
function collapse(item, answer) {
  if (!answer) {
    item.open = false;
    return;
  }
  item.classList.add('is-closing');
  animateHeight(item, answer, `${answer.scrollHeight}px`, '0px', () => {
    item.open = false;
    item.classList.remove('is-closing');
  });
}

function animateHeight(item, answer, from, to, onFinish) {
  item.dataset.animating = '1';

  const animation = answer.animate(
    { height: [from, to] },
    { duration: DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  );

  animation.onfinish = () => {
    delete item.dataset.animating;
    // Высоту не фиксируем — ответ должен переверстываться при resize
    answer.style.height = '';
    if (onFinish) onFinish();
  };
}
