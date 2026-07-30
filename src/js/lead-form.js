/**
 * Формы заявки (в блоке lead и в модальном окне): выбор канала связи,
 * маска телефона и клиентская валидация обязательных полей.
 *
 * Клиент сам выбирает, куда с ним связаться, — поле контакта подстраивается
 * под выбор. Телефон и MAX работают по номеру (MAX регистрируется на номер),
 * Telegram — по нику, и просить там номер незачем.
 *
 * Отправку подключаем позже (WP admin-ajax / Contact Form 7 / внешний обработчик).
 */
import { initPhoneMask, isPhoneComplete } from './phone-mask.js';

const CHANNELS = {
  phone: {
    label: 'Телефон',
    placeholder: '+7 (___) ___ __ __',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
    maxlength: '18',
    masked: true,
  },
  telegram: {
    label: 'Ник в Telegram',
    placeholder: '@username',
    type: 'text',
    inputmode: 'text',
    autocomplete: 'off',
    maxlength: '33',
    masked: false,
  },
  max: {
    label: 'Номер в MAX',
    placeholder: '+7 (___) ___ __ __',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
    maxlength: '18',
    masked: true,
  },
};

const DEFAULT_CHANNEL = 'phone';
const MIN_NICK_LENGTH = 3;

export function initLeadForm() {
  document.querySelectorAll('.lead-form').forEach(setupForm);
}

function setupForm(form) {
  const contact = form.querySelector('[data-contact]');
  const contactLabel = form.querySelector('[data-contact-label]');
  const switches = form.querySelectorAll('[name="channel"]');
  const fields = form.querySelectorAll('[required]');

  const mask = initPhoneMask(contact);

  switches.forEach((option) => {
    option.addEventListener('change', () => {
      if (option.checked) applyChannel(option.value);
    });
  });

  // Стартовое состояние берем из разметки — там уже отмечен телефон
  applyChannel(currentChannel(switches));

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (isFilled(field, contact, currentChannel(switches))) field.classList.remove('is-invalid');
    });
  });

  form.addEventListener('submit', (event) => {
    const channel = currentChannel(switches);
    let firstInvalid = null;

    fields.forEach((field) => {
      const invalid = !isFilled(field, contact, channel);
      field.classList.toggle('is-invalid', invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      event.preventDefault();
      firstInvalid.focus();
    }
  });

  /** Перестраиваем поле контакта под выбранный канал */
  function applyChannel(name) {
    const channel = CHANNELS[name] || CHANNELS[DEFAULT_CHANNEL];
    if (!contact) return;

    // Номер телефона не годится как ник и наоборот — старое значение стираем
    contact.value = '';
    contact.classList.remove('is-invalid');

    if (contactLabel) contactLabel.textContent = channel.label;
    contact.type = channel.type;
    contact.placeholder = channel.placeholder;
    contact.setAttribute('inputmode', channel.inputmode);
    contact.setAttribute('autocomplete', channel.autocomplete);
    contact.setAttribute('maxlength', channel.maxlength);

    if (!mask) return;
    if (channel.masked) mask.enable();
    else mask.disable();
  }
}

function currentChannel(switches) {
  const checked = Array.from(switches).find((option) => option.checked);
  return checked ? checked.value : DEFAULT_CHANNEL;
}

/**
 * Поле контакта проверяем по правилам канала: номер — только полностью
 * набранный, ник — по длине. Остальные поля достаточно заполнить.
 */
function isFilled(field, contact, channelName) {
  if (field !== contact) return Boolean(field.value.trim());

  const channel = CHANNELS[channelName] || CHANNELS[DEFAULT_CHANNEL];
  if (channel.masked) return isPhoneComplete(field);

  return field.value.replace('@', '').trim().length >= MIN_NICK_LENGTH;
}
