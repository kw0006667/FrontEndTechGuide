export default {
  title: 'TypeScript 型別系統的工程價值',
  intro: '型別系統不只是「加上型別標註」，而是一套能在編譯時期捕捉整類錯誤的工程工具。它是你寫給「未來的自己」和「團隊成員」的一份活文件，描述了程式碼的契約和約束條件。',
  content: `
<section id="type-narrowing">
  <h2>Type Narrowing 與 Discriminated Unions</h2>
  <p>Type Narrowing 是 TypeScript 最強大的特性之一。當你在程式碼中加入條件判斷，TypeScript 能夠自動縮小型別的範圍，讓你在特定分支中獲得更精確的型別資訊。</p>

  <h3>基本 Type Narrowing</h3>
  <p>最常見的 narrowing 是使用 <code>typeof</code>、<code>instanceof</code> 和 <code>in</code> 運算子：</p>
  <pre data-lang="typescript"><code class="language-typescript">function processInput(input: string | number) {
  if (typeof input === 'string') {
    // 此分支中 input 的型別為 string
    return input.toUpperCase();
  }
  // 此分支中 input 的型別為 number
  return input.toFixed(2);
}</code></pre>

  <h3>Discriminated Unions 在狀態管理中的應用</h3>
  <p>在前端應用中，一個最常見的場景是表示非同步資料的載入狀態。使用 Discriminated Union，我們可以讓 TypeScript 強制要求每個狀態都被正確處理：</p>
  <pre data-lang="typescript"><code class="language-typescript">type AsyncState&lt;T&gt; =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState&lt;T&gt;(state: AsyncState&lt;T&gt;) {
  switch (state.status) {
    case 'idle':
      return '請點擊載入';
    case 'loading':
      return '載入中...';
    case 'success':
      // TypeScript 知道這裡有 state.data
      return JSON.stringify(state.data);
    case 'error':
      // TypeScript 知道這裡有 state.error
      return \`錯誤：\${state.error.message}\`;
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">工程價值</div>
    <p>當你增加新的狀態（例如 <code>'cancelled'</code>），TypeScript 會立即在所有 switch 語句中報告遺漏的 case，讓你不會忘記處理新狀態。</p>
  </div>
</section>

<section id="generics">
  <h2>Generics：可重用的型別安全工具</h2>
  <p>Generics 讓你可以撰寫一次程式碼，但它能正確地與多種型別配合。這是「型別安全」與「程式碼重用」之間最重要的橋梁。</p>

  <h3>API Response 的型別安全處理</h3>
  <p>以下是一個常見的前端模式——封裝 API 呼叫，使其具備完整的型別推導：</p>
  <pre data-lang="typescript"><code class="language-typescript">interface ApiResponse&lt;T&gt; {
  data: T;
  meta: { total: number; page: number };
  errors: string[] | null;
}

async function fetchResource&lt;T&gt;(url: string): Promise&lt;ApiResponse&lt;T&gt;&gt; {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP Error: \${response.status}\`);
  }
  return response.json() as Promise&lt;ApiResponse&lt;T&gt;&gt;;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// TypeScript 自動推導出 result.data 的型別為 User[]
const result = await fetchResource&lt;User[]&gt;('/api/users');</code></pre>

  <h3>Constrained Generics</h3>
  <p>使用 <code>extends</code> 可以限制 Generic 的型別範圍，讓函式只接受特定結構的資料：</p>
  <pre data-lang="typescript"><code class="language-typescript">function getProperty&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
const name = getProperty(user, 'name'); // 型別：string
const id = getProperty(user, 'id');     // 型別：number
// getProperty(user, 'phone');          // 編譯錯誤！</code></pre>
</section>

<section id="conditional-types">
  <h2>Conditional Types 與 Template Literal Types</h2>
  <p>Conditional Types 讓型別系統本身具備「邏輯判斷」的能力。這在建立型別安全的 API、事件系統時特別有用。</p>

  <h3>事件系統的型別推導</h3>
  <p>以下示範如何讓事件處理器的參數型別自動對應到事件名稱：</p>
  <pre data-lang="typescript"><code class="language-typescript">interface EventMap {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'cart:add': { productId: string; quantity: number };
}

type EventHandler&lt;K extends keyof EventMap&gt; = (payload: EventMap[K]) =&gt; void;

class TypedEventEmitter {
  on&lt;K extends keyof EventMap&gt;(event: K, handler: EventHandler&lt;K&gt;): void {
    // 實作...
  }
}

const emitter = new TypedEventEmitter();

// TypeScript 自動推導 payload 的型別
emitter.on('user:login', (payload) =&gt; {
  console.log(payload.userId);    // ✅ 型別安全
  console.log(payload.timestamp); // ✅ 型別安全
  // console.log(payload.quantity); // ❌ 編譯錯誤
});</code></pre>

  <h3>Template Literal Types</h3>
  <pre data-lang="typescript"><code class="language-typescript">type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K];
};

interface Config {
  theme: string;
  locale: string;
}

// 自動生成 { getTheme: () => string; getLocale: () => string }
type ConfigGetters = Getters&lt;Config&gt;;</code></pre>
</section>

<section id="mapped-types">
  <h2>Mapped Types 自動衍生型別</h2>
  <p>Mapped Types 讓你可以從既有的型別自動生成新的型別，大幅減少重複的型別定義。</p>

  <pre data-lang="typescript"><code class="language-typescript">// 讓所有屬性變成可選且唯讀
type ReadonlyPartial&lt;T&gt; = {
  readonly [K in keyof T]?: T[K];
};

// 讓所有屬性都包裹在 Promise 中
type Promisified&lt;T&gt; = {
  [K in keyof T]: T[K] extends (...args: infer A) =&gt; infer R
    ? (...args: A) =&gt; Promise&lt;R&gt;
    : Promise&lt;T[K]&gt;;
};

// 從 Union 中排除特定型別
type ExcludeNull&lt;T&gt; = {
  [K in keyof T]: NonNullable&lt;T[K]&gt;;
};</code></pre>
</section>

<section id="practical-examples">
  <h2>實戰：型別安全的 API 設計</h2>
  <p>綜合以上技術，我們可以建立一個完全型別安全的 REST API client：</p>

  <pre data-lang="typescript"><code class="language-typescript">type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Endpoint&lt;TParams, TBody, TResponse&gt; {
  method: HttpMethod;
  url: (params: TParams) =&gt; string;
  body?: TBody;
  response: TResponse;
}

const endpoints = {
  getUser: {
    method: 'GET' as const,
    url: (params: { id: number }) =&gt; \`/api/users/\${params.id}\`,
    response: {} as User,
  },
  createUser: {
    method: 'POST' as const,
    url: () =&gt; '/api/users',
    response: {} as User,
  },
} satisfies Record&lt;string, Partial&lt;Endpoint&lt;any, any, any&gt;&gt;&gt;;

// 使用者端：所有回傳型別都能被正確推導
async function apiCall&lt;K extends keyof typeof endpoints&gt;(
  key: K,
  ...args: Parameters&lt;typeof endpoints[K]['url']&gt;
) {
  const endpoint = endpoints[key];
  const url = (endpoint.url as Function)(...args);
  const response = await fetch(url, { method: endpoint.method });
  return response.json() as Promise&lt;typeof endpoints[K]['response']&gt;;
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">Senior 工程師的思維</div>
    <p>型別系統的最大價值不在於捕捉個別的錯誤，而在於讓整個程式碼庫形成一個「自我文件化」的系統。當你修改 API 回傳的資料結構，TypeScript 會立即告訴你所有受影響的地方——這才是真正的工程價值。</p>
  </div>
</section>
  `,
};
