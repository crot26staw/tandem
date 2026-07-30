/**
 * Маска телефона в формате +7 (___) ___ __ __
 * Источник истины — 10 национальных цифр; строка пересобирается на каждый ввод,
 * поэтому вставка из буфера и правка в середине не ломают формат.
 *
 * Маску можно выключить: в форме переключается канал связи, и для ника
 * в Telegram форматирование номера только мешает.
 * Возвращает { enable, disable } либо null, если поля нет.
 */
const PREFIX = '+7 (';
const MAX_DIGITS = 10;

export function initPhoneMask(input) {
  if (!input) return null;

  let enabled = true;

  // Ставим префикс, чтобы было видно, куда печатать
  input.addEventListener('focus', () => {
    if (!enabled) return;
    if (!input.value) {
      input.value = PREFIX;
      setCaret(input, input.value.length);
    }
  });

  // Пустой префикс не оставляем: иначе placeholder не виден, а поле «не пустое»
  input.addEventListener('blur', () => {
    if (!enabled) return;
    if (!nationalDigits(input.value)) input.value = '';
  });

  input.addEventListener('input', (event) => {
    if (!enabled) return;

    const raw = input.value;
    const caret = raw.length;
    let digits = nationalDigits(raw);
    let before = digitsBefore(raw, input.selectionStart ?? caret);

    // Backspace по разделителю цифры не меняет — удаляем цифру перед кареткой
    if (
      event.inputType === 'deleteContentBackward' &&
      digits === input.dataset.digits &&
      before > 0
    ) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    }

    input.dataset.digits = digits;
    input.value = format(digits);
    setCaret(input, caretFor(input.value, before));
  });

  return {
    enable() {
      enabled = true;
    },
    disable() {
      enabled = false;
      delete input.dataset.digits; // иначе логика backspace помнит старый номер
    },
  };
}

/** Номер введен полностью (все 10 цифр) */
export function isPhoneComplete(input) {
  return nationalDigits(input.value).length === MAX_DIGITS;
}

/** Цифры без кода страны: 8 и 7 в начале отбрасываем */
function nationalDigits(value) {
  let digits = value.replace(/\D/g, '');
  if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
  return digits.slice(0, MAX_DIGITS);
}

function format(digits) {
  if (!digits) return PREFIX;

  let out = PREFIX + digits.slice(0, 3);
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += ` ${digits.slice(6, 8)}`;
  if (digits.length > 8) out += ` ${digits.slice(8, 10)}`;
  return out;
}

/** Сколько национальных цифр стоит левее каретки */
function digitsBefore(value, caret) {
  const head = value.slice(0, caret).replace(/\D/g, '').length;
  const all = value.replace(/\D/g, '');
  const hasCountry = all[0] === '7' || all[0] === '8';
  return Math.max(0, hasCountry ? head - 1 : head);
}

/** Позиция каретки после N-й национальной цифры в отформатированной строке */
function caretFor(value, count) {
  if (count <= 0) return Math.min(PREFIX.length, value.length);

  let seen = -1; // первая цифра строки — код страны
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] >= '0' && value[i] <= '9') {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return value.length;
}

function setCaret(input, position) {
  input.setSelectionRange(position, position);
}
