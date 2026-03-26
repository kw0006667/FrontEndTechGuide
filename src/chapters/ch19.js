export default {
  title: '工程化工具鏈',
  intro: '現代前端工程需要一套完整的工具鏈支撐。本章介紹從構建工具、程式碼品質工具到 CI/CD 流程的完整工程化實踐，讓你的專案從一開始就具備工業級的品質保障。',
  content: `
<section id="build-tools">
  <h2>構建工具比較：Vite vs Webpack</h2>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Vite</h4>
      <p>基於 ESM 的開發服務器，只轉換被請求的檔案。生產環境使用 Rollup 打包。</p>
      <p><strong>優點：</strong>極快的冷啟動（&lt;300ms），HMR 毫秒級更新</p>
      <p><strong>適合：</strong>新專案、中小型應用、Web Components</p>
    </div>
    <div class="comparison-card">
      <h4>Webpack 5</h4>
      <p>功能最完整的打包器，生態系最大。Module Federation 支援微前端。</p>
      <p><strong>優點：</strong>極度可配置，Module Federation，成熟穩定</p>
      <p><strong>適合：</strong>大型企業應用、需要微前端架構的專案</p>
    </div>
  </div>

  <pre data-lang="javascript"><code class="language-javascript">// vite.config.js — 完整生產配置
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',

  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        // 手動控制 chunk 分割
        manualChunks: {
          // 供應商 chunk（長期快取）
          'vendor-lit': ['lit'],
          'vendor-prism': ['prismjs'],
        },
        // Chunk 命名（含 hash 確保快取失效）
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // 產生 bundle 分析
    reportCompressedSize: true,
  },

  // 開發服務器設定
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // 預覽伺服器（模擬生產環境）
  preview: {
    port: 4173,
  },
});</code></pre>
</section>

<section id="linting-formatting">
  <h2>ESLint + Prettier 配置</h2>

  <pre data-lang="javascript"><code class="language-javascript">// eslint.config.js (ESLint 9 flat config)
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // 最佳實踐
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],

      // 非同步
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'require-await': 'error',

      // 可讀性
      'no-nested-ternary': 'error',
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true }],
    },
  },
];

// .prettierrc.json
// {
//   "printWidth": 100,
//   "tabWidth": 2,
//   "useTabs": false,
//   "semi": true,
//   "singleQuote": true,
//   "trailingComma": "es5",
//   "bracketSpacing": true,
//   "arrowParens": "always"
// }</code></pre>
</section>

<section id="git-hooks">
  <h2>Git Hooks 與提交規範</h2>

  <pre data-lang="javascript"><code class="language-javascript">// package.json — lint-staged + husky 配置
// {
//   "scripts": {
//     "prepare": "husky"
//   },
//   "lint-staged": {
//     "*.js": ["eslint --fix", "prettier --write"],
//     "*.{css,json,md}": "prettier --write"
//   }
// }

// .husky/pre-commit
// #!/bin/sh
// npx lint-staged

// .husky/commit-msg
// #!/bin/sh
// npx commitlint --edit $1

// commitlint.config.js — Conventional Commits 規範
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2, 'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
    ],
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
  },
};

// 有效的提交訊息範例：
// feat: add dark mode support
// fix: resolve memory leak in sidebar-nav
// perf: lazy-load chapter content on demand
// refactor: extract shared state logic to controller
// docs: update README with setup instructions</code></pre>
</section>

<section id="ci-cd">
  <h2>CI/CD Pipeline</h2>

  <pre data-lang="yaml"><code class="language-yaml"># .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # 並行執行所有品質檢查
      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run typecheck

      - name: Unit Tests
        run: npm run test:unit -- --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v4

  build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build

      # 儲存 build artifact
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      # 下載 build artifact
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist/ }

      - name: E2E Tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/</code></pre>
</section>
  `,
};
