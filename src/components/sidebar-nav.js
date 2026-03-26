import { LitElement, html } from 'lit';
import { parts, chapters } from '../chapters/index.js';
import { appState, StoreController } from '../state/index.js';

class AppSidebar extends LitElement {
  // Use Light DOM so global CSS applies
  createRenderRoot() { return this; }

  constructor() {
    super();
    this._store = new StoreController(this);
  }

  render() {
    const { chapterId, sectionSlug } = this._store.state;
    return html`
      <nav id="sidebar-nav">
        ${parts.map((part) => this._renderPart(part, chapterId, sectionSlug))}
      </nav>
    `;
  }

  _renderPart(part, currentChapterId, currentSection) {
    const partChapters = chapters.filter((ch) => part.chapters.includes(ch.id));
    return html`
      <div class="nav-part-label">${part.title}</div>
      <ul>
        ${partChapters.map((ch) => this._renderChapter(ch, currentChapterId, currentSection))}
      </ul>
    `;
  }

  _renderChapter(chapter, currentChapterId, currentSection) {
    const isActive = chapter.id === currentChapterId;
    const isOpen = isActive;
    const prefix = chapter.isAppendix
      ? chapter.title.split('：')[0]
      : `Ch.${String(chapter.id).padStart(2, '0')}`;
    const displayTitle = chapter.isAppendix
      ? chapter.title.split('：').slice(1).join('：')
      : chapter.title;

    return html`
      <li
        class="nav-chapter ${isActive ? 'nav-chapter--active' : ''} ${isOpen ? 'is-open' : ''}"
        data-chapter-id="${chapter.id}"
      >
        <button
          class="nav-chapter-trigger"
          aria-expanded="${isOpen}"
          @click=${(e) => this._toggleChapter(e, chapter.id)}
        >
          <span class="nav-chapter-arrow">▶</span>
          <span class="nav-chapter-title">
            <span style="color: var(--color-text-muted); font-size: 0.75em; display: block; margin-bottom: 1px;">${prefix}</span>
            ${displayTitle}
          </span>
        </button>
        <ul class="nav-sections">
          ${chapter.sections.map((section) => html`
            <li>
              <a
                href="#${chapter.slug}-${section.slug}"
                class="nav-section-link ${isActive && currentSection === section.slug ? 'active' : ''}"
                data-chapter="${chapter.id}"
                data-section="${section.slug}"
              >${section.title}</a>
            </li>
          `)}
        </ul>
      </li>
    `;
  }

  _toggleChapter(e, chapterId) {
    e.stopPropagation();
    const li = e.currentTarget.closest('.nav-chapter');
    if (!li) return;
    const isOpen = li.classList.contains('is-open');
    // Close all
    this.querySelectorAll('.nav-chapter').forEach((el) => el.classList.remove('is-open'));
    // Toggle current
    if (!isOpen) li.classList.add('is-open');
  }
}

customElements.define('app-sidebar', AppSidebar);
