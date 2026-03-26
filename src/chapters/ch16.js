export default {
  title: '網路層設計與 API 整合',
  intro: '現代前端應用的複雜度很大程度上來自網路請求的管理。本章介紹如何設計健壯的網路層，處理競態條件、快取、錯誤，以及即時通訊協議。',
  content: `
<section id="fetch-api">
  <h2>Fetch API 完整使用</h2>
  <p>Fetch API 是現代瀏覽器的標準請求 API，比 XMLHttpRequest 更簡潔。以下是一個完整的封裝範例。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 完整的 Fetch 封裝：超時、重試、攔截器
class HttpClient {
  #baseURL;
  #defaultHeaders;
  #interceptors = { request: [], response: [] };
  #timeout;

  constructor({ baseURL = '', headers = {}, timeout = 10000 } = {}) {
    this.#baseURL = baseURL;
    this.#defaultHeaders = { 'Content-Type': 'application/json', ...headers };
    this.#timeout = timeout;
  }

  use(type, fn) {
    this.#interceptors[type].push(fn);
    return this;
  }

  async request(path, options = {}) {
    let config = {
      url: this.#baseURL + path,
      headers: { ...this.#defaultHeaders, ...options.headers },
      ...options,
    };

    // 執行 request 攔截器
    for (const interceptor of this.#interceptors.request) {
      config = await interceptor(config);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(config.url, {
        ...config,
        signal: config.signal ?? controller.signal,
      });

      let result = { response, data: null, error: null };

      if (response.ok) {
        result.data = await response.json();
      } else {
        result.error = new ApiError(response.status, await response.text());
      }

      // 執行 response 攔截器
      for (const interceptor of this.#interceptors.response) {
        result = await interceptor(result);
      }

      if (result.error) throw result.error;
      return result.data;

    } finally {
      clearTimeout(timeoutId);
    }
  }

  get(path, options) { return this.request(path, { method: 'GET', ...options }); }
  post(path, body, options) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body), ...options });
  }
  put(path, body, options) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body), ...options });
  }
  delete(path, options) { return this.request(path, { method: 'DELETE', ...options }); }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 使用範例
export const api = new HttpClient({ baseURL: '/api/v1' });

// 加入 Auth 攔截器
api.use('request', (config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = \`Bearer \${token}\`;
  return config;
});</code></pre>
</section>

<section id="race-conditions">
  <h2>Race Condition 辨識與防護</h2>
  <p>當使用者快速切換時，早發出的請求可能比晚發出的請求更晚回來，導致舊資料覆蓋新資料。</p>

  <pre data-lang="javascript"><code class="language-javascript">// ❌ Race Condition 範例：快速輸入時可能顯示過時結果
class SearchInput extends LitElement {
  async _onInput(e) {
    const results = await api.get(\`/search?q=\${e.target.value}\`);
    this._results = results; // 可能是舊請求的結果！
  }
}

// ✅ 方法一：用 AbortController 取消舊請求
class SearchInput extends LitElement {
  #controller = null;

  async _onSearch(query) {
    // 取消上一次請求
    this.#controller?.abort();
    this.#controller = new AbortController();

    try {
      const results = await api.get(\`/search?q=\${query}\`, {
        signal: this.#controller.signal,
      });
      this._results = results;
    } catch (e) {
      if (e.name !== 'AbortError') this._error = e.message;
    }
  }
}

// ✅ 方法二：用 sequence number 丟棄過時結果
class SearchInput extends LitElement {
  #seq = 0;

  async _onSearch(query) {
    const seq = ++this.#seq;
    const results = await api.get(\`/search?q=\${query}\`);

    // 如果有更新的請求已經出發，忽略這個結果
    if (seq !== this.#seq) return;
    this._results = results;
  }
}</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">競態條件常見場景</div>
    <p>Search autocomplete、Tab 切換載入內容、分頁切換、路由跳轉時的資料載入，都是競態條件的高發場景。AbortController 是最佳解法，因為它同時節省了頻寬。</p>
  </div>
</section>

<section id="request-caching">
  <h2>Request/Response Caching 策略</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 簡單的 in-memory cache with TTL
class RequestCache {
  #cache = new Map();

  get(key, ttl = 60000) {
    const entry = this.#cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.#cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttl = 60000) {
    this.#cache.set(key, { data, expiresAt: Date.now() + ttl });
  }

  invalidate(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
      this.#cache.delete(keyOrPattern);
    } else {
      // RegExp invalidation
      for (const key of this.#cache.keys()) {
        if (keyOrPattern.test(key)) this.#cache.delete(key);
      }
    }
  }
}

const cache = new RequestCache();

// Stale-While-Revalidate 模式
async function fetchWithSWR(url, ttl = 30000) {
  const cached = cache.get(url, ttl);

  if (cached) {
    // 有快取：立即返回，背景更新
    fetch(url)
      .then(r => r.json())
      .then(data => cache.set(url, data, ttl));
    return cached;
  }

  // 沒有快取：等待請求
  const data = await fetch(url).then(r => r.json());
  cache.set(url, data, ttl);
  return data;
}

// Request Deduplication：相同請求只發一次
const pending = new Map();

async function dedupedFetch(url) {
  if (pending.has(url)) {
    return pending.get(url); // 等待同一個 Promise
  }

  const promise = fetch(url)
    .then(r => r.json())
    .finally(() => pending.delete(url));

  pending.set(url, promise);
  return promise;
}</code></pre>
</section>

<section id="error-handling">
  <h2>Error Handling 分層設計</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 錯誤分層：網路層 → 業務層 → UI 層
class NetworkError extends Error {
  constructor(message) { super(message); this.name = 'NetworkError'; }
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get isAuthError() { return this.status === 401 || this.status === 403; }
  get isNotFound() { return this.status === 404; }
  get isServerError() { return this.status >= 500; }
}

// 統一的錯誤轉換層
async function handleResponse(response) {
  if (response.ok) return response.json();

  const body = await response.json().catch(() => ({}));
  throw new ApiError(
    response.status,
    body.code ?? 'UNKNOWN',
    body.message ?? response.statusText
  );
}

// UI 層：根據錯誤類型顯示不同訊息
class DataView extends LitElement {
  @state() _data = null;
  @state() _error = null;
  @state() _loading = false;

  async _loadData() {
    this._loading = true;
    this._error = null;
    try {
      this._data = await api.get('/data');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.isAuthError) {
          // 跳轉到登入頁
          navigateTo('/login');
        } else if (e.isNotFound) {
          this._error = '找不到此資源';
        } else if (e.isServerError) {
          this._error = '伺服器錯誤，請稍後再試';
        } else {
          this._error = e.message;
        }
      } else if (e instanceof NetworkError || e.name === 'TypeError') {
        this._error = '網路連線問題，請檢查網路狀態';
      } else {
        this._error = '發生未預期的錯誤';
        console.error(e);
      }
    } finally {
      this._loading = false;
    }
  }
}</code></pre>
</section>

<section id="websocket-sse">
  <h2>WebSocket 與 Server-Sent Events</h2>

  <pre data-lang="javascript"><code class="language-javascript">// WebSocket：雙向即時通訊
class WebSocketClient extends EventTarget {
  #ws = null;
  #url;
  #reconnectDelay = 1000;
  #reconnectAttempts = 0;
  #maxReconnects = 5;
  #pingInterval = null;

  constructor(url) {
    super();
    this.#url = url;
  }

  connect() {
    this.#ws = new WebSocket(this.#url);

    this.#ws.onopen = () => {
      this.#reconnectAttempts = 0;
      this.#reconnectDelay = 1000;
      this.dispatchEvent(new CustomEvent('connected'));
      // 定期 ping 保持連線
      this.#pingInterval = setInterval(() => this.send({ type: 'PING' }), 30000);
    };

    this.#ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      this.dispatchEvent(new CustomEvent('message', { detail: message }));
    };

    this.#ws.onclose = () => {
      clearInterval(this.#pingInterval);
      this._maybeReconnect();
    };

    this.#ws.onerror = (error) => {
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    };
  }

  _maybeReconnect() {
    if (this.#reconnectAttempts >= this.#maxReconnects) {
      this.dispatchEvent(new CustomEvent('max-reconnects'));
      return;
    }
    this.#reconnectAttempts++;
    setTimeout(() => this.connect(), this.#reconnectDelay);
    this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, 30000); // exponential backoff
  }

  send(data) {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    clearInterval(this.#pingInterval);
    this.#maxReconnects = 0; // 防止重連
    this.#ws?.close();
  }
}

// Server-Sent Events：服務端推送（單向，自動重連）
class SSEClient extends EventTarget {
  #source = null;

  connect(url) {
    this.#source = new EventSource(url);

    this.#source.onmessage = ({ data }) => {
      this.dispatchEvent(new CustomEvent('data', { detail: JSON.parse(data) }));
    };

    // 監聽特定事件類型
    this.#source.addEventListener('notification', ({ data }) => {
      this.dispatchEvent(new CustomEvent('notification', { detail: JSON.parse(data) }));
    });

    this.#source.onerror = () => {
      // EventSource 會自動重連，這裡只需要記錄
      this.dispatchEvent(new CustomEvent('reconnecting'));
    };
  }

  disconnect() {
    this.#source?.close();
  }
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">選擇 WebSocket 還是 SSE？</div>
    <p>如果只需要服務端推送（如通知、直播評論、股票更新），優先選 SSE——它更簡單，自動重連，並且走 HTTP 協議（無需特殊代理設定）。WebSocket 適合需要雙向通訊的場景（如聊天室、協作編輯）。</p>
  </div>
</section>
  `,
};
