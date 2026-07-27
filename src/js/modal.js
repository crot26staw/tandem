/**
 * Модальные окна на нативном <dialog>: фокус-ловушка, Escape и
 * блокировка фона достаются бесплатно.
 * Если <dialog> не поддерживается, клик не перехватываем — ссылка
 * работает как якорь на соответствующую секцию.
 */
export function initModal() {
  const openers = document.querySelectorAll('[data-modal-open]');
  if (!openers.length) return;

  let lastOpener = null;

  openers.forEach((opener) => {
    const modal = document.getElementById(opener.dataset.modalOpen);
    if (!modal || typeof modal.showModal !== 'function') return;

    opener.addEventListener('click', (event) => {
      event.preventDefault();
      lastOpener = opener;
      modal.showModal();
      // Отдельный класс: мобильное меню снимает свой is-locked при закрытии
      document.body.classList.add('is-modal-open');
    });
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => modal.close());
    });

    // Клик по подложке: цель события — сам dialog, а не его содержимое
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });

    modal.addEventListener('close', () => {
      document.body.classList.remove('is-modal-open');
      // Кнопка мобильного меню к этому моменту уже скрыта — фокус ей не вернуть
      if (lastOpener && lastOpener.offsetParent !== null) lastOpener.focus();
      lastOpener = null;
    });
  });
}
