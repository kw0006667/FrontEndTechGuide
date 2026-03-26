export const appendixA = {
  title: '附錄 A：瀏覽器相容性速查表',
  intro: '本附錄整理了現代前端開發中常用 API 的瀏覽器相容性，幫助你快速評估是否需要 polyfill 或漸進增強策略。',
  content: `
<section id="web-components-support">
  <h2>Web Components 相容性</h2>
  <table>
    <thead>
      <tr><th>API</th><th>Chrome</th><th>Firefox</th><th>Safari</th><th>Edge</th><th>備註</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Custom Elements v1</td>
        <td>67+</td><td>63+</td><td>10.1+</td><td>79+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>Shadow DOM v1</td>
        <td>53+</td><td>63+</td><td>10+</td><td>79+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>HTML Templates</td>
        <td>26+</td><td>22+</td><td>8+</td><td>13+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>Declarative Shadow DOM</td>
        <td>90+</td><td>123+</td><td>16.4+</td><td>90+</td>
        <td>SSR 的關鍵特性</td>
      </tr>
      <tr>
        <td>ElementInternals / Form-associated</td>
        <td>77+</td><td>93+</td><td>16.4+</td><td>79+</td>
        <td>Safari 較晚支援</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="js-api-support">
  <h2>現代 JavaScript API 相容性</h2>
  <table>
    <thead>
      <tr><th>API</th><th>Chrome</th><th>Firefox</th><th>Safari</th><th>備註</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>AbortController</td>
        <td>66+</td><td>57+</td><td>11.1+</td>
        <td>全面支援，可安全使用</td>
      </tr>
      <tr>
        <td>WeakRef / FinalizationRegistry</td>
        <td>84+</td><td>79+</td><td>14.5+</td>
        <td>現代瀏覽器均支援</td>
      </tr>
      <tr>
        <td>scheduler.yield()</td>
        <td>115+</td><td>❌</td><td>❌</td>
        <td>需要 feature detection + fallback</td>
      </tr>
      <tr>
        <td>navigator.scheduling.isInputPending</td>
        <td>87+</td><td>❌</td><td>❌</td>
        <td>Chrome 限定，需要 fallback</td>
      </tr>
      <tr>
        <td>Array.at() / Object.hasOwn()</td>
        <td>92+</td><td>90+</td><td>15.4+</td>
        <td>ES2022，現代瀏覽器均支援</td>
      </tr>
      <tr>
        <td>Top-level await</td>
        <td>89+</td><td>89+</td><td>15+</td>
        <td>ES module 中可用</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="css-support">
  <h2>現代 CSS 特性相容性</h2>
  <table>
    <thead>
      <tr><th>特性</th><th>Chrome</th><th>Firefox</th><th>Safari</th><th>備註</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>CSS Container Queries</td>
        <td>105+</td><td>110+</td><td>16+</td>
        <td>2023 年全面支援</td>
      </tr>
      <tr>
        <td>CSS Cascade Layers (@layer)</td>
        <td>99+</td><td>97+</td><td>15.4+</td>
        <td>設計系統的重要工具</td>
      </tr>
      <tr>
        <td>:has() 選擇器</td>
        <td>105+</td><td>121+</td><td>15.4+</td>
        <td>Firefox 較晚支援</td>
      </tr>
      <tr>
        <td>CSS Nesting</td>
        <td>120+</td><td>117+</td><td>17.2+</td>
        <td>2024 全面支援，原生 SCSS</td>
      </tr>
      <tr>
        <td>content-visibility</td>
        <td>85+</td><td>125+</td><td>❌</td>
        <td>Safari 尚未支援，需漸進增強</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="polyfill-strategy">
  <h2>Polyfill 策略</h2>
  <pre data-lang="javascript"><code class="language-javascript">// 漸進增強：Feature Detection 而非 Browser Detection
// ❌ Browser Detection（脆弱，UA 可偽造）
if (navigator.userAgent.includes('Chrome')) { /* ... */ }

// ✅ Feature Detection
if ('scheduler' in globalThis && 'yield' in scheduler) {
  await scheduler.yield();
} else {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// ✅ CSS Feature Detection
@supports (content-visibility: auto) {
  .section { content-visibility: auto; }
}

// Differential Loading：根據瀏覽器能力提供不同的 bundle
// &lt;script type="module" src="modern.js"&gt;&lt;/script&gt;
// &lt;script nomodule src="legacy.js"&gt;&lt;/script&gt;
// type="module" 只有支援 ESM 的瀏覽器執行
// nomodule 只有不支援 ESM 的瀏覽器執行</code></pre>
</section>
  `,
};

