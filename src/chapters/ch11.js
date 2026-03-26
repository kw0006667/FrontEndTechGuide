export default {
  title: '瀏覽器渲染管線與效能度量',
  intro: '在談優化之前，你必須先理解瀏覽器是如何將你的 HTML、CSS、JavaScript 轉化為螢幕上的像素。這一章建立關於渲染效能的心智模型，讓你能精準判斷「瓶頸在哪裡」。',
  content: `
<section id="rendering-pipeline">
  <h2>渲染管線完整解析</h2>
  <p>瀏覽器將程式碼變成畫面要經過以下階段，理解每個階段的成本是效能優化的基礎：</p>

  <ol>
    <li><strong>Parse HTML → DOM Tree</strong>：解析 HTML 建立 DOM</li>
    <li><strong>Parse CSS → CSSOM</strong>：解析 CSS 建立樣式規則樹</li>
    <li><strong>Render Tree</strong>：合併 DOM + CSSOM，只包含可見節點</li>
    <li><strong>Layout（Reflow）</strong>：計算每個節點的幾何位置和大小</li>
    <li><strong>Paint</strong>：將節點繪製成像素（不包含 transform、opacity）</li>
    <li><strong>Composite</strong>：將多個 layer 合成最終畫面</li>
  </ol>

  <div class="callout callout-warning">
    <div class="callout-title">最昂貴的操作</div>
    <p>Layout（重排）是最昂貴的操作——改變影響幾何的屬性（width、height、top、left）會觸發 Layout，然後觸發 Paint 和 Composite。改變只影響繪製的屬性（color、background）只觸發 Paint 和 Composite。改變 transform 和 opacity 只觸發 Composite——最廉價。</p>
  </div>

  <h3>觸發 Layout 的屬性（避免頻繁修改）</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ 這些屬性的修改會觸發 Layout
const triggerLayoutProps = [
  'width', 'height', 'margin', 'padding', 'border',
  'position', 'top', 'left', 'right', 'bottom',
  'fontSize', 'fontFamily', 'display', 'flex', 'grid',
];

// 讀取這些屬性也會強制 Layout（forced synchronous layout）
const forceLayoutReads = [
  'offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft',
  'clientWidth', 'clientHeight', 'scrollTop', 'scrollHeight',
  'getBoundingClientRect()',
];</code></pre>
</section>

<section id="core-web-vitals">
  <h2>Core Web Vitals：LCP、INP、CLS</h2>
  <p>Google 的 Core Web Vitals 是衡量使用者體驗的三個關鍵指標。它們不只是 SEO 的考量，更反映了真實的使用者感知。</p>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>LCP（Largest Contentful Paint）</h4>
      <p>頁面中最大的可見內容何時渲染完成。目標：<strong>&lt; 2.5 秒</strong>。通常是主要圖片或標題文字。</p>
    </div>
    <div class="comparison-card">
      <h4>INP（Interaction to Next Paint）</h4>
      <p>從使用者互動到下一次畫面更新的延遲。目標：<strong>&lt; 200ms</strong>。反映互動的流暢度。</p>
    </div>
    <div class="comparison-card">
      <h4>CLS（Cumulative Layout Shift）</h4>
      <p>頁面元素發生意外位移的累計分數。目標：<strong>&lt; 0.1</strong>。讓使用者不會誤點。</p>
    </div>
  </div>

  <h3>常見的 CLS 問題和修復</h3>
  <pre data-lang="html"><code class="language-html">&lt;!-- ❌ 圖片沒有設定尺寸，載入前後會位移 --&gt;
&lt;img src="hero.jpg" alt="Hero" /&gt;

&lt;!-- ✅ 明確指定 width/height 或用 aspect-ratio --&gt;
&lt;img src="hero.jpg" alt="Hero" width="1200" height="600" /&gt;

&lt;!-- 或使用 CSS aspect-ratio --&gt;
&lt;style&gt;
  .hero-image {
    aspect-ratio: 16 / 9;
    width: 100%;
  }
&lt;/style&gt;</code></pre>
</section>

<section id="performance-api">
  <h2>Performance API 實戰</h2>
  <p>瀏覽器的 Performance API 讓你可以精確量測程式碼的執行時間，建立自訂的效能指標。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 基本用法：mark + measure
performance.mark('chapter-load-start');

await loadChapter(1);

performance.mark('chapter-load-end');
performance.measure('chapter-load', 'chapter-load-start', 'chapter-load-end');

const [measure] = performance.getEntriesByName('chapter-load');
console.log(\`章節載入耗時：\${measure.duration.toFixed(2)}ms\`);

// PerformanceObserver：持續監聽效能事件
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime);
    }
    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
      console.log('CLS contribution:', entry.value);
    }
  }
});

observer.observe({
  entryTypes: ['largest-contentful-paint', 'layout-shift', 'longtask'],
});</code></pre>

  <h3>量測 Web Component 的渲染時間</h3>
  <pre data-lang="javascript"><code class="language-javascript">class PerformanceTrackedElement extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this._renderStart = performance.now();
  }

  firstUpdated() {
    const duration = performance.now() - this._renderStart;
    performance.measure(
      \`\${this.tagName}-first-render\`,
      { start: this._renderStart, duration }
    );
    console.log(\`\${this.tagName} 首次渲染：\${duration.toFixed(2)}ms\`);
  }
}</code></pre>
</section>

<section id="raf-ric">
  <h2>requestAnimationFrame 與 requestIdleCallback</h2>
  <p>這兩個 API 讓你可以將工作排入渲染管線的特定位置，避免阻塞主執行緒。</p>

  <h3>requestAnimationFrame：在每次繪製前執行</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ✅ 動畫應該用 rAF，確保在螢幕刷新時執行
function animateProgress(element, targetWidth) {
  let currentWidth = 0;
  const step = (timestamp) => {
    currentWidth = Math.min(currentWidth + 2, targetWidth);
    element.style.width = currentWidth + '%';
    if (currentWidth < targetWidth) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

// ✅ 批量 DOM 讀取：先全部讀，再全部寫（避免 Layout Thrashing）
function batchReadWrite(elements) {
  requestAnimationFrame(() => {
    // Phase 1: 全部讀取（不觸發 Layout）
    const dimensions = elements.map(el => el.getBoundingClientRect());

    // Phase 2: 全部寫入（批量觸發一次 Layout）
    elements.forEach((el, i) => {
      el.style.height = dimensions[i].width + 'px'; // 保持正方形
    });
  });
}</code></pre>

  <h3>requestIdleCallback：在瀏覽器空閒時執行低優先級任務</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 預載下一章節（低優先級）
requestIdleCallback((deadline) => {
  // deadline.timeRemaining() 返回還剩多少空閒時間
  while (deadline.timeRemaining() > 0 && prefetchQueue.length > 0) {
    const chapterId = prefetchQueue.shift();
    prefetchChapter(chapterId);
  }
}, { timeout: 5000 }); // 最多等 5 秒，超時強制執行</code></pre>
</section>
  `,
};
