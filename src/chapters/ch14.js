export default {
  title: '網路效能與資源載入策略',
  intro: '前端效能的很大一部分取決於網路資源的載入效率。本章介紹如何最小化網路延遲對使用者體驗的影響，讓頁面更快、更可靠。',
  content: `
<section id="code-splitting">
  <h2>Code Splitting 與 Lazy Loading</h2>
  <p>Code Splitting 讓你可以將 JavaScript bundle 拆分成多個較小的 chunk，只在需要時才載入。這是改善初始載入時間最有效的策略之一。</p>

  <h3>Dynamic Import</h3>
  <pre data-lang="javascript"><code class="language-javascript">// Route-based splitting：每個路由一個 chunk
const routes = {
  '/dashboard': () => import('./pages/Dashboard.js'),
  '/profile': () => import('./pages/Profile.js'),
  '/settings': () => import('./pages/Settings.js'),
};

async function navigate(path) {
  const loader = routes[path];
  if (!loader) return show404();

  showLoadingSpinner();
  try {
    const { default: Page } = await loader();
    renderPage(new Page());
  } finally {
    hideLoadingSpinner();
  }
}

// Component-based splitting：大型功能模組
class AppShell extends LitElement {
  async _loadChartModule() {
    // 只有在使用者需要圖表時才載入
    const { ChartComponent } = await import('./features/charts/index.js');
    this._ChartComponent = ChartComponent;
    this.requestUpdate();
  }

  render() {
    return html\`
      \${this._ChartComponent
        ? html\`&lt;chart-component&gt;&lt;/chart-component&gt;\`
        : html\`&lt;button @click=\${this._loadChartModule}&gt;載入圖表&lt;/button&gt;\`
      }
    \`;
  }
}</code></pre>
</section>

<section id="resource-hints">
  <h2>Resource Hints 適用場景</h2>
  <p>Resource Hints 讓瀏覽器提前建立連線或下載資源，縮短關鍵路徑的延遲。</p>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>preconnect — 提前建立連線</h4>
      <p>當你確定會使用某個 origin 的資源時使用。</p>
      <pre><code class="language-html">&lt;link rel="preconnect" href="https://api.example.com" /&gt;
&lt;link rel="preconnect" href="https://fonts.googleapis.com" crossorigin /&gt;</code></pre>
    </div>
    <div class="comparison-card">
      <h4>preload — 高優先級預載</h4>
      <p>當前頁面確定需要的關鍵資源（字型、hero 圖片、關鍵 CSS）。</p>
      <pre><code class="language-html">&lt;link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin /&gt;
&lt;link rel="preload" href="/hero.jpg" as="image" /&gt;</code></pre>
    </div>
    <div class="comparison-card">
      <h4>prefetch — 低優先級預取</h4>
      <p>使用者<em>可能</em>需要的下一頁資源。</p>
      <pre><code class="language-html">&lt;link rel="prefetch" href="/next-page-chunk.js" /&gt;</code></pre>
    </div>
    <div class="comparison-card">
      <h4>dns-prefetch — DNS 預解析</h4>
      <p>當你不確定會用到，但想縮短 DNS 解析時間。</p>
      <pre><code class="language-html">&lt;link rel="dns-prefetch" href="https://cdn.example.com" /&gt;</code></pre>
    </div>
  </div>
</section>

<section id="service-worker">
  <h2>Service Worker 離線快取</h2>
  <pre data-lang="javascript"><code class="language-javascript">// sw.js — Service Worker
const CACHE_VERSION = 'v1.2.0';
const STATIC_CACHE = \`static-\${CACHE_VERSION}\`;
const DYNAMIC_CACHE = 'dynamic';

const PRECACHE_URLS = [
  '/',
  '/src/main.js',
  '/src/styles/main.css',
];

// Install：預快取靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate：清除舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch：Stale-While-Revalidate 策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      });
      // 先返回快取（如果有），同時在背景更新
      return cached ?? networkFetch;
    })
  );
});</code></pre>
</section>

<section id="http-caching">
  <h2>HTTP Caching 策略選擇</h2>
  <table>
    <thead>
      <tr><th>資源類型</th><th>Cache-Control</th><th>說明</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Hashed JS/CSS chunks</td>
        <td><code>public, max-age=31536000, immutable</code></td>
        <td>永遠快取（URL 含 hash，有變化就換 URL）</td>
      </tr>
      <tr>
        <td>HTML 頁面</td>
        <td><code>no-cache</code></td>
        <td>每次都驗證（確保使用最新 HTML）</td>
      </tr>
      <tr>
        <td>API 回應</td>
        <td><code>private, max-age=60, stale-while-revalidate=300</code></td>
        <td>快取 1 分鐘，5 分鐘內 stale 仍可用</td>
      </tr>
      <tr>
        <td>靜態圖片</td>
        <td><code>public, max-age=86400</code></td>
        <td>快取一天</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="image-optimization">
  <h2>Image Optimization</h2>
  <pre data-lang="html"><code class="language-html">&lt;!-- Responsive Images：根據螢幕尺寸載入最合適的圖片 --&gt;
&lt;img
  src="/images/hero-800.jpg"
  srcset="
    /images/hero-400.jpg 400w,
    /images/hero-800.jpg 800w,
    /images/hero-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
  alt="Hero Image"
  loading="lazy"
  decoding="async"
  fetchpriority="high"
/&gt;

&lt;!-- Picture element：現代格式 + fallback --&gt;
&lt;picture&gt;
  &lt;source type="image/avif" srcset="/images/hero.avif" /&gt;
  &lt;source type="image/webp" srcset="/images/hero.webp" /&gt;
  &lt;img src="/images/hero.jpg" alt="Hero" /&gt;
&lt;/picture&gt;</code></pre>

  <h3>Web Component 中的 Lazy Load Image</h3>
  <pre data-lang="javascript"><code class="language-javascript">class LazyImage extends LitElement {
  @property() src = '';
  @property() alt = '';
  @state() _visible = false;
  #observer;

  connectedCallback() {
    super.connectedCallback();
    this.#observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this._visible = true;
        this.#observer.disconnect();
      }
    }, { rootMargin: '200px' }); // 200px 提前載入
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  render() {
    return this._visible
      ? html\`&lt;img src=\${this.src} alt=\${this.alt} decoding="async" /&gt;\`
      : html\`&lt;div class="placeholder" style="aspect-ratio: 16/9"&gt;&lt;/div&gt;\`;
  }
}</code></pre>
</section>
  `,
};