export const appendixB = {
  title: '附錄 B：效能優化 Checklist',
  intro: '按照這份 Checklist 逐項檢查，確保你的前端應用達到 Core Web Vitals 的目標分數。',
  content: `
<section id="loading-checklist">
  <h2>載入效能 Checklist</h2>

  <div class="callout callout-info">
    <div class="callout-title">目標指標</div>
    <p>LCP &lt; 2.5s ｜ INP &lt; 200ms ｜ CLS &lt; 0.1 ｜ FCP &lt; 1.8s ｜ TTFB &lt; 800ms</p>
  </div>

  <h3>Bundle 優化</h3>
  <pre data-lang="javascript"><code class="language-javascript">// □ 分析 bundle 大小（Rollup Analyzer / Webpack Bundle Analyzer）
// □ 實施 Code Splitting（Route-based + Component-based）
// □ Tree Shaking 正確運作（確認 sideEffects: false 在 package.json）
// □ 使用 dynamic import() 延遲非關鍵模組
// □ Vendor chunk 分離（供應商庫長期快取）
// □ 壓縮（Brotli > Gzip > 無壓縮）

// 檢查 tree shaking 是否生效
import { specificFunction } from 'large-library'; // ✅
import * as lib from 'large-library';              // ❌ 阻止 tree shaking</code></pre>

  <h3>資源載入</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- □ Critical CSS 內聯（消除 render-blocking） --&gt;
&lt;style&gt;/* above-the-fold CSS */&lt;/style&gt;
&lt;link rel="preload" href="main.css" as="style" onload="this.rel='stylesheet'"&gt;

&lt;!-- □ Hero 圖片 Preload --&gt;
&lt;link rel="preload" href="hero.webp" as="image"&gt;

&lt;!-- □ Web Font 預載 --&gt;
&lt;link rel="preconnect" href="https://fonts.googleapis.com"&gt;
&lt;link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin&gt;

&lt;!-- □ 圖片 Lazy Loading --&gt;
&lt;img loading="lazy" decoding="async" src="..." alt="..."&gt;

&lt;!-- □ 視窗外圖片使用 Lazy Loading，視窗內用 eager --&gt;
&lt;img loading="eager" fetchpriority="high" src="hero.jpg" alt="Hero"&gt;</code></pre>
</section>

<section id="runtime-checklist">
  <h2>執行期效能 Checklist</h2>

  <pre data-lang="javascript"><code class="language-javascript">// □ 使用 ResizeObserver 而非手動量測（避免 Layout Thrashing）
// □ 動畫只用 transform 和 opacity（不觸發 Layout/Paint）
// □ 長列表使用 Virtual Scrolling（&gt;500 items）
// □ 防抖/節流 scroll、resize、input 事件
// □ 避免在 render 路徑中做昂貴計算
// □ 記憶化昂貴的計算（useMemo 或 willUpdate lifecycle）

// □ Web Worker 處理 CPU 密集任務
// □ 使用 scheduler.yield() / requestIdleCallback 分散工作
// □ 無記憶體洩漏（event listener、timer、observer 都正確清理）

// 快速檢查記憶體洩漏：
// Chrome DevTools → Memory → Take Heap Snapshot
// 做一些操作後再取一次快照，比較增長</code></pre>
</section>

<section id="measurement">
  <h2>量測工具</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 生產環境量測：Web Vitals 庫
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 發送到你的分析服務
  fetch('/analytics', {
    method: 'POST',
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
      id: metric.id,
    }),
  });
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// 本地開發量測工具：
// - Chrome DevTools → Performance Panel
// - Lighthouse（CI 整合：lighthouse-ci）
// - WebPageTest（真實網路條件測試）
// - Bundlephobia（依賴大小檢查）</code></pre>
</section>
  `,
};

