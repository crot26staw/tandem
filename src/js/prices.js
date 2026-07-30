/**
 * Точка входа страницы цен.
 * Отдельная от main.js намеренно: здесь нет таймлайна, а значит
 * не нужен GSAP — это почти весь вес основного бандла.
 */
import { initNav } from './nav.js';
import { initFaq } from './faq.js';
import { initLeadForm } from './lead-form.js';
import { initModal } from './modal.js';
import { initTilt } from './tilt.js';
import { initWorkHours } from './work-hours.js';
import { initQuiz } from './quiz.js';
import { TYPES, formatPrice, formatWeeks } from './pricing.js';

initPriceCards();
initNav();
initFaq();
initQuiz(); // до формы: на шаге результата лежит еще одна .lead-form
initLeadForm();
initModal();
initTilt();
initWorkHours();

/**
 * Карточки вилок собираем из модели цены, а не пишем руками:
 * иначе цифры на странице и в квизе однажды разойдутся.
 */
function initPriceCards() {
  const grid = document.querySelector('[data-price-grid]');
  if (!grid) return;

  Object.values(TYPES).forEach((type) => {
    const card = document.createElement('article');
    card.className = 'card card--price';
    card.dataset.tilt = '';

    card.innerHTML = `
      <h2 class="card__title"></h2>
      <p class="card__text card__text--note"></p>
      <p class="price-card__value"></p>
      <p class="price-card__weeks"></p>
      <a class="card__link" href="#quiz">Рассчитать точнее <span aria-hidden="true">→</span></a>
    `;

    card.querySelector('.card__title').textContent = type.label;
    card.querySelector('.card__text--note').textContent = type.note;
    card.querySelector('.price-card__value').textContent = formatPrice(type.base);
    card.querySelector('.price-card__weeks').textContent = `Срок: ${formatWeeks(type.weeks)}`;

    grid.append(card);
  });
}
