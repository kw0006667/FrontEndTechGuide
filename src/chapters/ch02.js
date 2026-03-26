export default {
  title: 'JavaScript Runtime 的運作機制',
  intro: 'Senior Engineer 需要能解釋「為什麼畫面卡住了」或「為什麼這個 callback 的執行順序不如預期」。這些問題的根源都在 runtime 機制。',
  content: `
<section id="event-loop">
  <h2>Event Loop 完整模型</h2>
  <p>JavaScript 是單執行緒（single-threaded）語言，但它可以透過 Event Loop 機制處理非同步操作，讓程式不會因為等待 I/O 而卡住。</p>

  <p>Event Loop 的基本運作流程：</p>
  <ol>
    <li>執行 Call Stack 中的所有同步程式碼</li>
    <li>Call Stack 清空後，處理所有 Microtask Queue 中的任務</li>
    <li>Microtask Queue 清空後，從 Macrotask Queue 取出一個任務執行</li>
    <li>回到步驟 2，持續循環</li>
  </ol>

  <pre data-lang="javascript"><code class="language-javascript">console.log('1');  // 同步

setTimeout(() => console.log('2'), 0);  // Macrotask

Promise.resolve().then(() => console.log('3'));  // Microtask

queueMicrotask(() => console.log('4'));  // Microtask

console.log('5');  // 同步

// 輸出順序：1, 5, 3, 4, 2</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">常見誤解</div>
    <p><code>setTimeout(fn, 0)</code> 並不意味著「立即執行」，而是「盡快執行，但先讓所有 microtask 跑完」。這個誤解是許多難以追蹤 bug 的根源。</p>
  </div>
</section>

<section id="macrotask-microtask">
  <h2>Macrotask 與 Microtask 排程</h2>
  <p>理解哪些 API 產生 macrotask，哪些產生 microtask，對於撰寫可預期的非同步程式碼至關重要。</p>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Microtask（優先執行）</h4>
      <ul>
        <li><code>Promise.then/catch/finally</code></li>
        <li><code>queueMicrotask()</code></li>
        <li><code>MutationObserver</code> callbacks</li>
        <li><code>async/await</code>（await 後的程式碼）</li>
      </ul>
    </div>
    <div class="comparison-card">
      <h4>Macrotask（等 microtask 跑完）</h4>
      <ul>
        <li><code>setTimeout / setInterval</code></li>
        <li><code>requestAnimationFrame</code></li>
        <li>I/O callbacks（fetch、file）</li>
        <li>DOM event callbacks（click、keydown）</li>
      </ul>
    </div>
  </div>

  <h3>Lit Framework 的更新機制與 Microtask</h3>
  <p>Lit 使用 microtask 來批量處理屬性更新，這是它高效能的關鍵：</p>
  <pre data-lang="javascript"><code class="language-javascript">// 即使連續設定多個屬性，Lit 只會渲染一次
element.name = 'Alice';
element.age = 30;
element.email = 'alice@example.com';

// Lit 將更新排入 microtask queue
// 在下一個 microtask 時統一批量渲染 → 只有一次 DOM 更新</code></pre>
</section>

<section id="closure-memory">
  <h2>Closure 的記憶體模型</h2>
  <p>Closure 捕獲的是變數的 <strong>reference</strong>，而非 value。這個細節是許多記憶體問題和迴圈陷阱的根源。</p>

  <h3>經典的迴圈陷阱</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ 常見錯誤：所有 callback 都捕獲同一個 i
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 輸出：5, 5, 5, 5, 5

// ✅ 方法一：使用 let（每次迭代有獨立的 i）
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 輸出：0, 1, 2, 3, 4

// ✅ 方法二：使用 IIFE 建立獨立的 scope
for (var i = 0; i < 5; i++) {
  ((j) => setTimeout(() => console.log(j), 100))(i);
}</code></pre>

  <h3>Event Listener 的記憶體洩漏</h3>
  <p>Closure 持有的 reference 會阻止垃圾回收。在 Web Components 中，這是一個常見問題：</p>
  <pre data-lang="javascript"><code class="language-javascript">class MyComponent extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // ❌ 匿名函式無法被移除
    window.addEventListener('resize', () => this._handleResize());

    // ✅ 保存 reference 才能正確移除
    this._resizeHandler = this._handleResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // ✅ 正確清除，防止記憶體洩漏
    window.removeEventListener('resize', this._resizeHandler);
  }
}</code></pre>
</section>

<section id="prototype-this">
  <h2>Prototype Chain 與 this 綁定</h2>
  <p>JavaScript 的 <code>this</code> 是動態綁定的，它的值取決於函式的<strong>呼叫方式</strong>，而非定義位置。</p>

  <h3>四種 this 綁定規則</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 1. 預設綁定（非嚴格模式：global；嚴格模式：undefined）
function greet() { console.log(this); }
greet(); // window / undefined

// 2. 隱式綁定（物件方法呼叫）
const obj = { name: 'Alice', greet() { console.log(this.name); } };
obj.greet(); // 'Alice'

// 3. 顯式綁定（call / apply / bind）
greet.call({ name: 'Bob' }); // 'Bob'

// 4. new 綁定（建構函式）
function Person(name) { this.name = name; }
const alice = new Person('Alice'); // this 指向新建立的物件</code></pre>

  <h3>Arrow Function 的 this</h3>
  <p>Arrow function 沒有自己的 <code>this</code>，它繼承外層 lexical scope 的 <code>this</code>：</p>
  <pre data-lang="javascript"><code class="language-javascript">class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // ❌ 傳統函式：this 會是 undefined（嚴格模式）或 window
    setInterval(function() { this.seconds++; }, 1000);

    // ✅ Arrow function：繼承 start() 方法的 this（Timer 實例）
    setInterval(() => { this.seconds++; }, 1000);
  }
}</code></pre>
</section>

<section id="class-based-wc">
  <h2>Web Components 中的 this 行為</h2>
  <p>在 class-based 的 Web Components 架構中，理解 <code>this</code> 的行為格外重要，因為元件的生命週期方法都依賴正確的 <code>this</code> 綁定。</p>

  <pre data-lang="javascript"><code class="language-javascript">class MyElement extends HTMLElement {
  connectedCallback() {
    // this 指向元素實例 ✅
    this.addEventListener('click', this._handleClick);

    // 注意：若使用 class field syntax，自動綁定 this
    this.addEventListener('keydown', this._handleKeydown);
  }

  // Class field syntax：自動綁定 this
  _handleKeydown = (event) => {
    console.log(this); // 永遠是 MyElement 實例 ✅
  };

  // 普通方法：this 依賴呼叫方式
  _handleClick(event) {
    console.log(this); // 可能是 element，也可能是 undefined
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">最佳實踐</div>
    <p>在 Web Components 中，建議使用 class field syntax（<code>method = () => {}</code>）定義事件處理器，這樣不需要手動 <code>.bind(this)</code>，而且可以直接用 <code>removeEventListener</code> 移除。</p>
  </div>
</section>
  `,
};
