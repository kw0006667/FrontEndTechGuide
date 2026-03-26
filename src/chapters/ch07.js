export default {
  title: 'Web Component 的 API 設計原則',
  intro: 'Senior Engineer 不只是寫能動的程式碼，更重要的是設計出好用、好維護、好擴充的 API。本章聚焦在如何設計一個 Web Component 的公開介面，讓使用者能直覺地使用。',
  content: `
<section id="property-attribute-design">
  <h2>Property 與 Attribute 設計</h2>
  <p>決定什麼應該是 property，什麼應該反映為 attribute，是 Web Component API 設計中最基礎也最重要的決策。</p>

  <h3>設計原則</h3>
  <ul>
    <li><strong>使用 attribute</strong>：簡單的純量值（string、number、boolean），可以在 HTML 中直接設定的值</li>
    <li><strong>只用 property</strong>：複雜物件、陣列、函式、DOM 節點——這些無法用 attribute 表達</li>
    <li><strong>reflect 到 attribute</strong>：當你需要 CSS 能夠選取到這個狀態時（例如 <code>disabled</code>、<code>loading</code>）</li>
  </ul>

  <pre data-lang="javascript"><code class="language-javascript">class DataTable extends LitElement {
  // ✅ 適合用 attribute：簡單的設定值
  @property({ type: Number })
  pageSize = 10;

  @property({ type: String })
  sortField = '';

  @property({ type: Boolean, reflect: true })
  loading = false;

  // ✅ 只用 property：複雜資料不適合 attribute
  @property({ attribute: false })
  data = [];

  // ✅ 只用 property：函式
  @property({ attribute: false })
  rowRenderer = null;
}</code></pre>
</section>

<section id="event-design">
  <h2>Event 設計慣例</h2>
  <p>良好的 Event 設計讓使用者能夠直覺地監聽元件狀態的變化，並且與原生 DOM 事件的使用方式一致。</p>

  <h3>命名慣例</h3>
  <ul>
    <li>使用小寫連字號（kebab-case）：<code>value-change</code>、<code>item-select</code></li>
    <li>動詞時態：用現在式（<code>select</code>）而非過去式（<code>selected</code>），與原生事件一致</li>
    <li>提供命名空間避免衝突：<code>my-component-select</code> 或用 <code>detail</code> 攜帶識別資訊</li>
  </ul>

  <h3>Event 結構設計</h3>
  <pre data-lang="javascript"><code class="language-javascript">class SelectMenu extends LitElement {
  _selectItem(item) {
    // ✅ 使用 CustomEvent，在 detail 中攜帶資料
    this.dispatchEvent(new CustomEvent('select', {
      detail: {
        value: item.value,
        label: item.label,
        item,           // 完整物件，讓使用者有彈性
      },
      bubbles: true,
      composed: true,  // 穿越 Shadow boundary
    }));

    // ✅ 對應更新 property
    this.value = item.value;
  }
}

// 使用方：
document.querySelector('select-menu').addEventListener('select', (e) => {
  console.log(e.detail.value);  // 型別安全的存取
});</code></pre>

  <h3>可取消的事件（Cancelable Events）</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 讓使用者能夠阻止預設行為
_handleClose() {
  const event = new CustomEvent('close', {
    cancelable: true,
    bubbles: true,
    composed: true,
  });

  const cancelled = !this.dispatchEvent(event);
  if (!cancelled) {
    this.open = false; // 只有在未被取消時才關閉
  }
}

// 使用方可以阻止關閉：
dialog.addEventListener('close', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault(); // 阻止關閉
    showConfirmDialog();
  }
});</code></pre>
</section>

<section id="slot-design">
  <h2>Slot 設計策略</h2>
  <p>Slot 是 Web Component 中提供 content composition 能力的關鍵機制。好的 slot 設計讓元件既有預設行為，又有足夠的彈性。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 設計一個靈活的 Card 元件
class AppCard extends LitElement {
  static styles = css\`
    ::slotted([slot="header"]) {
      font-weight: 700;
      font-size: 1.1rem;
    }
    ::slotted([slot="actions"]) {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  \`;

  render() {
    return html\`
      &lt;div class="card"&gt;
        &lt;!-- 有預設內容的 slot --&gt;
        &lt;header&gt;
          &lt;slot name="header"&gt;
            &lt;span&gt;預設標題&lt;/span&gt;
          &lt;/slot&gt;
        &lt;/header&gt;

        &lt;!-- Default slot：接收主要內容 --&gt;
        &lt;main&gt;
          &lt;slot&gt;&lt;/slot&gt;
        &lt;/main&gt;

        &lt;!-- 條件顯示 footer --&gt;
        &lt;footer ?hidden=\${!this._hasFooterSlot}&gt;
          &lt;slot name="actions" @slotchange=\${this._checkSlots}&gt;&lt;/slot&gt;
        &lt;/footer&gt;
      &lt;/div&gt;
    \`;
  }

  _checkSlots() {
    const footerSlot = this.shadowRoot.querySelector('[name="actions"]');
    this._hasFooterSlot = footerSlot?.assignedNodes().length &gt; 0;
  }
}</code></pre>
</section>

<section id="theming-api">
  <h2>CSS Custom Properties 作為 Theming API</h2>
  <p>設計一套清晰的 CSS Custom Properties API，讓使用者可以自訂元件的外觀，而不需要破解 Shadow DOM。</p>

  <pre data-lang="css"><code class="language-css">/* 在元件的 Shadow DOM 中定義所有可自訂的屬性 */
:host {
  /* 對外公開的 API（文件化這些屬性） */
  --button-bg: #4A7EAD;
  --button-color: white;
  --button-border-radius: 6px;
  --button-padding: 8px 16px;
  --button-font-size: 0.9rem;

  /* hover 狀態 */
  --button-hover-bg: #3A6A96;

  /* loading 狀態 */
  --button-loading-opacity: 0.7;
}

/* 使用這些變數 */
button {
  background: var(--button-bg);
  color: var(--button-color);
  border-radius: var(--button-border-radius);
  padding: var(--button-padding);
  font-size: var(--button-font-size);
}

button:hover {
  background: var(--button-hover-bg);
}</code></pre>
</section>

<section id="form-associated">
  <h2>Form-associated Custom Elements</h2>
  <p>使用 <code>ElementInternals</code> API，Web Component 可以像原生表單元素（<code>&lt;input&gt;</code>、<code>&lt;select&gt;</code>）一樣參與表單的 validation 和 submission。</p>

  <pre data-lang="javascript"><code class="language-javascript">class PhoneInput extends LitElement {
  static formAssociated = true;  // 宣告為 form-associated

  #internals;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  _onInput(e) {
    this.value = e.target.value;
    // 更新 form value
    this.#internals.setFormValue(this.value);
    // 自訂驗證邏輯
    this._validate();
  }

  _validate() {
    const isValid = /^\\+?[0-9]{8,15}$/.test(this.value);
    if (!isValid && this.required) {
      this.#internals.setValidity(
        { valueMissing: this.value === '', patternMismatch: true },
        '請輸入有效的電話號碼',
        this.shadowRoot.querySelector('input')
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  // 表單 reset 時呼叫
  formResetCallback() {
    this.value = '';
    this.#internals.setFormValue('');
  }
}</code></pre>
</section>

<section id="custom-elements-manifest">
  <h2>Custom Elements Manifest</h2>
  <p>Custom Elements Manifest（CEM）是一個 JSON schema，描述 Web Component 的公開 API——屬性、事件、slot、CSS 變數等。它讓 IDE 能提供自動完成，並能自動生成文件。</p>

  <pre data-lang="json"><code class="language-json">{
  "schemaVersion": "1.0.0",
  "modules": [{
    "kind": "javascript-module",
    "path": "src/components/my-button.js",
    "declarations": [{
      "kind": "class",
      "name": "MyButton",
      "tagName": "my-button",
      "attributes": [
        { "name": "disabled", "type": { "text": "boolean" } },
        { "name": "loading", "type": { "text": "boolean" } }
      ],
      "events": [
        { "name": "click", "type": { "text": "MouseEvent" } }
      ],
      "slots": [
        { "name": "", "description": "按鈕文字內容" },
        { "name": "icon", "description": "按鈕圖示" }
      ],
      "cssProperties": [
        { "name": "--button-bg", "description": "按鈕背景色", "default": "#4A7EAD" }
      ]
    }]
  }]
}</code></pre>
</section>
  `,
};
