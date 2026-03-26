export default {
  title: '非同步程式設計的模式與陷阱',
  intro: '非同步操作是前端開發的核心，但也是最容易出錯的地方。本章幫助你辨識和處理各種非同步場景中的陷阱，包括 race condition、memory leak、以及錯誤的 error handling。',
  content: `
<section id="promise-internals">
  <h2>Promise 的內部機制</h2>
  <p>Promise 是一個代表「未來值」的容器，它有三種狀態：<code>pending</code>、<code>fulfilled</code>、<code>rejected</code>。理解狀態轉換和鏈式呼叫的機制，是避免非同步 bug 的基礎。</p>

  <h3>Promise.all vs Promise.allSettled 的 UX 差異</h3>
  <pre data-lang="javascript"><code class="language-javascript">// Promise.all：只要一個失敗就整體失敗
// 適用：所有請求都必須成功才能繼續（例如頁面初始化資料）
try {
  const [user, config, permissions] = await Promise.all([
    fetchUser(),
    fetchConfig(),
    fetchPermissions(),
  ]);
  // 三個都成功才到這裡
} catch (error) {
  // 任一失敗都會進這裡，難以知道是哪個失敗
  showError('頁面載入失敗');
}

// Promise.allSettled：等待所有完成，不管成功或失敗
// 適用：獨立請求，部分失敗仍可顯示其他內容
const results = await Promise.allSettled([
  fetchUserPosts(),
  fetchUserPhotos(),
  fetchUserFriends(),
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    renderSection(index, result.value);
  } else {
    renderErrorSection(index, result.reason);
  }
});</code></pre>

  <div class="callout callout-info">
    <div class="callout-title">選擇指南</div>
    <p>用 <code>Promise.all</code> 當所有資料都必須到位才能渲染。用 <code>Promise.allSettled</code> 當你想要「盡力顯示」的 UX——部分失敗仍然可以顯示成功的部分。</p>
  </div>
</section>

<section id="async-await-antipatterns">
  <h2>async/await 常見反模式</h2>

  <h3>不必要的 Sequential await</h3>
  <pre data-lang="javascript"><code class="language-javascript">// ❌ 反模式：序列執行，浪費時間（總耗時 = A + B + C）
async function loadDashboard() {
  const user = await fetchUser();      // 300ms
  const stats = await fetchStats();    // 500ms
  const config = await fetchConfig();  // 200ms
  // 總計：1000ms
}

// ✅ 正確：並行執行（總耗時 = max(A, B, C)）
async function loadDashboard() {
  const [user, stats, config] = await Promise.all([
    fetchUser(),    // 300ms ┐
    fetchStats(),   // 500ms ├─ 並行
    fetchConfig(),  // 200ms ┘
  ]);
  // 總計：500ms
}</code></pre>

  <h3>在迴圈中使用 await</h3>
  <pre data-lang="javascript"><code class="language-javascript">const userIds = [1, 2, 3, 4, 5];

// ❌ 反模式：逐一等待
for (const id of userIds) {
  const user = await fetchUser(id); // 每次等待前一個完成
  process(user);
}

// ✅ 正確：並行處理所有請求
const users = await Promise.all(userIds.map((id) => fetchUser(id)));
users.forEach(process);

// ✅ 如果需要限制並行數量，使用 chunk
const BATCH_SIZE = 3;
for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
  const batch = userIds.slice(i, i + BATCH_SIZE);
  const users = await Promise.all(batch.map((id) => fetchUser(id)));
  users.forEach(process);
}</code></pre>
</section>

<section id="abort-controller">
  <h2>AbortController 統一取消機制</h2>
  <p><code>AbortController</code> 是現代前端最重要的工具之一。它提供了一個統一的機制來取消非同步操作，解決了 race condition 和資源洩漏問題。</p>

  <h3>基本用法</h3>
  <pre data-lang="javascript"><code class="language-javascript">class SearchComponent {
  #abortController = null;

  async search(query) {
    // 取消上一次尚未完成的搜尋
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(\`/api/search?q=\${query}\`, {
        signal: this.#abortController.signal,
      });
      const data = await response.json();
      this.displayResults(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        // 請求被取消，忽略
        return;
      }
      this.displayError(error);
    }
  }

  destroy() {
    // 元件銷毀時取消所有進行中的請求
    this.#abortController?.abort();
  }
}</code></pre>

  <h3>在 Lit Component 中的最佳實踐</h3>
  <pre data-lang="javascript"><code class="language-javascript">class SearchElement extends LitElement {
  #controller = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller?.abort(); // 元件卸載時自動清理
  }

  async _performSearch(query) {
    this.#controller?.abort();
    this.#controller = new AbortController();

    this.loading = true;
    try {
      const data = await this._fetchWithSignal(query, this.#controller.signal);
      this.results = data;
    } catch (e) {
      if (e.name !== 'AbortError') this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}</code></pre>
</section>

<section id="async-iterator-streaming">
  <h2>AsyncIterator 與 Streaming Data</h2>
  <p>隨著 GenAI 的普及，前端需要處理 streaming response——伺服器持續推送資料，前端逐步顯示。<code>ReadableStream</code> 和 <code>AsyncIterator</code> 是處理這類場景的利器。</p>

  <h3>處理 Server-Sent Events 逐字串流</h3>
  <pre data-lang="javascript"><code class="language-javascript">async function streamAIResponse(prompt, onChunk) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // 解析 SSE 格式
      const lines = chunk.split('\\n').filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onChunk(data.text);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// 在 Lit Component 中使用
class AIChat extends LitElement {
  @state() streamedText = '';

  async _askQuestion(question) {
    this.streamedText = '';
    await streamAIResponse(question, (chunk) => {
      this.streamedText += chunk; // Lit 自動批量更新 UI
    });
  }
}</code></pre>

  <h3>使用 AsyncIterator 的更優雅寫法</h3>
  <pre data-lang="javascript"><code class="language-javascript">async function* streamResponse(prompt) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

// 使用方：語意清晰
for await (const chunk of streamResponse(question)) {
  this.streamedText += chunk;
}</code></pre>
</section>
  `,
};
