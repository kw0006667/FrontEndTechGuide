export default {
  title: '狀態管理的模式與策略',
  intro: '狀態管理是前端應用最複雜的部分之一。本章不推薦特定的狀態管理庫，而是讓你理解不同模式各自適合什麼樣的複雜度和團隊規模。',
  content: `
<section id="component-state">
  <h2>元件內部狀態</h2>
  <p>第一個問題永遠是：這個狀態真的需要共享嗎？大部分的 UI 狀態（是否展開、哪個 tab 是 active）只屬於當前元件，不需要提升。</p>

  <pre data-lang="javascript"><code class="language-javascript">class AccordionItem extends LitElement {
  // 展開狀態只屬於這個元件，用 @state 即可
  @state() _expanded = false;

  render() {
    return html\`
      &lt;button @click=\${() => this._expanded = !this._expanded}&gt;
        \${this.label}
      &lt;/button&gt;
      &lt;div ?hidden=\${!this._expanded}&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">原則：狀態越近越好</div>
    <p>狀態應該放在「需要它的最近共同祖先」。不要過早提升狀態到全局，這會造成不必要的複雜度和重渲染。</p>
  </div>
</section>

<section id="props-events">
  <h2>Props Down / Events Up</h2>
  <p>Parent-Child 通訊的黃金法則：資料向下透過 property 傳遞，事件向上透過 CustomEvent 冒泡。</p>

  <pre data-lang="javascript"><code class="language-javascript">// Parent：管理狀態，向下傳 props
class TodoList extends LitElement {
  @state() _items = [
    { id: 1, text: 'Learn Lit', done: false },
    { id: 2, text: 'Build something', done: false },
  ];

  render() {
    return html\`
      \${this._items.map(item =&gt; html\`
        &lt;todo-item
          .item=\${item}
          @toggle=\${(e) =&gt; this._toggleItem(e.detail.id)}
          @delete=\${(e) =&gt; this._deleteItem(e.detail.id)}
        &gt;&lt;/todo-item&gt;
      \`)}
    \`;
  }

  _toggleItem(id) {
    this._items = this._items.map(item =&gt;
      item.id === id ? { ...item, done: !item.done } : item
    );
  }
}

// Child：接收 props，向上發事件
class TodoItem extends LitElement {
  @property({ attribute: false }) item = {};

  render() {
    return html\`
      &lt;input
        type="checkbox"
        ?checked=\${this.item.done}
        @change=\${this._onToggle}
      /&gt;
      &lt;span&gt;\${this.item.text}&lt;/span&gt;
      &lt;button @click=\${this._onDelete}&gt;刪除&lt;/button&gt;
    \`;
  }

  _onToggle() {
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { id: this.item.id },
      bubbles: true,
    }));
  }
}</code></pre>
</section>

<section id="context-protocol">
  <h2>Context Protocol 跨層級傳遞</h2>
  <p>當資料需要跨越多個層級傳遞（prop drilling 問題），可以使用 <code>@lit/context</code> 套件。</p>

  <pre data-lang="javascript"><code class="language-javascript">import { createContext, provide, consume } from '@lit/context';

// 1. 定義 context
export const themeContext = createContext('theme');
export const localeContext = createContext('locale');

// 2. Provider：提供資料
class AppShell extends LitElement {
  @provide({ context: themeContext })
  @state()
  theme = 'light';

  @provide({ context: localeContext })
  @state()
  locale = 'zh-TW';
}

// 3. Consumer：消費資料（任何深度的子元件）
class ThemeAwareButton extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  theme = 'light';

  @consume({ context: localeContext, subscribe: true })
  locale = 'zh-TW';

  render() {
    return html\`
      &lt;button class=\${this.theme}&gt;
        \${t('button.label', this.locale)}
      &lt;/button&gt;
    \`;
  }
}</code></pre>
</section>

<section id="pubsub-eventbus">
  <h2>Pub/Sub 與 EventBus</h2>
  <p>對於需要完全鬆耦合的元件通訊，Pub/Sub 模式可以讓元件在不知道彼此存在的情況下通訊。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 簡單的 EventBus 實作（基於 EventTarget）
class EventBus extends EventTarget {
  emit(type, data) {
    this.dispatchEvent(new CustomEvent(type, { detail: data }));
  }

  on(type, handler) {
    this.addEventListener(type, (e) => handler(e.detail));
    return () => this.removeEventListener(type, handler);
  }
}

export const bus = new EventBus();

// 發布者元件
class CartButton extends LitElement {
  _addToCart(product) {
    bus.emit('cart:add', { product, quantity: 1 });
  }
}

// 訂閱者元件（與發布者完全無關）
class CartIcon extends LitElement {
  @state() _count = 0;
  _unsubscribe;

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = bus.on('cart:add', ({ quantity }) => {
      this._count += quantity;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.(); // 取消訂閱
  }
}</code></pre>
</section>

<section id="centralized-store">
  <h2>Centralized Store 模式</h2>
  <p>當應用複雜度提升，需要可預測的狀態變化和 time-travel debugging，Redux-like 的 state-reducer 模式是好選擇。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 輕量級 Store 實作
function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(l => l(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// Reducer：純函式，給定 state + action 返回新 state
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload ? { ...item, done: !item.done } : item
        ),
      };
    default:
      return state;
  }
}

export const store = createStore(todoReducer, { items: [] });

// Lit Component 訂閱 store
class TodoApp extends LitElement {
  #unsubscribe;

  connectedCallback() {
    super.connectedCallback();
    this.#unsubscribe = store.subscribe(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unsubscribe();
  }

  get _state() { return store.getState(); }

  render() {
    return html\`
      \${this._state.items.map(item =&gt; html\`&lt;todo-item .item=\${item}&gt;&lt;/todo-item&gt;\`)}
    \`;
  }
}</code></pre>
</section>

<section id="derived-state">
  <h2>Derived State vs Stored State</h2>
  <p>「能計算出來的就不要存」是狀態管理中最重要的原則之一，它能防止狀態不一致問題。</p>

  <pre data-lang="javascript"><code class="language-javascript">// ❌ 儲存 derived state：容易造成不一致
class ShoppingCart {
  @state() items = [];
  @state() total = 0;        // ❌ derived from items
  @state() itemCount = 0;    // ❌ derived from items
  @state() isEmpty = true;   // ❌ derived from items

  addItem(item) {
    this.items = [...this.items, item];
    this.total += item.price;   // 必須記得更新
    this.itemCount += 1;        // 必須記得更新
    this.isEmpty = false;       // 必須記得更新
    // 一旦忘記更新任一個，狀態就不一致了
  }
}

// ✅ 只儲存 source of truth，用 getter 計算
class ShoppingCart {
  @state() items = [];

  // 在 willUpdate 或 getter 中計算 derived state
  get total() { return this.items.reduce((sum, item) => sum + item.price, 0); }
  get itemCount() { return this.items.length; }
  get isEmpty() { return this.items.length === 0; }

  addItem(item) {
    this.items = [...this.items, item];
    // 所有 derived state 自動更新！
  }
}</code></pre>
</section>
  `,
};
