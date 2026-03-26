import { LitElement, html } from 'lit';
import { StoreController } from '../state/index.js';
import { getChapterById, getPartForChapter, getPrevNext } from '../chapters/index.js';

const CHAPTER_MODULES = {
  1: () => import('../chapters/ch01.js'),
  2: () => import('../chapters/ch02.js'),
  3: () => import('../chapters/ch03.js'),
  4: () => import('../chapters/ch04.js'),
  5: () => import('../chapters/ch05.js'),
  6: () => import('../chapters/ch06.js'),
  7: () => import('../chapters/ch07.js'),
  8: () => import('../chapters/ch08.js'),
  9: () => import('../chapters/ch09.js'),
  10: () => import('../chapters/ch10.js'),
  11: () => import('../chapters/ch11.js'),
  12: () => import('../chapters/ch12.js'),
  13: () => import('../chapters/ch13.js'),
  14: () => import('../chapters/ch14.js'),
  15: () => import('../chapters/ch15.js'),
  16: () => import('../chapters/ch16.js'),
  17: () => import('../chapters/ch17.js'),
  18: () => import('../chapters/ch18.js'),
  19: () => import('../chapters/ch19.js'),
  20: () => import('../chapters/ch20.js'),
  21: () => import('../chapters/ch21.js'),
  22: () => import('../chapters/ch22.js'),
  23: () => import('../chapters/ch23.js'),
  24: () => import('../chapters/ch24.js'),
  appA: () => import('../chapters/appendix.js').then((m) => ({ default: m.appendixA })),
  appB: () => import('../chapters/appendix.js').then((m) => ({ default: m.appendixB })),
  appC: () => import('../chapters/appendix.js').then((m) => ({ default: m.appendixC })),
  appD: () => import('../chapters/appendix.js').then((m) => ({ default: m.appendixD })),
};

class AppContentArea extends LitElement {
  createRenderRoot() { return this; }

  constructor() {
    super();
    this._store = new StoreController(this);
    this._loadedChapterId = null;
    this._lastSectionSlug = null;
  }

  updated() {
    const { chapterId, sectionSlug } = this._store.state;
    if (chapterId !== this._loadedChapterId) {
      this._loadedChapterId = chapterId;
      this._loadChapter(chapterId);
    } else if (sectionSlug !== this._lastSectionSlug) {
      this._lastSectionSlug = sectionSlug;
      if (sectionSlug) {
        const el = document.getElementById(sectionSlug);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  render() {
    return html`
      <main id="content-area">
        <div id="content-wrapper">
          <div id="content-body">
            <div class="loading-placeholder">
              <div class="loading-spinner"></div>
              <p>載入中...</p>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  async _loadChapter(chapterId) {
    const loader = CHAPTER_MODULES[chapterId];
    if (!loader) return;

    const contentBody = this.querySelector('#content-body');
    if (!contentBody) return;

    contentBody.innerHTML = `
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    `;

    try {
      const mod = await loader();
      const chapter = mod.default;
      const meta = getChapterById(chapterId);
      const part = getPartForChapter(chapterId);
      const { prev, next } = getPrevNext(chapterId);

      const chapterNum = meta?.isAppendix
        ? meta.title.split('：')[0]
        : `Chapter ${chapterId}`;
      const chapterDisplayTitle = meta?.isAppendix
        ? meta.title.split('：').slice(1).join('：')
        : chapter.title;

      contentBody.innerHTML = `
        <div class="chapter-header">
          <span class="chapter-part-label">${part?.title ?? ''}</span>
          <h1>${chapterNum} — ${chapterDisplayTitle}</h1>
          ${chapter.intro ? `<p class="chapter-intro">${chapter.intro}</p>` : ''}
        </div>
        ${chapter.content}
        ${buildNavFooter(prev, next)}
      `;

      // Add copy buttons
      contentBody.querySelectorAll('pre').forEach(addCopyButton);

      // Prism highlight
      if (window.Prism) {
        if (window.Prism.plugins?.autoloader) {
          window.Prism.plugins.autoloader.languages_path =
            'https://cdn.jsdelivr.net/npm/prismjs@1/components/';
        }
        window.Prism.highlightAllUnder(contentBody);
      }

      // Scroll to section if needed
      const { sectionSlug } = this._store.state;
      this._lastSectionSlug = sectionSlug;
      if (sectionSlug) {
        setTimeout(() => {
          const el = document.getElementById(sectionSlug);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const contentArea = this.querySelector('#content-area');
        if (contentArea) contentArea.scrollTop = 0;
      }

      // Update page title
      document.title = `${chapterDisplayTitle} — 資深前端工程師技術指南`;

    } catch (err) {
      console.error('Failed to load chapter', chapterId, err);
      contentBody.innerHTML = `
        <div class="loading-placeholder">
          <p>章節載入失敗，請重新整理頁面。</p>
        </div>
      `;
    }
  }
}

function buildNavFooter(prev, next) {
  if (!prev && !next) return '';
  const prevBtn = prev
    ? `<a href="#${prev.slug}" class="chapter-nav-btn prev">
        <span class="chapter-nav-label">← 上一章</span>
        <span class="chapter-nav-title">${prev.isAppendix ? prev.title : `Chapter ${prev.id} — ${prev.title}`}</span>
      </a>`
    : '<div></div>';
  const nextBtn = next
    ? `<a href="#${next.slug}" class="chapter-nav-btn next">
        <span class="chapter-nav-label">下一章 →</span>
        <span class="chapter-nav-title">${next.isAppendix ? next.title : `Chapter ${next.id} — ${next.title}`}</span>
      </a>`
    : '<div></div>';
  return `<nav class="chapter-nav-footer">${prevBtn}${nextBtn}</nav>`;
}

function addCopyButton(pre) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = '複製';
  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = '已複製！';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '複製';
        btn.classList.remove('copied');
      }, 2000);
    } catch {
      btn.textContent = '失敗';
      setTimeout(() => { btn.textContent = '複製'; }, 2000);
    }
  });
  pre.style.position = 'relative';
  pre.appendChild(btn);
}

customElements.define('app-content-area', AppContentArea);
