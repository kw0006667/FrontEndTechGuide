// Register Lit components
import './components/sidebar-nav.js';
import './components/mobile-drawer.js';
import './components/sections-panel.js';
import './components/content-area.js';

import { appState, initTheme, initSidebarState, toggleTheme, setMobilePanelState, applyDesktopSidebarState, applyDesktopSectionsState } from './state/index.js';
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  // Bootstrap core systems
  initTheme();
  initSidebarState();
  initRouter();
  initLanguageMenus();
  initNavControls();

  // Replace static sidebar-nav placeholder with Lit component
  const sidebarNavPlaceholder = document.getElementById('sidebar-nav');
  if (sidebarNavPlaceholder) {
    const sidebarComponent = document.createElement('app-sidebar');
    sidebarNavPlaceholder.replaceWith(sidebarComponent);
  }

  // Replace drawer-nav placeholder with Lit component
  const drawerNavPlaceholder = document.getElementById('drawer-nav');
  if (drawerNavPlaceholder) {
    const drawerComponent = document.createElement('app-mobile-drawer');
    drawerNavPlaceholder.replaceWith(drawerComponent);
  }

  // Replace sections-nav placeholder with Lit component
  const sectionsNavPlaceholder = document.getElementById('sections-nav');
  if (sectionsNavPlaceholder) {
    const sectionsComponent = document.createElement('app-sections-panel');
    sectionsNavPlaceholder.replaceWith(sectionsComponent);
  }

  // Replace content area with Lit component
  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    const contentComponent = document.createElement('app-content-area');
    contentArea.replaceWith(contentComponent);
  }

  // Theme toggle buttons
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);
});

function initNavControls() {
  const hamburger = document.getElementById('hamburger');
  const drawerClose = document.getElementById('drawer-close');
  const sectionsToggle = document.getElementById('sections-toggle');
  const sectionsClose = document.getElementById('sections-close');
  const overlay = document.getElementById('overlay');
  const collapseToggle = document.getElementById('sidebar-collapse-toggle');
  const expandToggle = document.getElementById('sidebar-expand-toggle');

  hamburger?.addEventListener('click', () => {
    const { mobilePanelState } = getState();
    setMobilePanelState(mobilePanelState === 'drawer' ? 'closed' : 'drawer');
  });

  drawerClose?.addEventListener('click', () => setMobilePanelState('closed'));

  sectionsToggle?.addEventListener('click', () => {
    if (isDesktop()) {
      applyDesktopSectionsState(false);
      return;
    }
    const { mobilePanelState } = getState();
    setMobilePanelState(mobilePanelState === 'sections' ? 'closed' : 'sections');
  });

  sectionsClose?.addEventListener('click', () => {
    if (isDesktop()) {
      applyDesktopSectionsState(true);
      return;
    }
    setMobilePanelState('closed');
  });

  overlay?.addEventListener('click', () => setMobilePanelState('closed'));

  collapseToggle?.addEventListener('click', () => {
    applyDesktopSidebarState(true);
    applyDesktopSectionsState(false);
    setMobilePanelState('closed');
  });

  expandToggle?.addEventListener('click', () => {
    applyDesktopSidebarState(false);
    applyDesktopSectionsState(false);
  });

  // Escape key closes panels
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setMobilePanelState('closed');
      closeLanguageMenus();
    }
  });
}

function initLanguageMenus() {
  const menus = Array.from(document.querySelectorAll('[data-language-menu]'));
  if (!menus.length) return;

  const closeMenu = (menu) => {
    menu.classList.remove('is-open');
    menu.querySelector('.language-menu-trigger')?.setAttribute('aria-expanded', 'false');
    menu.querySelector('.language-menu')?.setAttribute('hidden', '');
  };

  const openMenu = (menu) => {
    menus.forEach((m) => { if (m !== menu) closeMenu(m); });
    menu.classList.add('is-open');
    menu.querySelector('.language-menu-trigger')?.setAttribute('aria-expanded', 'true');
    menu.querySelector('.language-menu')?.removeAttribute('hidden');
  };

  menus.forEach((menu) => {
    const trigger = menu.querySelector('.language-menu-trigger');
    if (!trigger || trigger.disabled) { closeMenu(menu); return; }
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.contains('is-open') ? closeMenu(menu) : openMenu(menu);
    });
  });

  document.addEventListener('click', (e) => {
    menus.forEach((m) => { if (!m.contains(e.target)) closeMenu(m); });
  });

  window._closeLanguageMenus = () => menus.forEach(closeMenu);
}

function closeLanguageMenus() {
  window._closeLanguageMenus?.();
}

function isDesktop() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function getState() {
  return appState.state;
}
