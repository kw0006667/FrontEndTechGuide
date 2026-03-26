export default {
  title: '測試策略與實踐',
  intro: '好的測試策略不是「測試越多越好」，而是「在正確的層次測正確的事」。本章介紹前端測試的金字塔模型，以及如何測試 Web Components。',
  content: `
<section id="testing-pyramid">
  <h2>前端測試金字塔</h2>
  <p>測試金字塔描述了不同類型測試的數量比例。從下到上：單元測試（多）→ 整合測試（中）→ E2E 測試（少）。每一層的成本和可靠性都不同。</p>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>單元測試 (Unit)</h4>
      <p>測試獨立的函式、類別、或模組。快速、穩定、易除錯。</p>
      <p><strong>適合：</strong>純函式、工具函式、狀態管理邏輯</p>
    </div>
    <div class="comparison-card">
      <h4>整合測試 (Integration)</h4>
      <p>測試多個模組協作。測試元件與 DOM 的互動。</p>
      <p><strong>適合：</strong>Web Components、API 整合、路由行為</p>
    </div>
    <div class="comparison-card">
      <h4>E2E 測試 (End-to-End)</h4>
      <p>在真實瀏覽器中測試完整使用者流程。慢但最真實。</p>
      <p><strong>適合：</strong>關鍵購買流程、登入/登出、結帳</p>
    </div>
  </div>

  <div class="callout callout-tip">
    <div class="callout-title">測試比例建議</div>
    <p>70% 單元測試 + 20% 整合測試 + 10% E2E 測試。E2E 測試雖然最真實，但執行慢、維護成本高，不應作為主力。</p>
  </div>
</section>

<section id="unit-testing">
  <h2>單元測試：純函式與狀態邏輯</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 使用 Vitest（Vite 原生測試框架）
import { describe, it, expect, vi } from 'vitest';
import { todoReducer } from './store.js';
import { formatDate, debounce } from './utils.js';

// 測試 Reducer（純函式）
describe('todoReducer', () => {
  const initialState = { items: [] };

  it('should add item with ADD_ITEM action', () => {
    const action = { type: 'ADD_ITEM', payload: { id: 1, text: 'Test', done: false } };
    const nextState = todoReducer(initialState, action);

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].text).toBe('Test');
    // 確認 immutability
    expect(nextState).not.toBe(initialState);
  });

  it('should toggle item with TOGGLE_ITEM action', () => {
    const state = { items: [{ id: 1, text: 'Test', done: false }] };
    const nextState = todoReducer(state, { type: 'TOGGLE_ITEM', payload: 1 });

    expect(nextState.items[0].done).toBe(true);
  });

  it('should return same state for unknown action', () => {
    const state = { items: [] };
    const nextState = todoReducer(state, { type: 'UNKNOWN' });
    expect(nextState).toBe(state); // 同一個 reference
  });
});

// 測試含副作用的函式（使用 vi.spyOn mock）
describe('debounce', () => {
  it('should only call fn once within delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});</code></pre>
</section>

<section id="component-testing">
  <h2>Web Component 整合測試</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 使用 @web/test-runner + @open-wc/testing
import { fixture, html, expect } from '@open-wc/testing';
import './my-counter.js';

describe('MyCounter', () => {
  it('renders with default count of 0', async () => {
    const el = await fixture(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    // 使用 shadowRoot 查詢（如果用 Shadow DOM）
    const display = el.shadowRoot.querySelector('.count');
    expect(display.textContent).to.equal('0');
  });

  it('increments count on button click', async () => {
    const el = await fixture(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    const button = el.shadowRoot.querySelector('[data-action="increment"]');
    button.click();
    await el.updateComplete; // 等待 Lit 更新完成

    const display = el.shadowRoot.querySelector('.count');
    expect(display.textContent).to.equal('1');
  });

  it('respects initial count property', async () => {
    const el = await fixture(html\`&lt;my-counter .count=\${5}&gt;&lt;/my-counter&gt;\`);
    const display = el.shadowRoot.querySelector('.count');
    expect(display.textContent).to.equal('5');
  });

  it('dispatches count-changed event', async () => {
    const el = await fixture(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);

    let eventDetail;
    el.addEventListener('count-changed', (e) => { eventDetail = e.detail; });

    el.shadowRoot.querySelector('[data-action="increment"]').click();
    await el.updateComplete;

    expect(eventDetail).to.deep.equal({ count: 1 });
  });

  it('is accessible', async () => {
    const el = await fixture(html\`&lt;my-counter&gt;&lt;/my-counter&gt;\`);
    await expect(el).to.be.accessible(); // axe-core 自動檢查
  });
});</code></pre>
</section>

<section id="e2e-testing">
  <h2>E2E 測試：Playwright</h2>

  <pre data-lang="javascript"><code class="language-javascript">// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});

// e2e/todo.spec.js
import { test, expect } from '@playwright/test';

test.describe('Todo App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can add and complete a todo', async ({ page }) => {
    // 輸入新 todo
    await page.fill('[data-testid="todo-input"]', 'Buy milk');
    await page.keyboard.press('Enter');

    // 驗證 todo 出現
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: 'Buy milk' });
    await expect(todoItem).toBeVisible();

    // 點擊 checkbox 完成
    await todoItem.locator('input[type="checkbox"]').click();
    await expect(todoItem).toHaveClass(/done/);
  });

  test('persists todos after page refresh', async ({ page }) => {
    await page.fill('[data-testid="todo-input"]', 'Persistent item');
    await page.keyboard.press('Enter');

    await page.reload();

    await expect(page.locator('[data-testid="todo-item"]')).toContainText('Persistent item');
  });

  // 視覺回歸測試
  test('matches snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('todo-home.png', { maxDiffPixels: 100 });
  });
});</code></pre>
</section>

<section id="testing-principles">
  <h2>測試的核心原則</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 原則 1：測試行為，而非實作細節
// ❌ 測試內部狀態（脆弱）
expect(el._internalCounter).toBe(1);

// ✅ 測試使用者可見的結果（穩健）
expect(el.shadowRoot.querySelector('.count').textContent).toBe('1');

// 原則 2：一個測試只測一件事
// ❌ 一個測試驗證太多行為
it('works', async () => {
  el.click();
  expect(el.count).toBe(1);
  expect(el.shadowRoot.querySelector('.count').textContent).toBe('1');
  expect(eventFired).toBe(true);
  expect(el.getAttribute('aria-label')).toBe('Count: 1');
});

// ✅ 分開測試
it('increments internal count on click', ...);
it('updates displayed text on click', ...);
it('fires count-changed event on click', ...);
it('updates aria-label on click', ...);

// 原則 3：使用 data-testid 而非 CSS class 選取測試元素
// ❌ 選取 CSS class（可能因 UI 重構而改變）
page.locator('.btn-primary.submit-btn');

// ✅ 使用 data-testid（與 UI 樣式解耦）
page.locator('[data-testid="submit-button"]');</code></pre>
</section>
  `,
};