export const appendixC = {
  title: '附錄 C：無障礙設計 (A11y) 實踐指南',
  intro: '無障礙設計讓你的應用可以被更多人使用，包括使用螢幕閱讀器、鍵盤導航或其他輔助技術的使用者。這也是許多政府和企業網站的法律要求。',
  content: `
<section id="aria-basics">
  <h2>ARIA 基礎</h2>
  <p>ARIA（Accessible Rich Internet Applications）屬性讓螢幕閱讀器能理解動態 Web 應用的語意。</p>

  <pre data-lang="html"><code class="language-html">&lt;!-- 規則一：優先使用 HTML 語意元素 --&gt;
&lt;!-- ❌ 用 div 做按鈕 --&gt;
&lt;div onclick="..."&gt;Click me&lt;/div&gt;

&lt;!-- ✅ 用 button 元素 --&gt;
&lt;button type="button" @click="..."&gt;Click me&lt;/button&gt;

&lt;!-- 規則二：ARIA 補充語意，不替代 HTML --&gt;
&lt;!-- 描述狀態 --&gt;
&lt;button aria-expanded="true" aria-controls="dropdown-id"&gt;選單&lt;/button&gt;
&lt;ul id="dropdown-id" role="menu"&gt;...&lt;/ul&gt;

&lt;!-- 動態更新區域 --&gt;
&lt;div aria-live="polite" aria-atomic="true"&gt;
  載入完成：共 42 筆結果
&lt;/div&gt;

&lt;!-- 隱藏裝飾性圖片 --&gt;
&lt;img src="decoration.svg" alt="" role="presentation"&gt;

&lt;!-- 描述複雜互動 --&gt;
&lt;input
  type="text"
  role="combobox"
  aria-autocomplete="list"
  aria-expanded="false"
  aria-haspopup="listbox"
  aria-controls="suggestions"
&gt;</code></pre>
</section>

<section id="keyboard-navigation">
  <h2>鍵盤導航</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 所有互動元素都必須可用鍵盤操作
class AccessibleDialog extends LitElement {
  @property({ type: Boolean }) open = false;
  #focusTrap = null;
  #previousFocus = null;

  updated(changed) {
    if (changed.has('open')) {
      if (this.open) {
        // 儲存開啟前的焦點
        this.#previousFocus = document.activeElement;
        // 等 DOM 更新後，焦點移入 Dialog
        requestAnimationFrame(() => {
          this.shadowRoot.querySelector('[data-autofocus]')?.focus();
          this.#setupFocusTrap();
        });
      } else {
        // 關閉時，焦點回到開啟前的元素
        this.#previousFocus?.focus();
        this.#focusTrap = null;
      }
    }
  }

  #setupFocusTrap() {
    const focusable = this.shadowRoot.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    this.shadowRoot.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  render() {
    return html\`
      &lt;div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ?hidden=\${!this.open}
      &gt;
        &lt;h2 id="dialog-title"&gt;&lt;slot name="title"&gt;&lt;/slot&gt;&lt;/h2&gt;
        &lt;slot&gt;&lt;/slot&gt;
        &lt;button
          data-autofocus
          @click=\${() => { this.open = false; }}
          aria-label="關閉對話框"
        &gt;×&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}</code></pre>
</section>

<section id="color-contrast">
  <h2>顏色對比與視覺設計</h2>

  <pre data-lang="css"><code class="language-css">/* WCAG 2.1 對比度要求 */
/* AA 等級（最低要求）：
   - 正文文字（&lt;18pt）：4.5:1
   - 大文字（18pt+）：3:1
   - UI 元件和圖形：3:1 */

/* 使用 CSS Custom Properties 確保對比度 */
:root {
  --text-primary: #111827;       /* 對白底：21:1 ✅ */
  --text-secondary: #6B7280;     /* 對白底：4.6:1 ✅ */
  --text-disabled: #9CA3AF;      /* 對白底：2.9:1 - 只用於 disabled 狀態 */
  --color-accent: #4A7EAD;       /* 對白底：3.5:1 ✅（大文字） */
}

/* 不要只用顏色傳達資訊 */
/* ❌ 只用紅色表示錯誤 */
.error { color: red; }

/* ✅ 顏色 + 圖示 + 文字 */
.error::before { content: "⚠ "; }
.error {
  color: #DC2626;
  font-weight: 600;
}

/* 聚焦樣式：永遠不要移除 outline，只能美化它 */
/* ❌ */
*:focus { outline: none; }

/* ✅ */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}</code></pre>
</section>
  `,
};

