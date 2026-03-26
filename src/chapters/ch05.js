export default {
  title: 'Shadow DOM 深入解析',
  intro: 'Shadow DOM 是 Web Components 中最強大也最容易被誤解的部分。本章讓你完全掌握 Shadow DOM 的封裝機制、事件行為、以及樣式隔離的各種穿透策略。',
  content: `
<section id="tree-structure">
  <h2>Light DOM、Shadow DOM 與 Composed Tree</h2>
  <p>要理解 Shadow DOM，首先需要理解它與 Light DOM 的關係，以及瀏覽器如何將兩者合成（compose）成最終的渲染樹。</p>

  <h3>三個層次的 DOM</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- Light DOM（頁面的正常 DOM） --&gt;
&lt;my-card&gt;
  &lt;span slot="title"&gt;這是 Light DOM 中的內容&lt;/span&gt;
&lt;/my-card&gt;

&lt;!-- Shadow DOM（my-card 內部的封裝結構） --&gt;
&lt;!-- #shadow-root --&gt;
&lt;!--   &lt;div class="card"&gt; --&gt;
&lt;!--     &lt;slot name="title"&gt;&lt;/slot&gt; --&gt;
&lt;!--   &lt;/div&gt; --&gt;

&lt;!-- Composed Tree（瀏覽器最終渲染的樹） --&gt;
&lt;!-- my-card --&gt;
&lt;!--   └── div.card --&gt;
&lt;!--         └── span（Light DOM 的 span 被投影到 slot 位置） --&gt;</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">重要概念</div>
    <p>Slot 不是「複製」Light DOM 內容到 Shadow DOM——它是一種「投影」（projection）。Light DOM 的節點仍然在原位，只是在渲染時被顯示在 slot 的位置。這對事件處理和 CSS 繼承有重要影響。</p>
  </div>
</section>

<section id="css-encapsulation">
  <h2>CSS 封裝機制</h2>
  <p>Shadow DOM 提供了雙向的 CSS 封裝：外部的 CSS 無法進入 Shadow DOM，Shadow DOM 內部的 CSS 也不會洩漏到外部。</p>

  <h3>:host、:host()、:host-context() 選擇器</h3>
  <pre data-lang="css"><code class="language-css">/* :host — 選取 shadow host 元素本身 */
:host {
  display: block;
  border: 1px solid #ccc;
}

/* :host(.highlighted) — 當 host 有特定 class 時 */
:host(.highlighted) {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

/* :host-context(.dark-mode) — 當 host 的祖先有特定 class 時 */
:host-context(.dark-mode) {
  --bg: #1e1e2e;
  --text: #cdd6f4;
}</code></pre>
</section>

<section id="css-penetration">
  <h2>CSS 穿透策略</h2>
  <p>雖然 Shadow DOM 提供了封裝，但有時我們需要讓外部能夠自訂元件的樣式。以下是三種主要的穿透機制。</p>

  <h3>1. CSS Custom Properties（最推薦）</h3>
  <p>CSS Custom Properties 可以穿越 Shadow Boundary——這是最乾淨的 theming 解決方案：</p>
  <pre data-lang="css"><code class="language-css">/* 元件內部使用 CSS 變數，提供預設值 */
/* Shadow DOM 內的 CSS */
:host {
  --button-bg: var(--my-button-bg, #4A7EAD);
  --button-color: var(--my-button-color, white);
}

button {
  background: var(--button-bg);
  color: var(--button-color);
}

/* 外部使用者可以覆蓋 */
my-button {
  --my-button-bg: #e74c3c;
  --my-button-color: #fff;
}</code></pre>

  <h3>2. ::part() 偽元素</h3>
  <p><code>::part()</code> 讓元件作者可以明確「開放」某些 Shadow DOM 部分供外部樣式覆蓋：</p>
  <pre data-lang="html"><code class="language-html">&lt;!-- 元件內部：標記 exportparts --&gt;
&lt;template&gt;
  &lt;div part="container"&gt;
    &lt;button part="trigger"&gt;Click me&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
  <pre data-lang="css"><code class="language-css">/* 外部可以直接樣式化 part --&gt; */
my-component::part(trigger) {
  background: rebeccapurple;
  border-radius: 8px;
}</code></pre>

  <h3>3. ::slotted() 偽元素</h3>
  <p><code>::slotted()</code> 允許 Shadow DOM 內部樣式化被投影進來的 Light DOM 節點：</p>
  <pre data-lang="css"><code class="language-css">/* 只能選取直接 slotted 子元素 */
::slotted(span) {
  color: var(--color-accent);
  font-weight: 600;
}

::slotted(.icon) {
  width: 20px;
  height: 20px;
}</code></pre>
</section>

<section id="event-behavior">
  <h2>Shadow DOM 中的事件行為</h2>
  <p>事件在 Shadow DOM 中有特殊的行為——「事件重定向」（event retargeting），這是許多開發者感到困惑的地方。</p>

  <h3>Event Retargeting</h3>
  <pre data-lang="javascript"><code class="language-javascript">// Shadow DOM 內部觸發的事件，在 shadow boundary 外部
// 會被重定向：event.target 指向 shadow host，而非實際觸發元素

document.addEventListener('click', (event) => {
  console.log(event.target);
  // 點擊 shadow DOM 內部按鈕時，顯示的是 &lt;my-button&gt;（host）
  // 而非 shadow DOM 內部的 &lt;button&gt;
});

// composedPath() 可以獲取完整的事件路徑
document.addEventListener('click', (event) => {
  const path = event.composedPath();
  // [button, div.wrapper, #shadow-root, my-button, body, html, ...]
  console.log(path[0]); // 實際觸發元素（button）
});</code></pre>

  <h3>composed 屬性</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 自訂事件預設不會穿越 Shadow Boundary（composed: false）
this.dispatchEvent(new CustomEvent('select', {
  detail: { value: this.value },
  bubbles: true,
  composed: false, // 不穿越 shadow boundary（適合內部事件）
}));

// 若需要讓外部能監聽到，設定 composed: true
this.dispatchEvent(new CustomEvent('value-change', {
  detail: { value: this.value },
  bubbles: true,
  composed: true, // 穿越 shadow boundary（適合公開 API 事件）
}));</code></pre>
</section>

<section id="slots-mechanism">
  <h2>Slots 的運作機制</h2>
  <p>Slot 是 Web Components 中實現 content composition 的核心機制，類似 React 的 <code>children</code> 和 <code>render props</code>，但在 DOM 層面實作。</p>

  <h3>Named Slots 與 Default Slots</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- 元件定義 --&gt;
&lt;template&gt;
  &lt;div class="card"&gt;
    &lt;header&gt;
      &lt;slot name="header"&gt;預設標題&lt;/slot&gt; &lt;!-- Named slot --&gt;
    &lt;/header&gt;
    &lt;div class="body"&gt;
      &lt;slot&gt;&lt;/slot&gt; &lt;!-- Default slot --&gt;
    &lt;/div&gt;
    &lt;footer&gt;
      &lt;slot name="footer"&gt;&lt;/slot&gt;
    &lt;/footer&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;!-- 使用方 --&gt;
&lt;my-card&gt;
  &lt;h2 slot="header"&gt;文章標題&lt;/h2&gt;
  &lt;p&gt;這段文字進入 default slot&lt;/p&gt;
  &lt;p&gt;這段也進入 default slot&lt;/p&gt;
  &lt;button slot="footer"&gt;閱讀更多&lt;/button&gt;
&lt;/my-card&gt;</code></pre>

  <h3>slotchange 事件</h3>
  <pre data-lang="javascript"><code class="language-javascript">class MyCard extends LitElement {
  firstUpdated() {
    const slot = this.shadowRoot.querySelector('slot');
    slot?.addEventListener('slotchange', () => {
      const nodes = slot.assignedNodes({ flatten: true });
      console.log('Slotted nodes changed:', nodes.length);
      this._updateAriaLabel();
    });
  }
}</code></pre>
</section>
  `,
};
