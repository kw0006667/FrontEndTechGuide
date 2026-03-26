export const parts = [
  { id: 1, title: 'Part I：語言基礎的深層理解', chapters: [1, 2, 3] },
  { id: 2, title: 'Part II：Web Components 與 Shadow DOM', chapters: [4, 5, 6, 7] },
  { id: 3, title: 'Part III：Data Structures、Algorithms 與問題解決', chapters: [8, 9, 10] },
  { id: 4, title: 'Part IV：Performance Optimization', chapters: [11, 12, 13, 14] },
  { id: 5, title: 'Part V：應用層的架構與實作', chapters: [15, 16, 17] },
  { id: 6, title: 'Part VI：品質保障與工程實踐', chapters: [18, 19, 20] },
  { id: 7, title: 'Part VII：設計系統與工程規模化', chapters: [21, 22] },
  { id: 8, title: 'Part VIII：面試實戰', chapters: [23, 24] },
  { id: 9, title: '附錄', chapters: ['appA', 'appB', 'appC', 'appD'] },
];

export const chapters = [
  {
    id: 1,
    slug: 'chapter-1',
    title: 'TypeScript 型別系統的工程價值',
    part: 1,
    sections: [
      { slug: 'type-narrowing', title: 'Type Narrowing 與 Discriminated Unions' },
      { slug: 'generics', title: 'Generics：可重用的型別安全工具' },
      { slug: 'conditional-types', title: 'Conditional Types 與 Template Literal Types' },
      { slug: 'mapped-types', title: 'Mapped Types 自動衍生型別' },
      { slug: 'practical-examples', title: '實戰：型別安全的 API 設計' },
    ],
  },
  {
    id: 2,
    slug: 'chapter-2',
    title: 'JavaScript Runtime 的運作機制',
    part: 1,
    sections: [
      { slug: 'event-loop', title: 'Event Loop 完整模型' },
      { slug: 'macrotask-microtask', title: 'Macrotask 與 Microtask 排程' },
      { slug: 'closure-memory', title: 'Closure 的記憶體模型' },
      { slug: 'prototype-this', title: 'Prototype Chain 與 this 綁定' },
      { slug: 'class-based-wc', title: 'Web Components 中的 this 行為' },
    ],
  },
  {
    id: 3,
    slug: 'chapter-3',
    title: '非同步程式設計的模式與陷阱',
    part: 1,
    sections: [
      { slug: 'promise-internals', title: 'Promise 的內部機制' },
      { slug: 'async-await-antipatterns', title: 'async/await 常見反模式' },
      { slug: 'abort-controller', title: 'AbortController 統一取消機制' },
      { slug: 'async-iterator-streaming', title: 'AsyncIterator 與 Streaming Data' },
    ],
  },
  {
    id: 4,
    slug: 'chapter-4',
    title: 'Web Components 的設計哲學',
    part: 2,
    sections: [
      { slug: 'web-standards', title: 'Web Standards 的角度' },
      { slug: 'four-pillars', title: '四大基礎技術' },
      { slug: 'advantages-disadvantages', title: '優勢與劣勢的誠實評估' },
      { slug: 'when-to-choose', title: '何時選擇 Web Components' },
    ],
  },
  {
    id: 5,
    slug: 'chapter-5',
    title: 'Shadow DOM 深入解析',
    part: 2,
    sections: [
      { slug: 'tree-structure', title: 'Light DOM、Shadow DOM 與 Composed Tree' },
      { slug: 'css-encapsulation', title: 'CSS 封裝機制' },
      { slug: 'css-penetration', title: 'CSS 穿透策略' },
      { slug: 'event-behavior', title: 'Shadow DOM 中的事件行為' },
      { slug: 'slots-mechanism', title: 'Slots 的運作機制' },
    ],
  },
  {
    id: 6,
    slug: 'chapter-6',
    title: 'Lit Framework 實戰指南',
    part: 2,
    sections: [
      { slug: 'reactive-properties', title: 'Reactive Property 系統' },
      { slug: 'update-lifecycle', title: 'Lit 的 Update Lifecycle' },
      { slug: 'template-system', title: 'Template System 深入解析' },
      { slug: 'directives', title: '常用 Directives' },
      { slug: 'reactive-controllers', title: 'Reactive Controllers' },
    ],
  },
  {
    id: 7,
    slug: 'chapter-7',
    title: 'Web Component 的 API 設計原則',
    part: 2,
    sections: [
      { slug: 'property-attribute-design', title: 'Property 與 Attribute 設計' },
      { slug: 'event-design', title: 'Event 設計慣例' },
      { slug: 'slot-design', title: 'Slot 設計策略' },
      { slug: 'theming-api', title: 'CSS Custom Properties 作為 Theming API' },
      { slug: 'form-associated', title: 'Form-associated Custom Elements' },
      { slug: 'custom-elements-manifest', title: 'Custom Elements Manifest' },
    ],
  },
  {
    id: 8,
    slug: 'chapter-8',
    title: '前端常用 Data Structures',
    part: 3,
    sections: [
      { slug: 'array-map-set', title: 'Array、Map、Set 的 Time Complexity' },
      { slug: 'stack-queue', title: 'Stack 與 Queue 的前端應用' },
      { slug: 'tree-dom-traversal', title: 'Tree 結構與 DOM Traversal' },
      { slug: 'trie', title: 'Trie 在 Autocomplete 中的應用' },
      { slug: 'heap-priority-queue', title: 'Heap 與 Priority Queue' },
    ],
  },
  {
    id: 9,
    slug: 'chapter-9',
    title: '前端相關的演算法模式',
    part: 3,
    sections: [
      { slug: 'recursion-dom', title: 'Recursion 與 DOM Traversal' },
      { slug: 'binary-search', title: 'Binary Search 的前端應用' },
      { slug: 'sliding-window', title: 'Sliding Window 模式' },
      { slug: 'dynamic-programming', title: 'Dynamic Programming 在 Diff 中的角色' },
      { slug: 'graph-algorithms', title: 'Graph Algorithms 的實際應用' },
    ],
  },
  {
    id: 10,
    slug: 'chapter-10',
    title: '實作經典前端工具函式',
    part: 3,
    sections: [
      { slug: 'debounce-throttle', title: 'debounce 與 throttle 完整實作' },
      { slug: 'promise-implementations', title: 'Promise.all、race、allSettled 實作' },
      { slug: 'array-polyfills', title: 'Array 方法 Polyfill' },
      { slug: 'deep-clone', title: 'deepClone 的正確實作' },
      { slug: 'curry-flatten', title: 'curry 與 flatten' },
      { slug: 'event-emitter', title: 'EventEmitter 實作' },
    ],
  },
  {
    id: 11,
    slug: 'chapter-11',
    title: '瀏覽器渲染管線與效能度量',
    part: 4,
    sections: [
      { slug: 'rendering-pipeline', title: '渲染管線完整解析' },
      { slug: 'core-web-vitals', title: 'Core Web Vitals：LCP、INP、CLS' },
      { slug: 'performance-api', title: 'Performance API 實戰' },
      { slug: 'raf-ric', title: 'requestAnimationFrame 與 requestIdleCallback' },
    ],
  },
  {
    id: 12,
    slug: 'chapter-12',
    title: '渲染效能優化',
    part: 4,
    sections: [
      { slug: 'layout-thrashing', title: 'Layout Thrashing 的成因與避免' },
      { slug: 'css-containment', title: 'CSS Containment 限制重算範圍' },
      { slug: 'gpu-compositing', title: 'GPU Compositing 與 will-change' },
      { slug: 'virtual-scrolling', title: 'Virtual Scrolling 完整實作' },
      { slug: 'content-visibility', title: 'content-visibility 優化' },
    ],
  },
  {
    id: 13,
    slug: 'chapter-13',
    title: 'JavaScript 執行效能與記憶體管理',
    part: 4,
    sections: [
      { slug: 'web-workers', title: 'Web Workers 使用模式' },
      { slug: 'task-scheduling', title: 'Task Scheduling 與 scheduler.yield()' },
      { slug: 'memory-leaks', title: '記憶體洩漏的常見來源' },
      { slug: 'weakref-finalization', title: 'WeakRef 與 FinalizationRegistry' },
      { slug: 'abort-controller-cleanup', title: 'AbortController 資源清理策略' },
    ],
  },
  {
    id: 14,
    slug: 'chapter-14',
    title: '網路效能與資源載入策略',
    part: 4,
    sections: [
      { slug: 'code-splitting', title: 'Code Splitting 與 Lazy Loading' },
      { slug: 'resource-hints', title: 'Resource Hints 適用場景' },
      { slug: 'service-worker', title: 'Service Worker 離線快取' },
      { slug: 'http-caching', title: 'HTTP Caching 策略選擇' },
      { slug: 'image-optimization', title: 'Image Optimization' },
    ],
  },
  {
    id: 15,
    slug: 'chapter-15',
    title: '狀態管理的模式與策略',
    part: 5,
    sections: [
      { slug: 'component-state', title: '元件內部狀態' },
      { slug: 'props-events', title: 'Props Down / Events Up' },
      { slug: 'context-protocol', title: 'Context Protocol 跨層級傳遞' },
      { slug: 'pubsub-eventbus', title: 'Pub/Sub 與 EventBus' },
      { slug: 'centralized-store', title: 'Centralized Store 模式' },
      { slug: 'derived-state', title: 'Derived State vs Stored State' },
    ],
  },
  {
    id: 16,
    slug: 'chapter-16',
    title: '網路層設計與 API 整合',
    part: 5,
    sections: [
      { slug: 'fetch-api', title: 'Fetch API 完整使用' },
      { slug: 'race-conditions', title: 'Race Condition 辨識與防護' },
      { slug: 'request-caching', title: 'Request/Response Caching 策略' },
      { slug: 'error-handling', title: 'Error Handling 分層設計' },
      { slug: 'websocket-sse', title: 'WebSocket 與 Server-Sent Events' },
    ],
  },
  {
    id: 17,
    slug: 'chapter-17',
    title: '前端路由與 SPA 架構',
    part: 5,
    sections: [
      { slug: 'history-api', title: 'History API 深入理解' },
      { slug: 'router-implementation', title: '從零實作前端路由器' },
      { slug: 'lazy-routes', title: '路由層級的 Code Splitting' },
      { slug: 'scroll-restoration', title: 'Scroll Restoration 與導航狀態' },
    ],
  },
  {
    id: 18,
    slug: 'chapter-18',
    title: '測試策略與實踐',
    part: 6,
    sections: [
      { slug: 'testing-pyramid', title: '前端測試金字塔' },
      { slug: 'unit-testing', title: '單元測試：純函式與狀態邏輯' },
      { slug: 'component-testing', title: 'Web Component 整合測試' },
      { slug: 'e2e-testing', title: 'E2E 測試：Playwright' },
      { slug: 'testing-principles', title: '測試的核心原則' },
    ],
  },
  {
    id: 19,
    slug: 'chapter-19',
    title: '工程化工具鏈',
    part: 6,
    sections: [
      { slug: 'build-tools', title: '構建工具比較：Vite vs Webpack' },
      { slug: 'linting-formatting', title: 'ESLint + Prettier 配置' },
      { slug: 'git-hooks', title: 'Git Hooks 與提交規範' },
      { slug: 'ci-cd', title: 'CI/CD Pipeline' },
    ],
  },
  {
    id: 20,
    slug: 'chapter-20',
    title: '瀏覽器安全與前端防禦',
    part: 6,
    sections: [
      { slug: 'xss', title: 'XSS (Cross-Site Scripting) 防禦' },
      { slug: 'csp', title: 'Content Security Policy (CSP)' },
      { slug: 'csrf', title: 'CSRF (Cross-Site Request Forgery) 防禦' },
      { slug: 'sensitive-data', title: '敏感資料處理' },
    ],
  },
  {
    id: 21,
    slug: 'chapter-21',
    title: '設計系統的構建與維護',
    part: 7,
    sections: [
      { slug: 'design-tokens', title: 'Design Tokens：設計決策的原子單位' },
      { slug: 'base-components', title: '基礎元件設計：以 Button 為例' },
      { slug: 'composition-patterns', title: '複合元件模式' },
      { slug: 'storybook', title: 'Storybook 文件化設計系統' },
    ],
  },
  {
    id: 22,
    slug: 'chapter-22',
    title: '微前端架構',
    part: 7,
    sections: [
      { slug: 'microfrontend-patterns', title: '微前端整合模式' },
      { slug: 'web-component-integration', title: 'Web Components 作為整合邊界' },
      { slug: 'mfe-communication', title: '微前端間的通訊策略' },
      { slug: 'mfe-isolation', title: '樣式隔離策略' },
    ],
  },
  {
    id: 23,
    slug: 'chapter-23',
    title: '系統設計面試：前端視角',
    part: 8,
    sections: [
      { slug: 'interview-framework', title: '面試答題框架' },
      { slug: 'design-news-feed', title: '設計 News Feed（社交動態）' },
      { slug: 'design-autocomplete', title: '設計 Autocomplete 搜尋建議' },
      { slug: 'tradeoff-discussion', title: '面試中的取捨討論' },
    ],
  },
  {
    id: 24,
    slug: 'chapter-24',
    title: '行為面試與職涯發展',
    part: 8,
    sections: [
      { slug: 'behavioral-interview', title: '行為面試的 STAR 框架' },
      { slug: 'senior-expectations', title: 'Senior/Staff 工程師的期望' },
      { slug: 'technical-growth', title: '技術深度 vs 廣度' },
      { slug: 'negotiation', title: '薪資談判與 Offer 評估' },
    ],
  },
  // Appendices
  {
    id: 'appA',
    slug: 'appendix-a',
    title: '附錄 A：瀏覽器相容性速查表',
    part: 9,
    isAppendix: true,
    sections: [
      { slug: 'web-components-support', title: 'Web Components 相容性' },
      { slug: 'js-api-support', title: '現代 JavaScript API 相容性' },
      { slug: 'css-support', title: '現代 CSS 特性相容性' },
      { slug: 'polyfill-strategy', title: 'Polyfill 策略' },
    ],
  },
  {
    id: 'appB',
    slug: 'appendix-b',
    title: '附錄 B：效能優化 Checklist',
    part: 9,
    isAppendix: true,
    sections: [
      { slug: 'loading-checklist', title: '載入效能 Checklist' },
      { slug: 'runtime-checklist', title: '執行期效能 Checklist' },
      { slug: 'measurement', title: '量測工具' },
    ],
  },
  {
    id: 'appC',
    slug: 'appendix-c',
    title: '附錄 C：無障礙設計 (A11y) 實踐指南',
    part: 9,
    isAppendix: true,
    sections: [
      { slug: 'aria-basics', title: 'ARIA 基礎' },
      { slug: 'keyboard-navigation', title: '鍵盤導航' },
      { slug: 'color-contrast', title: '顏色對比與視覺設計' },
    ],
  },
  {
    id: 'appD',
    slug: 'appendix-d',
    title: '附錄 D：推薦學習資源',
    part: 9,
    isAppendix: true,
    sections: [
      { slug: 'books', title: '推薦書籍' },
      { slug: 'specifications', title: '規範文件' },
      { slug: 'tools', title: '必備工具' },
      { slug: 'communities', title: '社群與持續學習' },
    ],
  },
];

export function getChapterById(id) {
  return chapters.find((ch) => ch.id === id);
}

export function getPartForChapter(chapterId) {
  const chapter = getChapterById(chapterId);
  if (!chapter) return null;
  return parts.find((p) => p.chapters.includes(chapterId));
}

export function getPrevNext(chapterId) {
  const idx = chapters.findIndex((ch) => ch.id === chapterId);
  return {
    prev: idx > 0 ? chapters[idx - 1] : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : null,
  };
}
