export default {
  title: '前端常用 Data Structures',
  intro: '資料結構的選擇直接影響程式碼的效能和可讀性。本章讓你能根據問題的特性，直覺地選擇最合適的資料結構。',
  content: `
<section id="array-map-set">
  <h2>Array、Map、Set 的 Time Complexity</h2>
  <p>JavaScript 開發者最常使用的三種內建資料結構，但它們的效能特性差異巨大。選錯資料結構可能讓你的程式碼從 O(1) 變成 O(n)。</p>

  <h3>常見的效能陷阱</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ Array.includes 是 O(n)
const allowedRoles = ['admin', 'editor', 'viewer'];
if (allowedRoles.includes(user.role)) { ... }

// ✅ Set.has 是 O(1)
const allowedRoles = new Set(['admin', 'editor', 'viewer']);
if (allowedRoles.has(user.role)) { ... }

// ❌ Array.findIndex 是 O(n)，重複呼叫代價高昂
const users = [...];
function getUser(id) {
  return users.find(u => u.id === id); // 每次 O(n)
}

// ✅ Map.get 是 O(1)
const userMap = new Map(users.map(u => [u.id, u]));
function getUser(id) {
  return userMap.get(id); // O(1)
}</code></pre>

  <h3>完整複雜度對照</h3>
  <table>
    <thead>
      <tr><th>操作</th><th>Array</th><th>Map</th><th>Set</th></tr>
    </thead>
    <tbody>
      <tr><td>查詢/讀取</td><td>O(1) by index</td><td>O(1) by key</td><td>O(1) has()</td></tr>
      <tr><td>搜尋</td><td>O(n)</td><td>O(1)</td><td>O(1)</td></tr>
      <tr><td>插入（末尾）</td><td>O(1) amortized</td><td>O(1)</td><td>O(1)</td></tr>
      <tr><td>插入（開頭）</td><td><strong>O(n)</strong></td><td>O(1)</td><td>O(1)</td></tr>
      <tr><td>刪除</td><td>O(n)</td><td>O(1)</td><td>O(1)</td></tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">陷阱：Array.shift() 是 O(n)</div>
    <p>在大量使用 <code>Array.shift()</code>（從陣列頭部移除）的場景，例如實作 Queue，效能會急劇下降。應改用自訂 Queue 實作或雙指針技巧。</p>
  </div>
</section>

<section id="stack-queue">
  <h2>Stack 與 Queue 的前端應用</h2>

  <h3>Stack：LIFO（Last In, First Out）</h3>
  <p>Stack 在前端的典型應用是 undo/redo 系統：</p>
  <pre data-lang="javascript"><code class="language-javascript">class UndoManager {
  #undoStack = [];
  #redoStack = [];

  execute(command) {
    command.do();
    this.#undoStack.push(command);
    this.#redoStack = []; // 執行新操作時清空 redo stack
  }

  undo() {
    const command = this.#undoStack.pop();
    if (!command) return;
    command.undo();
    this.#redoStack.push(command);
  }

  redo() {
    const command = this.#redoStack.pop();
    if (!command) return;
    command.do();
    this.#undoStack.push(command);
  }
}</code></pre>

  <h3>Queue：FIFO（First In, First Out）</h3>
  <p>Queue 在前端用於任務排隊，例如動畫序列：</p>
  <pre data-lang="javascript"><code class="language-javascript">class AnimationQueue {
  #queue = [];
  #running = false;

  enqueue(animation) {
    this.#queue.push(animation);
    if (!this.#running) this.#processNext();
  }

  async #processNext() {
    if (this.#queue.length === 0) {
      this.#running = false;
      return;
    }
    this.#running = true;
    const animation = this.#queue.shift();
    await animation.play();
    this.#processNext();
  }
}</code></pre>
</section>

<section id="tree-dom-traversal">
  <h2>Tree 結構與 DOM Traversal</h2>
  <p>DOM 本身就是一棵樹。理解樹的遍歷算法，讓你能夠更有效率地操作 DOM 和處理階層資料。</p>

  <h3>BFS vs DFS 在 DOM 操作中的選擇</h3>
  <pre data-lang="javascript"><code class="language-javascript">// DFS（深度優先）：遞迴，適合需要處理整個子樹的操作
function deepCloneWithModification(node) {
  const clone = node.cloneNode(false);
  for (const child of node.childNodes) {
    clone.appendChild(deepCloneWithModification(child));
  }
  return clone;
}

// BFS（廣度優先）：用 Queue，適合找最近的符合條件節點
function findNearestAncestor(element, selector) {
  const queue = [element.parentElement];
  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    if (current.matches(selector)) return current;
    if (current.parentElement) queue.push(current.parentElement);
  }
  return null;
}

// 找到所有 shadow DOM 中的 focusable 元素（深度遍歷）
function collectFocusable(root) {
  const focusable = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return node.tabIndex >= 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );
  while (walker.nextNode()) {
    focusable.push(walker.currentNode);
  }
  return focusable;
}</code></pre>
</section>

<section id="trie">
  <h2>Trie 在 Autocomplete 中的應用</h2>
  <p>Trie（前綴樹）是實作 autocomplete 功能的理想資料結構。它讓前綴搜尋的複雜度為 O(m)，其中 m 是搜尋字串的長度，與資料集大小無關。</p>

  <pre data-lang="javascript"><code class="language-javascript">class Trie {
  #root = { children: {}, isEnd: false, data: null };

  insert(word, data = null) {
    let node = this.#root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = { children: {}, isEnd: false, data: null };
      }
      node = node.children[char];
    }
    node.isEnd = true;
    node.data = data;
  }

  search(prefix, limit = 10) {
    let node = this.#root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    // DFS 收集所有以 prefix 開頭的單詞
    return this.#collect(node, prefix, [], limit);
  }

  #collect(node, prefix, results, limit) {
    if (results.length >= limit) return results;
    if (node.isEnd) results.push({ word: prefix, data: node.data });
    for (const [char, child] of Object.entries(node.children)) {
      this.#collect(child, prefix + char, results, limit);
    }
    return results;
  }
}

// 使用：
const trie = new Trie();
trie.insert('TypeScript', { chapter: 1 });
trie.insert('Type Narrowing', { chapter: 1 });
trie.insert('Template Literals', { chapter: 6 });

trie.search('Type');
// → [{ word: 'typescript', ... }, { word: 'type narrowing', ... }]</code></pre>
</section>

<section id="heap-priority-queue">
  <h2>Heap 與 Priority Queue</h2>
  <p>Heap 是實作 Priority Queue 的最佳資料結構，讓你能在 O(log n) 時間內插入元素並取出最高優先級的元素。</p>

  <pre data-lang="javascript"><code class="language-javascript">class MinHeap {
  #heap = [];

  push(val) {
    this.#heap.push(val);
    this.#bubbleUp(this.#heap.length - 1);
  }

  pop() {
    const min = this.#heap[0];
    const last = this.#heap.pop();
    if (this.#heap.length > 0) {
      this.#heap[0] = last;
      this.#sinkDown(0);
    }
    return min;
  }

  peek() { return this.#heap[0]; }
  get size() { return this.#heap.length; }

  #bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.#heap[parent] <= this.#heap[i]) break;
      [this.#heap[parent], this.#heap[i]] = [this.#heap[i], this.#heap[parent]];
      i = parent;
    }
  }

  #sinkDown(i) {
    const n = this.#heap.length;
    while (true) {
      let min = i;
      const left = 2 * i + 1, right = 2 * i + 2;
      if (left < n && this.#heap[left] < this.#heap[min]) min = left;
      if (right < n && this.#heap[right] < this.#heap[min]) min = right;
      if (min === i) break;
      [this.#heap[min], this.#heap[i]] = [this.#heap[i], this.#heap[min]];
      i = min;
    }
  }
}

// 前端應用：處理帶優先級的通知
const notificationQueue = new MinHeap();
notificationQueue.push({ priority: 1, msg: '系統警告', timestamp: Date.now() });
notificationQueue.push({ priority: 3, msg: '一般提示', timestamp: Date.now() });
notificationQueue.push({ priority: 1, msg: '緊急警報', timestamp: Date.now() });</code></pre>
</section>
  `,
};
