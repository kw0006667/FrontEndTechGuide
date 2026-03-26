export default {
  title: '前端路由與 SPA 架構',
  intro: '路由是 SPA 的骨架。本章介紹如何從零實作一個功能完整的前端路由器，理解 History API、程式碼分割、以及導航守衛等核心概念。',
  content: `
<section id="history-api">
  <h2>History API 深入理解</h2>
  <p>瀏覽器的 History API 提供了在不重新載入頁面的情況下操控瀏覽記錄的能力，是 SPA 路由的基礎。</p>

  <pre data-lang="javascript"><code class="language-javascript">// pushState vs replaceState
history.pushState(state, title, url);   // 新增歷史記錄
history.replaceState(state, title, url); // 替換當前記錄，不新增

// 監聽瀏覽器的前進/後退
window.addEventListener('popstate', ({ state }) => {
  // state 是 pushState 時傳入的第一個參數
  console.log('Navigate to:', window.location.pathname, state);
});

// 攔截所有 <a> 點擊（client-side navigation）
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const url = new URL(link.href);

  // 只攔截同源、非外部、非下載的連結
  if (
    url.origin !== window.location.origin ||
    link.target === '_blank' ||
    link.hasAttribute('download') ||
    e.metaKey || e.ctrlKey || e.shiftKey // 讓組合鍵正常工作
  ) return;

  e.preventDefault();
  router.navigate(url.pathname + url.search + url.hash);
});</code></pre>
</section>

<section id="router-implementation">
  <h2>從零實作前端路由器</h2>

  <pre data-lang="javascript"><code class="language-javascript">class Router {
  #routes = [];
  #currentRoute = null;
  #guards = [];
  #notFoundHandler = null;

  // 定義路由
  route(pattern, handler, options = {}) {
    this.#routes.push({
      pattern: this._compilePattern(pattern),
      handler,
      meta: options.meta ?? {},
    });
    return this;
  }

  notFound(handler) {
    this.#notFoundHandler = handler;
    return this;
  }

  // 導航守衛（beforeEach）
  beforeEach(guard) {
    this.#guards.push(guard);
    return this;
  }

  async navigate(path, { replace = false } = {}) {
    const url = new URL(path, window.location.origin);
    const matched = this._match(url.pathname);

    if (!matched) {
      this.#notFoundHandler?.({ path });
      return;
    }

    // 執行導航守衛
    const context = {
      to: { path: url.pathname, params: matched.params, query: Object.fromEntries(url.searchParams), meta: matched.meta },
      from: this.#currentRoute,
    };

    for (const guard of this.#guards) {
      const result = await guard(context);
      if (result === false) return;          // 取消導航
      if (typeof result === 'string') {
        return this.navigate(result);          // 重定向
      }
    }

    this.#currentRoute = context.to;

    if (replace) {
      history.replaceState(context.to, '', path);
    } else {
      history.pushState(context.to, '', path);
    }

    await matched.handler(context.to);
  }

  _compilePattern(pattern) {
    // 將 '/users/:id/posts/:postId' 轉為正規表達式
    const paramNames = [];
    const regexStr = pattern
      .replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');

    return { regex: new RegExp(\`^\${regexStr}$\`), paramNames };
  }

  _match(pathname) {
    for (const route of this.#routes) {
      const match = pathname.match(route.pattern.regex);
      if (!match) continue;

      const params = {};
      route.pattern.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      return { ...route, params };
    }
    return null;
  }

  init() {
    window.addEventListener('popstate', ({ state }) => {
      this.navigate(window.location.pathname + window.location.search, { replace: true });
    });
    this.navigate(window.location.pathname + window.location.search, { replace: true });
  }
}

// 使用範例
const router = new Router();

router
  .beforeEach(async ({ to }) => {
    if (to.meta.requiresAuth && !auth.isLoggedIn()) {
      return \`/login?redirect=\${to.path}\`; // 重定向
    }
  })
  .route('/', () => renderPage('home'))
  .route('/users/:id', ({ params }) => renderPage('user', params))
  .route('/admin/*', ({ params }) => renderPage('admin'), { meta: { requiresAuth: true } })
  .notFound(() => renderPage('404'))
  .init();</code></pre>
</section>

<section id="lazy-routes">
  <h2>路由層級的 Code Splitting</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 每個路由對應一個動態 import chunk
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.js'),
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.js'),
    meta: { requiresAuth: true },
    // 預載相關 chunk
    prefetch: [
      () => import('./pages/DashboardChart.js'),
      () => import('./pages/DashboardTable.js'),
    ],
  },
  {
    path: '/settings/:tab',
    component: () => import('./pages/Settings.js'),
  },
];

// 路由解析器：帶快取的懶載入
const componentCache = new Map();

async function resolveComponent(route) {
  if (componentCache.has(route.path)) {
    return componentCache.get(route.path);
  }

  const module = await route.component();
  const component = module.default;
  componentCache.set(route.path, component);

  // 預載相關模組
  route.prefetch?.forEach(loader => loader());

  return component;
}

// 在視窗空閒時預載高機率訪問的頁面
function prefetchLikelyRoutes() {
  requestIdleCallback(() => {
    const likelyRoutes = routes.filter(r => r.prefetch);
    likelyRoutes.forEach(route => route.prefetch?.forEach(loader => loader()));
  });
}</code></pre>
</section>

<section id="scroll-restoration">
  <h2>Scroll Restoration 與導航狀態</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 關閉瀏覽器自動滾動恢復（我們自己管理）
history.scrollRestoration = 'manual';

class ScrollManager {
  #savedPositions = new Map();

  // 離開頁面前儲存滾動位置
  savePosition(key) {
    this.#savedPositions.set(key, {
      x: window.scrollX,
      y: window.scrollY,
    });
  }

  // 到達頁面後恢復滾動位置
  restorePosition(key, { smooth = false } = {}) {
    const pos = this.#savedPositions.get(key);
    if (pos) {
      window.scrollTo({
        left: pos.x,
        top: pos.y,
        behavior: smooth ? 'smooth' : 'instant',
      });
    } else {
      window.scrollTo(0, 0); // 新頁面回到頂部
    }
  }
}

const scrollManager = new ScrollManager();

// 整合到路由
router.beforeEach(({ from }) => {
  if (from) scrollManager.savePosition(from.path);
});

router.afterEach(({ to, from }) => {
  if (to.hash) {
    // 有 hash，滾動到對應元素
    document.getElementById(to.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  } else {
    scrollManager.restorePosition(to.path);
  }
});</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">後退時的使用者體驗</div>
    <p>當使用者點擊後退按鈕時，他們期望回到離開前的捲動位置。透過在 beforeEach 儲存位置、在 afterEach 恢復位置，可以打造接近原生應用的導航體驗。</p>
  </div>
</section>
  `,
};
