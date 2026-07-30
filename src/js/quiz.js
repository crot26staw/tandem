/**
 * Квиз-калькулятор на странице цен: 4 вопроса и расчет вилки.
 *
 * Одиночный выбор переводит на следующий шаг сразу — лишний клик по «Далее»
 * на каждом шаге заметно снижает доходимость. Кнопка нужна только там,
 * где вариантов можно отметить несколько.
 *
 * Шаг с результатом лежит в разметке статически: там форма заявки,
 * которую поднимает lead-form.js со своей маской и выбором канала.
 */
import { TYPES, EXTRAS, URGENCY, calculate, formatPrice, formatWeeks } from './pricing.js';

const STEPS = ['type', 'missing', 'scale', 'urgency'];
const TOTAL = STEPS.length + 1; // последний шаг — результат

export function initQuiz() {
  const root = document.querySelector('[data-quiz]');
  if (!root) return;

  const body = root.querySelector('[data-quiz-body]');
  const result = root.querySelector('[data-quiz-result]');
  const back = root.querySelector('[data-quiz-back]');
  const next = root.querySelector('[data-quiz-next]');
  const bar = root.querySelector('[data-quiz-bar]');
  const current = root.querySelector('[data-quiz-current]');
  const total = root.querySelector('[data-quiz-total]');

  const answers = { type: null, missing: [], scale: null, urgency: null };
  let step = 0;

  if (total) total.textContent = String(TOTAL);
  back?.addEventListener('click', () => go(step - 1));
  next?.addEventListener('click', () => go(step + 1));

  render();

  function go(target) {
    step = Math.max(0, Math.min(TOTAL - 1, target));
    render();

    // Прокручиваем к началу квиза, иначе после длинного шага
    // следующий вопрос оказывается выше экрана
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render() {
    const isResult = step === STEPS.length;

    if (current) current.textContent = String(step + 1);
    if (bar) bar.style.width = `${((step + 1) / TOTAL) * 100}%`;
    if (back) back.hidden = step === 0;

    body.hidden = isResult;
    if (result) result.hidden = !isResult;

    if (isResult) {
      if (next) next.hidden = true;
      showResult();
      return;
    }

    const name = STEPS[step];
    body.innerHTML = '';
    body.append(renderStep(name));

    // «Далее» нужна только на шаге с множественным выбором
    if (next) next.hidden = name !== 'missing';
  }

  function renderStep(name) {
    switch (name) {
      case 'type':
        return single(
          'Какой сайт нужен?',
          '',
          Object.entries(TYPES).map(([id, type]) => ({ id, label: type.label, note: type.note })),
          answers.type,
          (id) => {
            // Масштаб зависит от типа — при смене типа старый ответ невалиден
            if (answers.type !== id) answers.scale = null;
            answers.type = id;
            go(step + 1);
          }
        );

      case 'missing':
        return multi(
          'Что нужно сделать нам?',
          'Ничего не отмечайте, если все это у вас уже есть',
          EXTRAS.map((extra) => ({ id: extra.id, label: extra.label })),
          answers.missing,
          (selected) => {
            answers.missing = selected;
          }
        );

      case 'scale': {
        const type = TYPES[answers.type] || TYPES.landing;
        return single(
          'Какого объема проект?',
          'Точное число уточним на созвоне — сейчас достаточно порядка',
          type.scale.map((item) => ({ id: item.id, label: item.label })),
          answers.scale,
          (id) => {
            answers.scale = id;
            go(step + 1);
          }
        );
      }

      case 'urgency':
      default:
        return single(
          'Когда нужен результат?',
          'Срочные проекты дороже: приходится двигать очередь',
          URGENCY.map((item) => ({ id: item.id, label: item.label })),
          answers.urgency,
          (id) => {
            answers.urgency = id;
            go(step + 1);
          }
        );
    }
  }

  function showResult() {
    const estimate = calculate(answers);
    if (!estimate) return;

    setText('[data-quiz-price]', formatPrice(estimate.price));
    setText('[data-quiz-weeks]', formatWeeks(estimate.weeks));

    // Итог квиза уходит вместе с заявкой — менеджер видит ответы до звонка
    const payload = root.querySelector('[data-quiz-payload]');
    if (payload) payload.value = summary(estimate);
  }

  function setText(selector, value) {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  }

  function summary(estimate) {
    const type = TYPES[answers.type];
    const scale = type?.scale.find((item) => item.id === answers.scale);
    const urgency = URGENCY.find((item) => item.id === answers.urgency);
    const missing = EXTRAS.filter((extra) => answers.missing.includes(extra.id)).map(
      (extra) => extra.label
    );

    return [
      estimate.typeLabel,
      scale?.label,
      missing.length ? `нужно от нас: ${missing.join(', ')}` : 'материалы у клиента',
      urgency?.label,
      `оценка: ${formatPrice(estimate.price)}, ${formatWeeks(estimate.weeks)}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
}

/** Шаг с одиночным выбором: клик по варианту сразу ведет дальше */
function single(title, hint, options, selected, onPick) {
  const wrap = stepShell(title, hint);
  const list = optionList(options.length);

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz__option';
    button.classList.toggle('is-picked', option.id === selected);
    button.innerHTML = `<span class="quiz__option-label"></span>${
      option.note ? '<span class="quiz__option-note"></span>' : ''
    }`;
    button.querySelector('.quiz__option-label').textContent = option.label;
    if (option.note) button.querySelector('.quiz__option-note').textContent = option.note;
    button.addEventListener('click', () => onPick(option.id));
    list.append(button);
  });

  wrap.append(list);
  return wrap;
}

/** Шаг с несколькими вариантами: собираем отмеченное, дальше — по кнопке */
function multi(title, hint, options, selected, onChange) {
  const wrap = stepShell(title, hint);
  const list = optionList(options.length);
  const picked = new Set(selected);

  options.forEach((option) => {
    const label = document.createElement('label');
    label.className = 'quiz__option quiz__option--check';
    label.classList.toggle('is-picked', picked.has(option.id));

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'quiz__checkbox';
    input.checked = picked.has(option.id);

    const text = document.createElement('span');
    text.className = 'quiz__option-label';
    text.textContent = option.label;

    input.addEventListener('change', () => {
      if (input.checked) picked.add(option.id);
      else picked.delete(option.id);
      label.classList.toggle('is-picked', input.checked);
      onChange(Array.from(picked));
    });

    label.append(input, text);
    list.append(label);
  });

  wrap.append(list);
  return wrap;
}

/** Четыре варианта и больше встают в две колонки — иначе шаг уезжает за экран */
function optionList(count) {
  const list = document.createElement('div');
  list.className = count >= 4 ? 'quiz__options quiz__options--two' : 'quiz__options';
  return list;
}

function stepShell(title, hint) {
  const wrap = document.createElement('div');
  wrap.className = 'quiz__step';

  const heading = document.createElement('h3');
  heading.className = 'quiz__question';
  heading.textContent = title;
  wrap.append(heading);

  if (hint) {
    const note = document.createElement('p');
    note.className = 'quiz__hint';
    note.textContent = hint;
    wrap.append(note);
  }

  return wrap;
}
