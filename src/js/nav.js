/**
 * Шапка: мобильное меню (бургер) и выпадающее подменю «Услуги».
 * На десктопе подменю открывается по hover/focus средствами CSS,
 * здесь обрабатываем клик и клавиатуру.
 */

const DESKTOP = '(min-width: 1024px)';

export function initNav() {
  const burger = document.querySelector('#burger');
  const nav = document.querySelector('#nav');
  if (!burger || !nav) return;

  const submenuToggle = nav.querySelector('.nav__toggle');
  const submenu = submenuToggle
    ? document.getElementById(submenuToggle.getAttribute('aria-controls'))
    : null;

  const isDesktop = () => window.matchMedia(DESKTOP).matches;

  const closeMenu = () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('is-locked');
  };

  const openMenu = () => {
    nav.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    document.body.classList.add('is-locked');
  };

  const closeSubmenu = () => {
    if (!submenu || !submenuToggle) return;
    submenu.classList.remove('is-open');
    submenuToggle.setAttribute('aria-expanded', 'false');
  };

  // Бургер
  burger.addEventListener('click', () => {
    if (nav.classList.contains('is-open')) {
      closeMenu();
      closeSubmenu();
    } else {
      openMenu();
    }
  });

  // Подменю «Услуги»
  if (submenu && submenuToggle) {
    submenuToggle.addEventListener('click', () => {
      const isOpen = submenu.classList.toggle('is-open');
      submenuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Клик по любой ссылке меню закрывает мобильную панель
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && !isDesktop()) {
      closeMenu();
      closeSubmenu();
    }
  });

  // Escape закрывает всё открытое
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeSubmenu();
    if (nav.classList.contains('is-open')) {
      closeMenu();
      burger.focus();
    }
  });

  // Клик вне шапки закрывает подменю на десктопе
  document.addEventListener('click', (event) => {
    if (isDesktop() && !event.target.closest('.nav__item--has-submenu')) {
      closeSubmenu();
    }
  });

  // При переходе на десктопную ширину сбрасываем мобильное состояние
  window.matchMedia(DESKTOP).addEventListener('change', (event) => {
    if (event.matches) {
      closeMenu();
      closeSubmenu();
    }
  });
}
