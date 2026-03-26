import { chapters, getChapterById } from './chapters/index.js';
import { appState } from './state/index.js';

// All valid chapter IDs (numeric + appendix strings)
const VALID_IDS = new Set(chapters.map((ch) => String(ch.id)));

let _teardownScrollSync = null;
let _suppressSync = false;
let _suppressTimer = null;

export function initRouter() {
  window.addEventListener('hashchange', _onHashChange);
  _onHashChange();
}

function _onHashChange() {
  const hash = window.location.hash.slice(1); // remove '#'
  const parsed = parseHash(hash);
  if (!parsed) {
    // Default to chapter 1
    navigateTo(1, null, false);
    return;
  }
  const { chapterId, sectionSlug } = parsed;
  navigateTo(chapterId, sectionSlug, false);
}

/**
 * Parse a hash string like 'chapter-1' or 'chapter-1-type-narrowing'
 * or 'appendix-a' or 'appendix-a-array-complexity'
 */
function parseHash(hash) {
  if (!hash) return null;

  // appendix-a, appendix-b, appendix-c, appendix-d
  const appendixMatch = hash.match(/^appendix-([abcd])(?:-(.+))?$/);
  if (appendixMatch) {
    const chapterId = 'app' + appendixMatch[1].toUpperCase();
    if (VALID_IDS.has(chapterId)) {
      return { chapterId, sectionSlug: appendixMatch[2] ?? null };
    }
  }

  // chapter-N[-section-slug]
  const chapterMatch = hash.match(/^chapter-(\w+?)(?:-(.+))?$/);
  if (chapterMatch) {
    // Try numeric first
    const numId = parseInt(chapterMatch[1], 10);
    if (!isNaN(numId) && VALID_IDS.has(String(numId))) {
      return { chapterId: numId, sectionSlug: chapterMatch[2] ?? null };
    }
  }

  return null;
}

export function navigateTo(chapterId, sectionSlug = null, updateHash = true) {
  const chapter = getChapterById(chapterId);
  if (!chapter) return;

  // Update state
  appState.setState({ chapterId, sectionSlug });

  // Update hash
  if (updateHash) {
    const base = chapter.slug;
    const newHash = sectionSlug ? `${base}-${sectionSlug}` : base;
    history.replaceState(null, '', `#${newHash}`);
  }

  // Suppress scroll sync briefly
  _suppressHash(700);

  // Setup scroll sync after content loads
  if (_teardownScrollSync) {
    _teardownScrollSync();
    _teardownScrollSync = null;
  }
  setTimeout(() => {
    _teardownScrollSync = initSectionSync(chapter);
  }, 400);
}

function initSectionSync(chapter) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return () => {};

  let rafId = null;

  const onScroll = () => {
    if (_suppressSync) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      _detectActiveSection(chapter, contentArea);
    });
  };

  // Use window scroll on mobile, content-area scroll on desktop
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const scrollTarget = isDesktop ? contentArea : window;

  scrollTarget.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    scrollTarget.removeEventListener('scroll', onScroll);
    if (rafId) cancelAnimationFrame(rafId);
  };
}

function _detectActiveSection(chapter, contentArea) {
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const threshold = isDesktop
    ? contentArea.scrollTop + contentArea.clientHeight * 0.28
    : window.scrollY + window.innerHeight * 0.28;

  let activeSlug = chapter.sections[0]?.slug ?? null;

  for (const section of chapter.sections) {
    const el = document.getElementById(section.slug);
    if (!el) continue;
    const top = isDesktop
      ? el.offsetTop
      : el.getBoundingClientRect().top + window.scrollY;
    if (top <= threshold) {
      activeSlug = section.slug;
    }
  }

  if (activeSlug !== appState.state.sectionSlug) {
    appState.setState({ sectionSlug: activeSlug });
    // Update hash silently
    const chapter_ = getChapterById(appState.state.chapterId);
    if (chapter_) {
      const newHash = activeSlug ? `${chapter_.slug}-${activeSlug}` : chapter_.slug;
      history.replaceState(null, '', `#${newHash}`);
    }
  }
}

function _suppressHash(ms) {
  _suppressSync = true;
  if (_suppressTimer) clearTimeout(_suppressTimer);
  _suppressTimer = setTimeout(() => { _suppressSync = false; }, ms);
}

export function getCurrentChapterId() {
  return appState.state.chapterId;
}
