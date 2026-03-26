export default {
  title: '微前端架構',
  intro: '當單一前端應用變得過於龐大，微前端提供了一種將它拆分給多個團隊獨立開發、部署的架構模式。Web Components 是微前端整合的天然選擇。',
  content: `
<section id="microfrontend-patterns">
  <h2>微前端整合模式</h2>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Build-time Integration</h4>
      <p>在構建時合併所有子應用的 bundle。簡單，但失去獨立部署能力。</p>
      <p><strong>適合：</strong>小型團隊，初期架構</p>
    </div>
    <div class="comparison-card">
      <h4>Run-time Integration via Script</h4>
      <p>Host app 在運行時動態載入各子應用的 JS bundle。</p>
      <p><strong>適合：</strong>需要獨立部署，技術棧統一</p>
    </div>
    <div class="comparison-card">
      <h4>Module Federation</h4>
      <p>Webpack 5 功能，允許應用在運行時共享模組，避免重複的供應商 bundle。</p>
      <p><strong>適合：</strong>大型組織，多個 React/Vue 應用</p>
    </div>
    <div class="comparison-card">
      <h4>Web Components</h4>
      <p>每個微前端暴露為 Custom Element，框架無關，瀏覽器原生支援。</p>
      <p><strong>適合：</strong>混合技術棧，漸進式遷移</p>
    </div>
  </div>
</section>

<section id="web-component-integration">
  <h2>Web Components 作為整合邊界</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 微前端 A（React 開發，暴露為 Web Component）
import React from 'react';
import ReactDOM from 'react-dom/client';
import { UserProfile } from './UserProfile.jsx';

class UserProfileMfe extends HTMLElement {
  #root;
  #reactRoot;

  static get observedAttributes() { return ['user-id', 'locale']; }

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.innerHTML = '&lt;div id="root"&gt;&lt;/div&gt;';
    this.#reactRoot = ReactDOM.createRoot(this.#root.querySelector('#root'));
    this._render();
  }

  disconnectedCallback() {
    this.#reactRoot?.unmount();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    if (!this.#reactRoot) return;
    this.#reactRoot.render(
      React.createElement(UserProfile, {
        userId: this.getAttribute('user-id'),
        locale: this.getAttribute('locale') ?? 'zh-TW',
        onUpdate: (data) => {
          // 向 Host 傳遞事件
          this.dispatchEvent(new CustomEvent('user-updated', { detail: data, bubbles: true }));
        },
      })
    );
  }
}

customElements.define('user-profile-mfe', UserProfileMfe);

// 微前端 B（Vue 開發，暴露為 Web Component）
import { defineCustomElement } from 'vue';
import OrderHistory from './OrderHistory.vue';

customElements.define('order-history-mfe', defineCustomElement(OrderHistory));

// Host App：組合來自不同框架的微前端
// &lt;user-profile-mfe user-id="123" locale="zh-TW"&gt;&lt;/user-profile-mfe&gt;
// &lt;order-history-mfe user-id="123"&gt;&lt;/order-history-mfe&gt;</code></pre>
</section>

<section id="mfe-communication">
  <h2>微前端間的通訊策略</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 方法一：Custom Events 冒泡（適合父子關係）
// 子 MFE 向上傳遞事件
cartItemMfe.dispatchEvent(new CustomEvent('item-added', {
  detail: { productId: '123', quantity: 1 },
  bubbles: true,    // 冒泡到 host
  composed: true,   // 穿越 Shadow DOM 邊界
}));

// Host 監聽
document.addEventListener('item-added', ({ detail }) => {
  cartService.add(detail);
});

// 方法二：Shared EventBus（適合兄弟 MFE）
// 掛載在全域 window 上，所有 MFE 都能使用
window.__mfe_eventbus__ ??= new EventTarget();

const bus = window.__mfe_eventbus__;

// MFE A：發布
bus.dispatchEvent(new CustomEvent('auth:login', { detail: { userId: '123' } }));

// MFE B：訂閱
bus.addEventListener('auth:login', ({ detail }) => {
  this._loadUserData(detail.userId);
});

// 方法三：Shared State（適合需要共享複雜狀態）
// 全域 Store，所有 MFE 都能讀寫
window.__mfe_store__ ??= createSharedStore({
  user: null,
  locale: 'zh-TW',
  theme: 'light',
});

const store = window.__mfe_store__;

// 任何 MFE 都可以訂閱
store.subscribe('user', (newUser) => {
  this._user = newUser;
  this.render();
});</code></pre>
</section>

<section id="mfe-isolation">
  <h2>樣式隔離策略</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 方法一：Shadow DOM（最強隔離）
// 子應用在 Shadow DOM 中運行，樣式完全隔離
class IsolatedMfe extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    // 注入子應用的樣式（不會洩漏到外部）
    shadow.innerHTML = \`
      &lt;style&gt;
        /* 這些樣式只影響此 Shadow root 內的元素 */
        .button { background: red; }
      &lt;/style&gt;
      &lt;div class="app-root"&gt;&lt;/div&gt;
    \`;
  }
}

// 方法二：CSS Modules / Scoped CSS（構建時處理）
// 每個類別名會加上唯一 hash：.button → .button_a1b2c3

// 方法三：CSS Custom Properties 傳入主題
// Host 通過 CSS 變數傳入主題，子 MFE 只使用這些變數
// :host-context([data-theme="dark"]) 讓子 MFE 感知主題
html {
  --mfe-color-primary: #4A7EAD;
  --mfe-font-family: 'Inter', sans-serif;
}

// 子 MFE 消費這些變數
.mfe-button {
  background: var(--mfe-color-primary, #4A7EAD);
  font-family: var(--mfe-font-family, system-ui);
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">微前端的真實成本</div>
    <p>微前端解決了組織問題（多個團隊獨立部署），但會帶來技術複雜度。在採用前，確認你面對的是組織規模問題，而非技術問題。10 人以下的團隊通常不需要微前端。</p>
  </div>
</section>
  `,
};
