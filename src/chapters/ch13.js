export default {
  title: 'JavaScript 執行效能與記憶體管理',
  intro: 'JavaScript 是 single-threaded 的，長時間執行的計算會阻塞 UI 更新。本章介紹如何將繁重的計算分散或移出 main thread，以及如何避免 SPA 中常見的記憶體洩漏。',
  content: `
<section id="web-workers">
  <h2>Web Workers 使用模式</h2>
  <p>Web Workers 讓你可以在背景執行緒中執行計算密集型任務，不阻塞 UI。</p>

  <h3>基本 Worker 通訊</h3>
  <pre data-lang="javascript"><code class="language-javascript">// worker.js
self.addEventListener('message', ({ data }) => {
  const { type, payload } = data;
  if (type === 'PROCESS') {
    const result = heavyComputation(payload);
    self.postMessage({ type: 'RESULT', payload: result });
  }
});

function heavyComputation(data) {
  // 耗時計算...
  return data.map(item => expensiveTransform(item));
}

// main.js — 型別安全的 Worker 封裝
class DataProcessor {
  #worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  #pending = new Map();
  #nextId = 0;

  process(data) {
    return new Promise((resolve, reject) => {
      const id = this.#nextId++;
      this.#pending.set(id, { resolve, reject });

      this.#worker.postMessage({ id, type: 'PROCESS', payload: data });
    });
  }

  constructor() {
    this.#worker.addEventListener('message', ({ data }) => {
      const { id, type, payload, error } = data;
      const pending = this.#pending.get(id);
      if (!pending) return;
      this.#pending.delete(id);

      if (type === 'ERROR') {
        pending.reject(new Error(error));
      } else {
        pending.resolve(payload);
      }
    });
  }

  terminate() {
    this.#worker.terminate();
    this.#pending.forEach(({ reject }) => reject(new Error('Worker terminated')));
    this.#pending.clear();
  }
}</code></pre>
</section>

<section id="task-scheduling">
  <h2>Task Scheduling 與 scheduler.yield()</h2>
  <p>有時計算必須在 main thread 上執行，但又不想讓它長時間佔用。透過 Task Scheduling，你可以將大任務拆分，在每個 chunk 之間讓出 main thread。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 使用 scheduler.yield() 讓出 main thread（現代瀏覽器）
async function processLargeList(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(processItem(items[i]));

    // 每處理 50 個讓出一次 main thread
    if (i % 50 === 0) {
      await scheduler.yield(); // 讓瀏覽器有機會處理使用者互動
    }
  }
  return results;
}

// 舊瀏覽器的 fallback：使用 setTimeout(0)
async function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// 使用 isInputPending API 更智慧地讓出
async function smartProcess(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(processItem(items[i]));

    // 只有在有待處理的使用者輸入時才讓出
    if (navigator.scheduling?.isInputPending()) {
      await yieldToMain();
    }
  }
  return results;
}</code></pre>
</section>

<section id="memory-leaks">
  <h2>記憶體洩漏的常見來源</h2>
  <p>SPA 中的記憶體洩漏通常是由長時間存活的物件持有對已銷毀元件的 reference 所造成的。</p>

  <h3>1. 未移除的 Event Listeners</h3>
  <pre data-lang="javascript"><code class="language-javascript">class MemoryLeakExample extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // ❌ 洩漏：window 持有對 this 的 reference，即使元件銷毀也不會 GC
    window.addEventListener('resize', () => {
      this._updateLayout(); // this 被 closure 捕獲
    });

    // ✅ 正確：保存 reference，在 disconnectedCallback 移除
    this._onResize = () => this._updateLayout();
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._onResize);
  }
}</code></pre>

  <h3>2. 未取消的 Timer 和 Observer</h3>
  <pre data-lang="javascript"><code class="language-javascript">class IntervalComponent extends LitElement {
  _timers = new Set();
  _observers = new Set();

  connectedCallback() {
    super.connectedCallback();
    // 用 Set 追蹤所有資源
    const id = setInterval(() => this._tick(), 1000);
    this._timers.add(id);

    const observer = new IntersectionObserver(this._onIntersect);
    observer.observe(this);
    this._observers.add(observer);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 統一清理
    this._timers.forEach(id => clearInterval(id));
    this._timers.clear();
    this._observers.forEach(o => o.disconnect());
    this._observers.clear();
  }
}</code></pre>

  <h3>3. Detached DOM Nodes</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ 洩漏：detached node 被 global cache 持有
const cache = new Map();

function renderAndCache(id, data) {
  const el = document.createElement('div');
  el.innerHTML = data;
  // 即使 el 從 DOM 中移除，cache 仍然持有它
  cache.set(id, el);
}

// ✅ 使用 WeakRef 讓 GC 可以回收
const cache = new Map();

function renderAndCache(id, data) {
  const el = document.createElement('div');
  el.innerHTML = data;
  cache.set(id, new WeakRef(el));
  return el;
}

function getCached(id) {
  return cache.get(id)?.deref(); // 如果已被 GC，返回 undefined
}</code></pre>
</section>

<section id="weakref-finalization">
  <h2>WeakRef 與 FinalizationRegistry</h2>
  <pre data-lang="javascript"><code class="language-javascript">// WeakRef：不阻止 GC 的弱引用
class ComponentCache {
  #cache = new Map();
  #registry = new FinalizationRegistry((key) => {
    // 當 cached component 被 GC 時，自動從 Map 中移除
    this.#cache.delete(key);
    console.log(\`Cache entry for '\${key}' was GC'd\`);
  });

  set(key, component) {
    const ref = new WeakRef(component);
    this.#cache.set(key, ref);
    this.#registry.register(component, key, ref); // 第三個參數是 unregister token
    return component;
  }

  get(key) {
    return this.#cache.get(key)?.deref();
  }

  delete(key) {
    const ref = this.#cache.get(key);
    if (ref) {
      this.#registry.unregister(ref); // 取消 GC 回調（使用 token）
      this.#cache.delete(key);
    }
  }
}</code></pre>
</section>

<section id="abort-controller-cleanup">
  <h2>AbortController 資源清理策略</h2>
  <p>使用一個統一的 AbortController 管理元件內所有需要清理的資源，讓 disconnectedCallback 只需要一行程式碼。</p>

  <pre data-lang="javascript"><code class="language-javascript">class CleanResourceComponent extends LitElement {
  #controller = new AbortController();

  connectedCallback() {
    super.connectedCallback();
    const { signal } = this.#controller;

    // 所有 event listener 都接受 signal
    window.addEventListener('resize', this._onResize, { signal });
    document.addEventListener('keydown', this._onKeydown, { signal });

    // fetch 請求也使用相同的 signal
    fetch('/api/data', { signal })
      .then(r => r.json())
      .then(data => { this.data = data; })
      .catch(e => { if (e.name !== 'AbortError') console.error(e); });

    // Observer 可以用 signal 監聽 abort 事件
    const observer = new IntersectionObserver(this._onIntersect);
    observer.observe(this);
    signal.addEventListener('abort', () => observer.disconnect());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 一行清理所有資源！
    this.#controller.abort();
    // 重置 controller 以便 reconnect 時使用
    this.#controller = new AbortController();
  }
}</code></pre>
</section>
  `,
};
