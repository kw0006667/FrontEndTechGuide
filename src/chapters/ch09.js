export default {
  title: '前端相關的演算法模式',
  intro: '演算法面試題目背後的思考模式，在真實的前端問題中其實經常出現。本章幫你建立「辨認問題模式」的能力，將真實世界問題映射到已知演算法。',
  content: `
<section id="recursion-dom">
  <h2>Recursion 與 DOM Traversal</h2>
  <p>遞迴（Recursion）是處理樹狀結構最自然的工具，而 DOM 正是一棵樹。掌握遞迴，你就掌握了深度複製、序列化、樹狀差異比對的核心。</p>

  <h3>Deep Clone（處理 Circular Reference）</h3>
  <pre data-lang="javascript"><code class="language-javascript">function deepClone(value, seen = new Map()) {
  // 基本型別直接返回
  if (value === null || typeof value !== 'object') return value;

  // 處理 circular reference
  if (seen.has(value)) return seen.get(value);

  // 處理特殊物件型別
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    value.forEach((v, k) => clone.set(deepClone(k, seen), deepClone(v, seen)));
    return clone;
  }
  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    value.forEach(v => clone.add(deepClone(v, seen)));
    return clone;
  }

  // 處理 Array 和 Object
  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, clone);
  for (const key of Reflect.ownKeys(value)) {
    clone[key] = deepClone(value[key], seen);
  }
  return clone;
}</code></pre>

  <h3>DOM 序列化為可搜尋的文字索引</h3>
  <pre data-lang="javascript"><code class="language-javascript">function extractTextContent(node, depth = 0) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.trim();
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  // 跳過 script、style 標籤
  if (['SCRIPT', 'STYLE'].includes(node.tagName)) return '';

  // 遞迴處理子節點
  return Array.from(node.childNodes)
    .map(child => extractTextContent(child, depth + 1))
    .filter(Boolean)
    .join(' ');
}</code></pre>
</section>

<section id="binary-search">
  <h2>Binary Search 的前端應用</h2>
  <p>Binary Search 不只是面試題，在 Virtual Scrolling、資料視覺化的縮放計算、時間軸定位等場景中都有實際應用。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 通用 Binary Search（找第一個滿足條件的索引）
function lowerBound(arr, target, compareFn = (a, b) => a - b) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (compareFn(arr[mid], target) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

// 前端應用：Virtual Scroll 定位可見元素
// 假設 items 已按 offsetTop 排序
function getFirstVisibleIndex(items, scrollTop) {
  return lowerBound(
    items,
    scrollTop,
    (item, target) => item.offsetTop - target
  );
}

// 前端應用：時間軸定位（在資料視覺化中找到特定時間點）
const dataPoints = [
  { time: 1000, value: 10 },
  { time: 2000, value: 20 },
  { time: 5000, value: 35 },
];

function getDataAtTime(timestamp) {
  const idx = lowerBound(dataPoints, timestamp, (p, t) => p.time - t);
  return dataPoints[idx] ?? dataPoints[dataPoints.length - 1];
}</code></pre>
</section>

<section id="sliding-window">
  <h2>Sliding Window 模式</h2>
  <p>Sliding Window 在需要「在一個序列中找符合條件的連續子序列」時特別有用。在前端，這對應到 rate limiting、日誌分析、streaming data 聚合等場景。</p>

  <pre data-lang="javascript"><code class="language-javascript">// Rate Limiter：固定時間窗口內限制請求數
class RateLimiter {
  #windowMs;
  #maxRequests;
  #requests = [];

  constructor(maxRequests = 10, windowMs = 1000) {
    this.#windowMs = windowMs;
    this.#maxRequests = maxRequests;
  }

  canRequest() {
    const now = Date.now();
    const windowStart = now - this.#windowMs;

    // 移除窗口外的記錄（sliding window）
    this.#requests = this.#requests.filter(t => t > windowStart);

    if (this.#requests.length >= this.#maxRequests) {
      return false;
    }

    this.#requests.push(now);
    return true;
  }
}

// Streaming Data 聚合：計算滑動平均
function movingAverage(data, windowSize) {
  const result = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= windowSize) {
      sum -= data[i - windowSize]; // 移出窗口的元素
    }
    if (i >= windowSize - 1) {
      result.push(sum / windowSize);
    }
  }
  return result;
}</code></pre>
</section>

<section id="dynamic-programming">
  <h2>Dynamic Programming 在 Diff 中的角色</h2>
  <p>文字 diff 演算法（用於計算兩個序列之間的差異）是 Dynamic Programming 的經典應用。它也是 Virtual DOM reconciliation 的理論基礎。</p>

  <h3>Longest Common Subsequence（LCS）</h3>
  <pre data-lang="javascript"><code class="language-javascript">// LCS — Diff 算法的核心
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// 應用：計算最小編輯操作（用於智能列表更新）
function diffLists(oldList, newList) {
  // 找出需要添加、移除、移動的元素
  const oldSet = new Map(oldList.map((item, i) => [item.id, i]));
  const newSet = new Map(newList.map((item, i) => [item.id, i]));

  const added = newList.filter(item => !oldSet.has(item.id));
  const removed = oldList.filter(item => !newSet.has(item.id));
  const moved = newList.filter(item =>
    oldSet.has(item.id) && oldSet.get(item.id) !== newSet.get(item.id)
  );

  return { added, removed, moved };
}</code></pre>
</section>

<section id="graph-algorithms">
  <h2>Graph Algorithms 的實際應用</h2>
  <p>依賴解析（dependency resolution）和元件渲染順序的計算，本質上都是圖論問題。</p>

  <h3>拓撲排序（Topological Sort）</h3>
  <pre data-lang="javascript"><code class="language-javascript">// 解析模組依賴順序（避免循環依賴）
function topologicalSort(dependencies) {
  // dependencies = { a: ['b', 'c'], b: ['c'], c: [] }
  const visited = new Set();
  const order = [];

  function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    for (const dep of (dependencies[node] || [])) {
      dfs(dep);
    }
    order.push(node); // 後序（post-order）
  }

  Object.keys(dependencies).forEach(dfs);
  return order; // ['c', 'b', 'a'] — 依賴先載入
}

// 檢測循環依賴
function hasCycle(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};

  function dfs(node) {
    color[node] = GRAY; // 正在處理
    for (const neighbor of (graph[node] || [])) {
      if (color[neighbor] === GRAY) return true; // 發現循環
      if (color[neighbor] === WHITE && dfs(neighbor)) return true;
    }
    color[node] = BLACK; // 處理完成
    return false;
  }

  return Object.keys(graph).some(node => {
    if (!color[node]) return dfs(node);
    return false;
  });
}</code></pre>
</section>
  `,
};
