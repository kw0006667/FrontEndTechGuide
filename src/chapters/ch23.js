export default {
  title: '系統設計面試：前端視角',
  intro: '系統設計面試考驗你將模糊需求轉化為具體架構的能力。本章以前端為主視角，介紹如何系統性地分析需求、設計架構，並讓面試官看到你的工程思維深度。',
  content: `
<section id="interview-framework">
  <h2>面試答題框架</h2>
  <p>面對「設計一個 XX 系統」的問題，遵循以下流程：</p>

  <ol>
    <li><strong>釐清需求（5 分鐘）</strong>：問清楚使用者規模、功能範圍、效能要求、限制條件</li>
    <li><strong>高層架構（5 分鐘）</strong>：畫出主要元件和資料流向</li>
    <li><strong>深入設計（15 分鐘）</strong>：根據面試官興趣深入某個領域</li>
    <li><strong>討論取捨（5 分鐘）</strong>：分析你做的設計決策的優缺點</li>
  </ol>

  <div class="callout callout-tip">
    <div class="callout-title">釐清需求的關鍵問題</div>
    <p>DAU（日活使用者）多少？支援哪些平台（mobile web/desktop/app）？對離線支援有需求嗎？對效能的要求是什麼（LCP < 2.5s？）？是否有無障礙要求？這些問題的答案會直接影響你的設計決策。</p>
  </div>
</section>

<section id="design-news-feed">
  <h2>設計 News Feed（社交動態）</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 需求確認：
// - 1億 DAU，每人每次滾動載入 20 則
// - 支援文字、圖片、影片
// - 需要即時更新（有人點贊時要更新）
// - LCP < 2.5s

// === 高層架構 ===
// 1. Infinite Scroll + Virtual List（效能）
// 2. Optimistic Updates（UX）
// 3. WebSocket for real-time（即時性）
// 4. Image Lazy Loading + Skeleton（初始載入）

// === 深入：Feed 資料管理 ===
class FeedStore {
  #items = new Map();    // id → item（快速查找）
  #order = [];           // 維持排序
  #page = 0;
  #hasMore = true;
  #loading = false;

  // Optimistic Update：點讚立即反映，不等 server
  async likeItem(id) {
    const item = this.#items.get(id);
    if (!item) return;

    // 1. 立即更新 UI
    this.#items.set(id, { ...item, likes: item.likes + 1, liked: true });
    this._notify();

    try {
      // 2. 發送請求到 server
      await api.post(\`/posts/\${id}/like\`);
    } catch (e) {
      // 3. 失敗時 rollback
      this.#items.set(id, item);
      this._notify();
      showToast('點讚失敗，請重試');
    }
  }

  // 分頁載入：使用 cursor-based pagination（比 offset 更穩定）
  async loadMore() {
    if (this.#loading || !this.#hasMore) return;
    this.#loading = true;

    const lastItem = this.#order[this.#order.length - 1];
    const cursor = lastItem ? this.#items.get(lastItem)?.createdAt : null;

    try {
      const { items, hasMore } = await api.get('/feed', {
        params: { cursor, limit: 20 }
      });

      items.forEach(item => this.#items.set(item.id, item));
      this.#order.push(...items.map(i => i.id));
      this.#hasMore = hasMore;
      this._notify();
    } finally {
      this.#loading = false;
    }
  }
}

// === 深入：WebSocket 即時更新 ===
// 不 push 整個 item，只 push 增量更新（節省頻寬）
socket.on('post:update', ({ id, patch }) => {
  const item = feedStore.get(id);
  if (item) feedStore.update(id, { ...item, ...patch });
});</code></pre>
</section>

<section id="design-autocomplete">
  <h2>設計 Autocomplete 搜尋建議</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 需求：
// - 使用者輸入時顯示建議（&lt;100ms 感知延遲）
// - 支援鍵盤導航
// - 無障礙（ARIA）

class AutocompleteSearch extends LitElement {
  @state() _query = '';
  @state() _suggestions = [];
  @state() _selectedIndex = -1;
  @state() _open = false;
  #abortController = null;

  // 防抖 + 取消競態
  _search = debounce(async (query) => {
    if (query.length < 2) {
      this._suggestions = [];
      return;
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      // 先查本地快取
      const cached = searchCache.get(query);
      if (cached) { this._suggestions = cached; return; }

      const results = await api.get('/search/suggest', {
        params: { q: query },
        signal: this.#abortController.signal,
      });

      searchCache.set(query, results, 60000);
      this._suggestions = results;
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  }, 150);

  _onKeydown(e) {
    const { key } = e;
    if (key === 'ArrowDown') {
      e.preventDefault();
      this._selectedIndex = Math.min(this._selectedIndex + 1, this._suggestions.length - 1);
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      this._selectedIndex = Math.max(this._selectedIndex - 1, -1);
    } else if (key === 'Enter' && this._selectedIndex >= 0) {
      this._selectSuggestion(this._suggestions[this._selectedIndex]);
    } else if (key === 'Escape') {
      this._open = false;
    }
  }

  render() {
    return html\`
      &lt;div role="combobox" aria-expanded=\${this._open} aria-haspopup="listbox"&gt;
        &lt;input
          type="search"
          autocomplete="off"
          aria-autocomplete="list"
          aria-controls="suggestions-list"
          aria-activedescendant=\${this._selectedIndex >= 0
            ? \`suggestion-\${this._selectedIndex}\` : ''}
          .value=\${this._query}
          @input=\${e => { this._query = e.target.value; this._search(e.target.value); }}
          @keydown=\${this._onKeydown}
        /&gt;
        &lt;ul
          id="suggestions-list"
          role="listbox"
          ?hidden=\${!this._open || this._suggestions.length === 0}
        &gt;
          \${this._suggestions.map((item, i) => html\`
            &lt;li
              id="suggestion-\${i}"
              role="option"
              aria-selected=\${i === this._selectedIndex}
              @click=\${() => this._selectSuggestion(item)}
            &gt;\${item.text}&lt;/li&gt;
          \`)}
        &lt;/ul&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="tradeoff-discussion">
  <h2>面試中的取捨討論</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 常見的前端架構取捨問題

// Q: 你會選擇 SSR、SSG 還是 CSR？
// A: 視情況而定，需要問清楚：
//   - SEO 重要性高（電商、內容網站）→ 優先 SSR/SSG
//   - 高度動態的應用（管理後台、SaaS）→ CSR + 骨架屏
//   - 文件型內容（部落格、文件）→ SSG（最快，可 CDN 全量快取）
//   - 混合：Next.js 的 ISR（Incremental Static Regeneration）

// Q: 如何設計一個可離線使用的應用？
// 分層考慮：
const offlineStrategy = {
  // 靜態資源：Cache-First（直接從 Service Worker 快取返回）
  staticAssets: 'cache-first',

  // API 資料：Stale-While-Revalidate（先返回快取，背景更新）
  apiData: 'stale-while-revalidate',

  // 使用者操作（寫入）：Queue + Retry
  mutations: 'background-sync',
};

// Background Sync：使用者離線時的操作放入 queue，聯網後自動重試
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Q: 如何提升 10 倍以上的頁面效能？
const performanceChecklist = [
  '1. 分析瓶頸（用 Lighthouse 找出最大問題）',
  '2. Code splitting + 懶載入（減少初始 bundle size）',
  '3. Image optimization（WebP/AVIF + lazy + 正確尺寸）',
  '4. Critical CSS inlining（消除 render-blocking CSS）',
  '5. Preconnect + Preload 關鍵資源',
  '6. Service Worker 快取靜態資源',
  '7. content-visibility: auto 減少 off-screen 渲染',
  '8. 移至 CDN 邊緣節點',
];</code></pre>
</section>
  `,
};