export const appendixD = {
  title: '附錄 D：推薦學習資源',
  intro: '精選的學習資源——書籍、文章、規範文件、工具——幫助你繼續深化每個章節的知識。',
  content: `
<section id="books">
  <h2>推薦書籍</h2>
  <table>
    <thead>
      <tr><th>書名</th><th>適合層次</th><th>重點內容</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><em>JavaScript: The Good Parts</em> — Douglas Crockford</td>
        <td>Mid</td>
        <td>JavaScript 語言核心精華</td>
      </tr>
      <tr>
        <td><em>You Don't Know JS</em> — Kyle Simpson</td>
        <td>Mid → Senior</td>
        <td>深入理解 JS 機制：作用域、閉包、原型</td>
      </tr>
      <tr>
        <td><em>Designing Data-Intensive Applications</em> — Martin Kleppmann</td>
        <td>Senior → Staff</td>
        <td>分散式系統的思考框架（後端視角，但前端必讀）</td>
      </tr>
      <tr>
        <td><em>A Philosophy of Software Design</em> — John Ousterhout</td>
        <td>Senior</td>
        <td>如何設計低複雜度的系統</td>
      </tr>
      <tr>
        <td><em>The Staff Engineer's Path</em> — Tanya Reilly</td>
        <td>Senior → Staff</td>
        <td>如何成為有組織影響力的工程師</td>
      </tr>
    </tbody>
  </table>
</section>

<section id="specifications">
  <h2>規範文件</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 理解「為什麼」的最佳來源是規範本身
const specifications = {
  webComponents: 'https://html.spec.whatwg.org/multipage/custom-elements.html',
  shadowDOM: 'https://dom.spec.whatwg.org/#shadow-trees',
  css: 'https://www.w3.org/TR/CSS/',
  accessibility: 'https://www.w3.org/TR/WCAG21/',
  performanceAPI: 'https://w3c.github.io/performance-timeline/',
  webVitals: 'https://web.dev/vitals/',
};

// 好的技術部落格
const blogs = [
  'web.dev — Google Chrome 團隊的最新 Web 平台文章',
  'developer.mozilla.org — MDN，最權威的 Web API 文件',
  'webkit.org/blog — Safari 最新特性',
  'hacks.mozilla.org — Firefox 工程師的深度文章',
  'adactio.com — Jeremy Keith 的漸進增強哲學',
  'csswizardry.com — Harry Roberts 的 CSS 效能',
];</code></pre>
</section>

<section id="tools">
  <h2>必備工具</h2>
  <table>
    <thead>
      <tr><th>工具</th><th>用途</th></tr>
    </thead>
    <tbody>
      <tr><td>Chrome DevTools Performance Panel</td><td>分析執行期效能瓶頸</td></tr>
      <tr><td>Lighthouse</td><td>綜合評分（效能、SEO、A11y）</td></tr>
      <tr><td>WebPageTest</td><td>真實網路條件下的載入分析</td></tr>
      <tr><td>Bundlephobia</td><td>檢查 npm 套件的大小影響</td></tr>
      <tr><td>axe DevTools</td><td>無障礙問題自動檢測</td></tr>
      <tr><td>WAVE</td><td>視覺化無障礙問題</td></tr>
      <tr><td>CSS Cascade Visualizer</td><td>理解 CSS specificity</td></tr>
      <tr><td>Polypane</td><td>同時在多個視窗大小預覽</td></tr>
    </tbody>
  </table>
</section>

<section id="communities">
  <h2>社群與持續學習</h2>
  <pre data-lang="javascript"><code class="language-javascript">// 保持技術敏感度的方法
const learningChannels = {
  newsletters: [
    'JavaScript Weekly',
    'Frontend Focus',
    'Web Platform Weekly',
    'bytes.dev',
  ],

  podcasts: [
    'Syntax.fm — 實用的前端開發',
    'JS Party — JavaScript 社群新聞',
    'ShopTalk Show — 網頁設計與開發',
  ],

  communities: [
    'GitHub — Follow 你使用的工具的倉庫',
    'Twitter/X — 關注 spec 編輯者和框架作者',
    'Discord — Lit、Vite、Vitest 等社群',
  ],

  contribution: [
    '提交 bug report（比使用者多一步：附上 reproduction）',
    '貢獻文件改進（最容易的開源貢獻起點）',
    '寫技術文章分享你的學習（教學相長）',
  ],
};</code></pre>
</section>
  `,
};
