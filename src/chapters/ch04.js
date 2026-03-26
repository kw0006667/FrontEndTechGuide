export default {
  title: 'Web Components 的設計哲學',
  intro: '在投入 API 細節之前，先建立對 Web Components 設計動機的理解。為什麼在已經有 React、Vue、Angular 的情況下，我們仍然需要關注 Web Components？',
  content: `
<section id="web-standards">
  <h2>Web Standards 的角度</h2>
  <p>Web Components 不是另一個 JavaScript 框架，而是一套瀏覽器原生支援的 Web Standards。它的目標是讓開發者能夠建立真正可重用的 HTML 元素，就像 <code>&lt;video&gt;</code>、<code>&lt;input&gt;</code> 這樣的原生元素一樣。</p>

  <blockquote>
    <p>「Web Components 的核心訴求是：如果你建立了一個元件，它應該能在任何地方運作——不管使用者用的是什麼框架，或者根本沒有框架。」</p>
  </blockquote>

  <p>這個目標在今天的前端生態中特別有價值，因為框架的生命週期通常比應用程式短。一個用 Angular 1 寫的元件庫，在 Angular 2 的重大改版後就幾乎無法使用。但一個用 Web Components 標準寫的按鈕元件，十年後仍然可以直接在瀏覽器中運行。</p>
</section>

<section id="four-pillars">
  <h2>四大基礎技術</h2>
  <p>Web Components 由四個相互獨立卻互補的技術規格組成：</p>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Custom Elements</h4>
      <p>讓你定義自己的 HTML 元素，例如 <code>&lt;my-button&gt;</code>。包含完整的生命週期鉤子（connectedCallback、disconnectedCallback 等）。</p>
    </div>
    <div class="comparison-card">
      <h4>Shadow DOM</h4>
      <p>提供 CSS 和 DOM 的封裝，讓元件的內部結構和樣式不受外部影響，也不影響外部。</p>
    </div>
    <div class="comparison-card">
      <h4>HTML Templates</h4>
      <p><code>&lt;template&gt;</code> 和 <code>&lt;slot&gt;</code> 標籤允許你定義可重用的 HTML 片段，直到被明確啟用前不會被渲染。</p>
    </div>
    <div class="comparison-card">
      <h4>ES Modules</h4>
      <p>原生的 JavaScript 模組系統，讓每個 Web Component 可以作為獨立的模組被引入，無需 bundler 也能運作。</p>
    </div>
  </div>

  <h3>四者如何協作</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- 使用 HTML Template 定義結構 --&gt;
&lt;template id="user-card-template"&gt;
  &lt;style&gt;
    :host { display: block; border: 1px solid #ccc; }
    .name { font-weight: bold; }
  &lt;/style&gt;
  &lt;div class="name"&gt;&lt;slot name="name"&gt;&lt;/slot&gt;&lt;/div&gt;
  &lt;div class="bio"&gt;&lt;slot name="bio"&gt;&lt;/slot&gt;&lt;/div&gt;
&lt;/template&gt;

&lt;!-- 使用 Custom Element + Shadow DOM --&gt;
&lt;script type="module"&gt;
  class UserCard extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const template = document.getElementById('user-card-template');
      shadow.appendChild(template.content.cloneNode(true));
    }
  }
  customElements.define('user-card', UserCard);
&lt;/script&gt;

&lt;!-- 在任何地方使用 --&gt;
&lt;user-card&gt;
  &lt;span slot="name"&gt;Alice Chen&lt;/span&gt;
  &lt;span slot="bio"&gt;Senior Frontend Engineer&lt;/span&gt;
&lt;/user-card&gt;</code></pre>
</section>

<section id="advantages-disadvantages">
  <h2>優勢與劣勢的誠實評估</h2>
  <p>Senior Engineer 的思維是用清醒的眼光看待每種技術的取捨，而非盲目追隨。</p>

  <h3>Web Components 的真正優勢</h3>
  <ul>
    <li><strong>跨框架可用</strong>：一次寫成，可在 React、Vue、Angular、純 HTML 中使用</li>
    <li><strong>瀏覽器原生支援</strong>：無需 polyfill（現代瀏覽器全面支援），零 runtime 開銷</li>
    <li><strong>長期穩定性</strong>：Web Standards 的演化非常保守，向後相容性極佳</li>
    <li><strong>真正的封裝</strong>：Shadow DOM 提供 CSS 和 DOM 的真實隔離</li>
    <li><strong>設計系統的理想選擇</strong>：設計系統元件庫需要被跨框架使用</li>
  </ul>

  <h3>Web Components 的真實劣勢</h3>
  <ul>
    <li><strong>缺乏內建狀態管理</strong>：需要自行實作或引入外部解決方案</li>
    <li><strong>SSR 支援仍在演進</strong>：Declarative Shadow DOM 雖已標準化，但生態系支援仍不完整</li>
    <li><strong>開發者體驗</strong>：原生 API 較為冗長，Lit 等框架解決了這個問題</li>
    <li><strong>React 整合摩擦</strong>：React 對 custom events 的支援歷史上有問題（React 19 已改善）</li>
    <li><strong>生態系較小</strong>：相較於 React 生態系，可用的元件庫選擇較少</li>
  </ul>
</section>

<section id="when-to-choose">
  <h2>何時選擇 Web Components</h2>
  <p>Web Components 不是「最好的」技術，而是在特定情境下「最合適的」技術。以下是應該認真考慮使用 Web Components 的場景：</p>

  <div class="callout callout-tip">
    <div class="callout-title">強烈推薦的場景</div>
    <p>建立企業級 Design System，需要被多個使用不同框架的產品團隊消費。Web Components 讓你只維護一份元件程式碼，而非為每個框架維護一份。</p>
  </div>

  <div class="callout callout-info">
    <div class="callout-title">適合的場景</div>
    <p>長期維護的應用（5年以上），框架遷移的成本過高。Web Components 讓你可以逐步遷移，而不必整個重寫。</p>
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">可能不適合的場景</div>
    <p>需要大量 SSR/SEO 優化的內容型網站、需要 React Native 等跨平台能力的專案、或是團隊對 Web Components 完全陌生且 deadline 很緊的情況。</p>
  </div>

  <h3>決策框架</h3>
  <pre data-lang="text"><code>問自己以下問題：

1. 這個元件庫需要被多個框架使用嗎？
   → 是：Web Components 是強烈候選

2. 這個應用的預期生命週期超過 5 年嗎？
   → 是：Web Components 的穩定性值得投資

3. SSR 是否是核心需求？
   → 是：評估 Lit SSR 的成熟度是否符合需求

4. 團隊的 Web Components 知識是否充足？
   → 否：先投資培訓，或選擇 Lit 降低學習曲線</code></pre>
</section>
  `,
};
