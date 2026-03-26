const THEME_KEY = 'fe-guide-theme';
const SIDEBAR_KEY = 'fe-guide-sidebar-collapsed';
const DESKTOP_SECTIONS_KEY = 'fe-guide-desktop-sections-collapsed';

class AppState extends EventTarget {
  #s = {
    theme: 'light',
    locale: 'zh-TW',
    chapterId: 1,
    sectionSlug: null,
    sidebarCollapsed: false,
    desktopSectionsCollapsed: false,
    // 'closed' | 'drawer' | 'sections'
    mobilePanelState: 'closed',
  };

  /** @returns {Readonly<typeof this.#s>} */
  get state() {
    return { ...this.#s };
  }

  /**
   * Merge a patch into state and fire a 'change' event.
   * @param {Partial<typeof this.#s>} patch
   */
  setState(patch) {
    this.#s = { ...this.#s, ...patch };
    this.dispatchEvent(new CustomEvent('change', { detail: this.#s }));
  }
}

export const appState = new AppState();

/**
 * Lit ReactiveController that subscribes a host element to appState changes
 * and triggers re-render on every change.
 */
export class StoreController {
  /** @param {import('lit').ReactiveControllerHost} host */
  constructor(host) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    appState.addEventListener('change', this._update);
  }

  hostDisconnected() {
    appState.removeEventListener('change', this._update);
  }

  _update = () => {
    this.host.requestUpdate();
  };

  /** Convenience getter */
  get state() {
    return appState.state;
  }
}

// ─── Theme helpers ─────────────────────────────────────────────────────────

export function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const theme = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(theme);
}

export function toggleTheme() {
  const next = appState.state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  appState.setState({ theme });

  // Update Prism stylesheet
  const light = document.getElementById('prism-theme-light');
  const dark = document.getElementById('prism-theme-dark');
  if (light) light.disabled = theme === 'dark';
  if (dark) dark.disabled = theme !== 'dark';

  // Update all theme-icon spans
  document.querySelectorAll('.theme-icon').forEach((el) => {
    el.textContent = theme === 'dark' ? '☾' : '☀';
  });
}

// ─── Sidebar helpers ────────────────────────────────────────────────────────

export function initSidebarState() {
  const collapsed = localStorage.getItem(SIDEBAR_KEY) === 'true';
  const sectionsCollapsed = localStorage.getItem(DESKTOP_SECTIONS_KEY) === 'true';
  applyDesktopSidebarState(collapsed);
  applyDesktopSectionsState(sectionsCollapsed);
}

export function applyDesktopSidebarState(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  appState.setState({ sidebarCollapsed: collapsed });

  const collapseBtn = document.getElementById('sidebar-collapse-toggle');
  const expandBtn = document.getElementById('sidebar-expand-toggle');
  collapseBtn?.setAttribute('aria-label', collapsed ? '側欄已收起' : '收起側欄');
  collapseBtn?.setAttribute('aria-expanded', String(!collapsed));
  expandBtn?.setAttribute('aria-expanded', String(!collapsed));
}

export function applyDesktopSectionsState(collapsed) {
  document.body.classList.toggle('desktop-sections-collapsed', collapsed);
  localStorage.setItem(DESKTOP_SECTIONS_KEY, String(collapsed));
  appState.setState({ desktopSectionsCollapsed: collapsed });
}

export function setMobilePanelState(newState) {
  if (window.matchMedia('(min-width: 768px)').matches) {
    newState = 'closed';
  }
  appState.setState({ mobilePanelState: newState });

  const drawer = document.getElementById('mobile-drawer');
  const panel = document.getElementById('sections-panel');
  const overlay = document.getElementById('overlay');
  const hamburger = document.getElementById('hamburger');
  const sectionsToggle = document.getElementById('sections-toggle');

  drawer?.classList.toggle('open', newState === 'drawer');
  drawer?.setAttribute('aria-hidden', String(newState !== 'drawer'));
  panel?.classList.toggle('open', newState === 'sections');
  panel?.setAttribute('aria-hidden', String(newState !== 'sections'));
  overlay?.classList.toggle('active', newState !== 'closed');
  hamburger?.setAttribute('aria-expanded', String(newState === 'drawer'));
  sectionsToggle?.setAttribute('aria-expanded', String(newState === 'sections'));
  const isPanelOpen = newState !== 'closed';
  document.documentElement.classList.toggle('mobile-panel-open', isPanelOpen);
  document.body.classList.toggle('mobile-panel-open', isPanelOpen);
}
