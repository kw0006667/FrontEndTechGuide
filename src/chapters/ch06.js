export default {
  title: 'Lit Framework 實戰指南',
  intro: '理解了 Web Components 的底層機制後，Lit 在原生 API 之上提供了更高效且開發者友善的抽象層。讀完本章，你應該能用 Lit 建構 production-grade 的 UI 元件。',
  content: `
<section id="reactive-properties">
  <h2>Reactive Property 系統</h2>
  <p>Lit 的響應式系統建立在 JavaScript 的 getter/setter 機制上。當響應式屬性的值改變時，Lit 會自動排程元件的重新渲染。</p>

  <h3>@property vs @state</h3>
  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>@property（公開 API）</h4>
      <p>對應到 HTML attribute，可從外部設定。適合用於元件的公開介面。</p>
      <pre><code class="language-javascript">@property({ type: String })
name = '';

@property({ type: Boolean, reflect: true })
disabled = false;</code></pre>
    </div>
    <div class="comparison-card">
      <h4>@state（內部狀態）</h4>
      <p>純內部狀態，不對應到 attribute，不出現在 HTML 中。適合用於元件自身的 UI 狀態。</p>
      <pre><code class="language-javascript">@state()
private _isOpen = false;

@state()
private _items = [];</code></pre>
    </div>
  </div>

  <h3>reflect 選項</h3>
  <p>當 <code>reflect: true</code> 時，property 的值會自動反映為 HTML attribute，這讓 CSS 可以選取到它：</p>
  <pre data-lang="javascript"><code class="language-javascript">@customElement('my-button')
class MyButton extends LitElement {
  @property({ type: Boolean, reflect: true })
  loading = false;
}

// 當 loading = true 時，HTML 變成：
// &lt;my-button loading&gt;&lt;/my-button&gt;

// CSS 可以用 attribute selector：
// my-button[loading] { cursor: wait; opacity: 0.7; }</code></pre>
</section>

<section id="update-lifecycle">
  <h2>Lit 的 Update Lifecycle</h2>
  <p>理解 Lit 的更新生命週期，是能夠正確使用各個生命週期鉤子的基礎。</p>

  <pre data-lang="javascript"><code class="language-javascript">class MyElement extends LitElement {
  // 1. 屬性變更觸發排程更新（microtask）

  // 2. willUpdate(changedProperties)
  // 在渲染前計算 derived state，不觸發額外更新
  willUpdate(changedProperties) {
    if (changedProperties.has('items')) {
      // 計算 derived 值，直接賦給 class 屬性（非響應式）
      this._sortedItems = [...this.items].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // 3. render() — 產生 DOM 描述，Lit 做最小差異更新
  render() {
    return html\`&lt;ul&gt;\${this._sortedItems.map(item =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`)}&lt;/ul&gt;\`;
  }

  // 4. firstUpdated(changedProperties)
  // 只在第一次渲染後執行，用於初始化需要 DOM 的邏輯
  firstUpdated() {
    this.shadowRoot.querySelector('input')?.focus();
    this._initResizeObserver();
  }

  // 5. updated(changedProperties)
  // 每次渲染後執行，用於副作用（例如啟動動畫、觸發外部 API）
  updated(changedProperties) {
    if (changedProperties.has('open') && this.open) {
      this._animateIn();
    }
  }
}</code></pre>

  <h3>updateComplete Promise</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 等待 Lit 完成渲染後再操作 DOM
async function scrollToActive() {
  this.activeIndex = newIndex;
  await this.updateComplete; // 等待渲染完成
  this.shadowRoot.querySelector('.active')?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  });
}</code></pre>
</section>

<section id="template-system">
  <h2>Template System 深入解析</h2>
  <p>Lit 的模板系統建立在 Tagged Template Literals 上。與 Virtual DOM 不同，Lit 在第一次渲染時「解析」模板結構，之後的更新只更新發生變化的「綁定點」。</p>

  <h3>五種 Binding 類型</h3>
  <pre data-lang="javascript"><code class="language-javascript">html\`
  &lt;!-- 1. Text binding --&gt;
  &lt;span&gt;\${this.name}&lt;/span&gt;

  &lt;!-- 2. Attribute binding --&gt;
  &lt;input placeholder=\${this.hint} /&gt;

  &lt;!-- 3. Boolean attribute binding --&gt;
  &lt;button ?disabled=\${this.loading}&gt;送出&lt;/button&gt;

  &lt;!-- 4. Property binding --&gt;
  &lt;my-list .items=\${this.data}&gt;&lt;/my-list&gt;

  &lt;!-- 5. Event binding --&gt;
  &lt;button @click=\${this._handleClick}&gt;點我&lt;/button&gt;
\`</code></pre>

  <h3>條件渲染的模式</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 方法 1：三元運算子（適合簡單切換）
html\`\${this.show ? html\`&lt;span&gt;可見&lt;/span&gt;\` : nothing}\`

// 方法 2：&amp;&amp; 短路（注意：0 會被渲染）
html\`\${this.items.length > 0 &amp;&amp; html\`&lt;ul&gt;...&lt;/ul&gt;\`}\`

// 方法 3：choose / when directive（更語意化）
import { choose } from 'lit/directives/choose.js';
html\`\${choose(this.status, [
  ['loading', () =&gt; html\`&lt;spinner&gt;&lt;/spinner&gt;\`],
  ['error', () =&gt; html\`&lt;error-msg&gt;&lt;/error-msg&gt;\`],
  ['success', () =&gt; html\`&lt;data-view .data=\${this.data}&gt;&lt;/data-view&gt;\`],
])}\`</code></pre>
</section>

<section id="directives">
  <h2>常用 Directives</h2>
  <p>Directives 是 Lit 模板系統的擴展機制，讓你可以建立複雜的模板行為。</p>

  <h3>repeat directive — 高效列表渲染</h3>
  <pre data-lang="javascript"><code class="language-javascript">import { repeat } from 'lit/directives/repeat.js';

// 提供唯一 key，讓 Lit 在列表重排時重用 DOM
html\`
  &lt;ul&gt;
    \${repeat(
      this.items,
      (item) =&gt; item.id,          // key function
      (item) =&gt; html\`&lt;li&gt;\${item.name}&lt;/li&gt;\`  // template
    )}
  &lt;/ul&gt;
\`</code></pre>

  <h3>cache directive — 保留隱藏元素的 DOM</h3>
  <pre data-lang="javascript"><code class="language-javascript">import { cache } from 'lit/directives/cache.js';

// 切換時保留 DOM（含狀態），適合 tab 切換
html\`
  \${cache(
    this.activeTab === 'a'
      ? html\`&lt;tab-a&gt;&lt;/tab-a&gt;\`
      : html\`&lt;tab-b&gt;&lt;/tab-b&gt;\`
  )}
\`</code></pre>

  <h3>classMap 與 styleMap</h3>
  <pre data-lang="javascript"><code class="language-javascript">import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

html\`
  &lt;div
    class=\${classMap({
      'btn': true,
      'btn--primary': this.variant === 'primary',
      'btn--loading': this.loading,
      'btn--disabled': this.disabled,
    })}
    style=\${styleMap({
      '--progress': \`\${this.progress}%\`,
      'animation-duration': this.fast ? '200ms' : '500ms',
    })}
  &gt;
    \${this.label}
  &lt;/div&gt;
\`</code></pre>
</section>

<section id="reactive-controllers">
  <h2>Reactive Controllers</h2>
  <p>Reactive Controller 是 Lit 的邏輯重用機制，類似 React Hooks——讓你可以將複雜的邏輯封裝成可重用的單元，在多個元件中共用。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 建立可重用的 Mouse Position Controller
class MouseController {
  host;
  pos = { x: 0, y: 0 };

  constructor(host) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('mousemove', this._onMouseMove);
  }

  hostDisconnected() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  _onMouseMove = ({ clientX: x, clientY: y }) =&gt; {
    this.pos = { x, y };
    this.host.requestUpdate(); // 通知 host 重新渲染
  };
}

// 在任何 Lit 元件中重用
class MyTracker extends LitElement {
  _mouse = new MouseController(this);

  render() {
    return html\`
      &lt;p&gt;Mouse: \${this._mouse.pos.x}, \${this._mouse.pos.y}&lt;/p&gt;
    \`;
  }
}</code></pre>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Reactive Controller vs React Hook</h4>
      <p>概念相似，但 Controller 是 class-based，更易於測試和生命週期管理。Controller 可以保持自己的狀態，並在 host 的生命週期中自動 setup/teardown。</p>
    </div>
    <div class="comparison-card">
      <h4>常見的 Controller 使用場景</h4>
      <ul>
        <li>ResizeObserver 監聽</li>
        <li>IntersectionObserver</li>
        <li>滑鼠/鍵盤事件處理</li>
        <li>非同步資料載入（Task）</li>
        <li>表單驗證邏輯</li>
      </ul>
    </div>
  </div>
</section>
  `,
};
