export default {
  title: '渲染效能優化',
  intro: '本章聚焦在減少不必要的渲染工作，讓 UI 保持 60fps 的流暢度。讀完後你應該能辨識常見的渲染瓶頸並知道如何修復。',
  content: `
<section id="layout-thrashing">
  <h2>Layout Thrashing 的成因與避免</h2>
  <p>Layout Thrashing（強制同步佈局）發生在你在同一幀中交替讀取和寫入影響佈局的屬性時。瀏覽器為了返回正確的讀取值，必須強制執行 Layout，然後在下一次寫入時再次計算。</p>

  <h3>問題示範</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ Layout Thrashing：每次迭代都強制觸發 Layout
const items = document.querySelectorAll('.item');
items.forEach((item) => {
  const height = item.offsetHeight; // 讀取（強制 Layout）
  item.style.height = height * 2 + 'px'; // 寫入（使 Layout 失效）
  // 下一個 item.offsetHeight 又強制 Layout...
});

// ✅ 修復：分離讀取和寫入
const heights = Array.from(items).map(item => item.offsetHeight); // 全部讀取
items.forEach((item, i) => {
  item.style.height = heights[i] * 2 + 'px'; // 全部寫入
});

// ✅ 更好：使用 ResizeObserver 而非手動量測
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    // 在 ResizeObserver callback 中修改 DOM 不會觸發 Layout Thrashing
    entry.target.style.setProperty('--aspect-ratio', width / height);
  }
});
ro.observe(element);</code></pre>
</section>

<section id="css-containment">
  <h2>CSS Containment 限制重算範圍</h2>
  <p><code>contain</code> 屬性告訴瀏覽器這個元素的子樹是獨立的，外部的變化不會影響它的內部，反之亦然。這可以顯著減少 Layout 和 Paint 的範圍。</p>

  <pre data-lang="css"><code class="language-css">/* contain: layout — 元件內部的 layout 不影響外部 */
.card-list-item {
  contain: layout;
}

/* contain: paint — 超出邊界的內容不被繪製 */
.overflow-hidden-widget {
  contain: paint;
}

/* contain: strict — 最強的包含（=size+layout+paint+style） */
.isolated-widget {
  contain: strict;
  width: 300px;
  height: 200px;
}

/* content-visibility: auto — 瀏覽器跳過 off-screen 元素的渲染 */
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* 告知預估大小，防止 scroll 跳動 */
}</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">實際效果</div>
    <p>在一個有 1000 個 card 的長列表中，加入 <code>contain: layout paint</code> 可以讓更新單一 card 的效能提升 10x 以上，因為瀏覽器不再需要重新計算整個頁面。</p>
  </div>
</section>

<section id="gpu-compositing">
  <h2>GPU Compositing 與 will-change</h2>
  <p>將元素提升到獨立的 Compositor Layer，讓動畫可以完全在 GPU 上執行，不影響主執行緒。</p>

  <pre data-lang="css"><code class="language-css">/* ✅ 觸發 GPU Layer 的方法 */
.animated-element {
  /* transform 和 opacity 的動畫在 GPU layer 上執行 */
  transform: translateZ(0); /* 強制提升 layer */
  /* 或 */
  will-change: transform, opacity; /* 提示瀏覽器預先準備 */
}

/* ❌ 避免過度使用 will-change */
/* will-change 佔用 GPU 記憶體，只在真正需要動畫的元素上使用 */
* {
  will-change: transform; /* 永遠不要這樣做！ */
}

/* ✅ 動畫結束後移除 will-change */
.animation-target {
  will-change: transform;
  animation: slideIn 300ms ease-out forwards;
}
.animation-target.done {
  will-change: auto; /* 釋放 GPU 資源 */
}</code></pre>

  <h3>高效能 Slide-In 動畫</h3>
  <pre data-lang="css"><code class="language-css">/* ✅ 使用 transform 而非 top/left */
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

/* ❌ 這樣會觸發 Layout 和 Paint */
@keyframes slideInBad {
  from { left: -100%; opacity: 0; }
  to   { left: 0;     opacity: 1; }
}</code></pre>
</section>

<section id="virtual-scrolling">
  <h2>Virtual Scrolling 完整實作</h2>
  <p>當列表項目達到數千個時，一次性渲染所有 DOM 節點會嚴重影響效能。Virtual Scrolling 只渲染可見範圍內的節點。</p>

  <pre data-lang="javascript"><code class="language-javascript">class VirtualList extends LitElement {
  static styles = css\`
    :host { display: block; overflow-y: auto; position: relative; }
    .virtual-spacer { width: 100%; }
    .virtual-items { position: absolute; left: 0; right: 0; }
  \`;

  @property({ attribute: false }) items = [];
  @property({ type: Number }) itemHeight = 60;

  @state() _scrollTop = 0;
  @state() _containerHeight = 0;

  get _visibleCount() {
    return Math.ceil(this._containerHeight / this.itemHeight) + 2; // 緩衝
  }

  get _startIndex() {
    return Math.max(0, Math.floor(this._scrollTop / this.itemHeight) - 1);
  }

  get _endIndex() {
    return Math.min(this.items.length, this._startIndex + this._visibleCount);
  }

  render() {
    const totalHeight = this.items.length * this.itemHeight;
    const offsetY = this._startIndex * this.itemHeight;
    const visibleItems = this.items.slice(this._startIndex, this._endIndex);

    return html\`
      &lt;div class="virtual-spacer" style="height: \${totalHeight}px"&gt;&lt;/div&gt;
      &lt;div
        class="virtual-items"
        style="transform: translateY(\${offsetY}px)"
      &gt;
        \${visibleItems.map((item, i) =&gt; html\`
          &lt;div class="item" style="height: \${this.itemHeight}px"&gt;
            \${this.renderItem(item, this._startIndex + i)}
          &lt;/div&gt;
        \`)}
      &lt;/div&gt;
    \`;
  }

  connectedCallback() {
    super.connectedCallback();
    this._ro = new ResizeObserver(([entry]) =&gt; {
      this._containerHeight = entry.contentRect.height;
    });
    this._ro.observe(this);
    this.addEventListener('scroll', this._onScroll, { passive: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro.disconnect();
    this.removeEventListener('scroll', this._onScroll);
  }

  _onScroll = () => {
    this._scrollTop = this.scrollTop;
  };

  renderItem(item, index) {
    return html\`\${item.label}\`; // 子類覆蓋此方法
  }
}</code></pre>
</section>

<section id="content-visibility">
  <h2>content-visibility 優化</h2>
  <p><code>content-visibility: auto</code> 是一個強大的 CSS 屬性，讓瀏覽器可以跳過 off-screen 元素的渲染工作，效果類似 Virtual Scrolling 但完全由 CSS 控制。</p>

  <pre data-lang="css"><code class="language-css">/* 長文章分段，每段使用 content-visibility */
.article-section {
  content-visibility: auto;
  /*
    告訴瀏覽器這個元素大約高多少
    防止使用者快速滾動時 scrollbar 跳動
  */
  contain-intrinsic-size: 0 800px;
}

/* 在 Web Components 中使用 */
app-chapter-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 1200px;
}</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">實測效果</div>
    <p>在一個有 50 個長段落的頁面中，加入 <code>content-visibility: auto</code> 可以將初始渲染時間減少 70%，因為瀏覽器只需要渲染視窗可見的部分。</p>
  </div>
</section>
  `,
};
