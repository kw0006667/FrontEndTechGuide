import { LitElement, html } from 'lit';
import { parts, chapters } from '../chapters/index.js';
import { StoreController, setMobilePanelState } from '../state/index.js';

class AppMobileDrawer extends LitElement {
  createRenderRoot() { return this; }

  constructor() {
    super();
    this._store = new StoreController(this);
  }

  render() {
    const { chapterId } = this._store.state;
    return html`
      <nav id="drawer-nav">
        ${parts.map((part) => this._renderPart(part, chapterId))}
      </nav>
    `;
  }

  _renderPart(part, currentChapterId) {
    const partChapters = chapters.filter((ch) => part.chapters.includes(ch.id));
    return html`
      <div class="drawer-part-label">${part.title}</div>
      ${partChapters.map((ch) => html`
        <a
          href="#${ch.slug}"
          class="drawer-chapter-link ${ch.id === currentChapterId ? 'active' : ''}"
          data-chapter="${ch.id}"
          @click=${() => setMobilePanelState('closed')}
        >
          ${ch.isAppendix ? ch.title : `Ch.${String(ch.id).padStart(2, '0')} — ${ch.title}`}
        </a>
      `)}
    `;
  }
}

customElements.define('app-mobile-drawer', AppMobileDrawer);
