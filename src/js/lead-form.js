/**
 * Формы заявки (в блоке lead и в модальном окне): маска телефона
 * и клиентская валидация обязательных полей.
 * Отправку подключаем позже (WP admin-ajax / Contact Form 7 / внешний обработчик).
 */
import { initPhoneMask, isPhoneComplete } from './phone-mask.js';

export function initLeadForm() {
  document.querySelectorAll('.lead-form').forEach(setupForm);
}

function setupForm(form) {
  const phone = form.querySelector('[data-phone]');
  const fields = form.querySelectorAll('[required]');

  initPhoneMask(phone);

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (isFilled(field, phone)) field.classList.remove('is-invalid');
    });
  });

  form.addEventListener('submit', (event) => {
    let firstInvalid = null;

    fields.forEach((field) => {
      const invalid = !isFilled(field, phone);
      field.classList.toggle('is-invalid', invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      event.preventDefault();
      firstInvalid.focus();
    }
  });
}

/** Телефон считаем заполненным только с полным номером, остальное — по непустому значению */
function isFilled(field, phone) {
  return field === phone ? isPhoneComplete(field) : Boolean(field.value.trim());
}
