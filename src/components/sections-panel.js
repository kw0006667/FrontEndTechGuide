import { LitElement, html } from 'lit';
import { chapters } from '../chapters/index.js';
import { StoreController, setMobilePanelState } from '../state/index.js';

class AppSectionsPanel extends LitElement {
  createRenderRoot() { return this; }

  constructor() {
    super();
    this._store = new StoreController(this);
  }

  render() {
    const { chapterId, sectionSlug } = this._store.state;
    const chapter = chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return html`<nav id="sections-nav"></nav>`;

    return html`
      <nav id="sections-nav">
        ${chapter.sections.map((section) => html`
          <a
            href="#${chapter.slug}-${section.slug}"
            class="panel-section-link ${sectionSlug === section.slug ? 'active' : ''}"
            data-section="${section.slug}"
            @click=${() => setMobilePanelState('closed')}
          >${section.title}</a>
        `)}
      </nav>
    `;
  }
}

customElements.define('app-sections-panel', AppSectionsPanel);
