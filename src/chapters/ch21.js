export default {
  title: '設計系統的構建與維護',
  intro: '設計系統是組織的共享語言，連結設計師和工程師。本章介紹如何用 Web Components 構建真正框架無關的設計系統，以及如何管理 Design Token。',
  content: `
<section id="design-tokens">
  <h2>Design Tokens：設計決策的原子單位</h2>
  <p>Design Tokens 是設計系統的基礎——將顏色、間距、字體等設計決策用有意義的名稱抽象化，而非直接使用硬編碼的值。</p>

  <pre data-lang="css"><code class="language-css">/* tokens.css — 三層 Token 架構 */

/* 第一層：Primitive Tokens（原始值，不直接使用）*/
:root {
  /* Colors */
  --primitive-blue-50: #eff6ff;
  --primitive-blue-500: #3b82f6;
  --primitive-blue-900: #1e3a8a;

  --primitive-neutral-0: #ffffff;
  --primitive-neutral-100: #f3f4f6;
  --primitive-neutral-900: #111827;

  /* Spacing scale */
  --primitive-space-1: 4px;
  --primitive-space-2: 8px;
  --primitive-space-4: 16px;
  --primitive-space-8: 32px;
}

/* 第二層：Semantic Tokens（有語意的，可主題化）*/
:root {
  --color-background: var(--primitive-neutral-0);
  --color-surface: var(--primitive-neutral-100);
  --color-text-primary: var(--primitive-neutral-900);
  --color-text-secondary: var(--primitive-neutral-500);
  --color-interactive: var(--primitive-blue-500);
  --color-interactive-hover: var(--primitive-blue-600);
  --color-focus-ring: var(--primitive-blue-500);
}

[data-theme="dark"] {
  --color-background: var(--primitive-neutral-900);
  --color-surface: var(--primitive-neutral-800);
  --color-text-primary: var(--primitive-neutral-100);
  --color-text-secondary: var(--primitive-neutral-400);
}

/* 第三層：Component Tokens（元件特定，引用 Semantic Token）*/
:root {
  --button-bg: var(--color-interactive);
  --button-bg-hover: var(--color-interactive-hover);
  --button-text: white;
  --button-radius: 6px;
  --button-padding: var(--primitive-space-2) var(--primitive-space-4);
}</code></pre>
</section>

<section id="base-components">
  <h2>基礎元件設計：以 Button 為例</h2>

  <pre data-lang="javascript"><code class="language-javascript">// ds-button.js — 框架無關的 Button 元件
class DsButton extends LitElement {
  static styles = css\`
    :host {
      display: inline-block;
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }

    button {
      /* 使用 Component Token */
      background: var(--button-bg, var(--color-interactive));
      color: var(--button-text, white);
      border: none;
      border-radius: var(--button-radius, 6px);
      padding: var(--button-padding, 8px 16px);
      font: inherit;
      cursor: pointer;
      transition: background 150ms ease, box-shadow 150ms ease;
    }

    button:hover { background: var(--button-bg-hover); }

    button:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }

    /* Variants */
    :host([variant="secondary"]) button {
      background: transparent;
      border: 1.5px solid var(--button-bg);
      color: var(--button-bg);
    }

    :host([variant="ghost"]) button {
      background: transparent;
      color: var(--color-text-primary);
    }

    /* Sizes */
    :host([size="sm"]) button { padding: 4px 10px; font-size: 0.875rem; }
    :host([size="lg"]) button { padding: 12px 24px; font-size: 1.125rem; }
  \`;

  @property({ reflect: true }) variant = 'primary';
  @property({ reflect: true }) size = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() type = 'button';

  render() {
    return html\`
      &lt;button
        type=\${this.type}
        ?disabled=\${this.disabled}
        aria-disabled=\${this.disabled}
      &gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`;
  }
}

customElements.define('ds-button', DsButton);</code></pre>
</section>

<section id="composition-patterns">
  <h2>複合元件模式</h2>

  <pre data-lang="javascript"><code class="language-javascript">// 複合元件：外部控制器 + 受控子元件
// 範例：Tabs 元件

// ds-tabs.js — 協調者
class DsTabs extends LitElement {
  @state() _activeTab = 0;

  // 提供 context 給子元件
  @provide({ context: tabsContext })
  _tabsContext = {
    activeTab: 0,
    setActiveTab: (index) => {
      this._activeTab = index;
      this._tabsContext = { ...this._tabsContext, activeTab: index };
      this.dispatchEvent(new CustomEvent('tab-change', { detail: { index } }));
    },
  };

  render() {
    return html\`
      &lt;div class="tabs" role="tablist"&gt;
        &lt;slot name="tabs"&gt;&lt;/slot&gt;
      &lt;/div&gt;
      &lt;div class="panels"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`;
  }
}

// ds-tab.js — 單個 Tab 按鈕
class DsTab extends LitElement {
  @consume({ context: tabsContext, subscribe: true })
  _tabsContext;

  @property({ type: Number }) index = 0;

  get _isActive() { return this._tabsContext?.activeTab === this.index; }

  render() {
    return html\`
      &lt;button
        role="tab"
        aria-selected=\${this._isActive}
        tabindex=\${this._isActive ? 0 : -1}
        @click=\${() => this._tabsContext?.setActiveTab(this.index)}
      &gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`;
  }
}

// 使用方式：清晰的宣告式 API
// &lt;ds-tabs&gt;
//   &lt;ds-tab slot="tabs" index="0"&gt;首頁&lt;/ds-tab&gt;
//   &lt;ds-tab slot="tabs" index="1"&gt;關於&lt;/ds-tab&gt;
//   &lt;ds-panel index="0"&gt;首頁內容&lt;/ds-panel&gt;
//   &lt;ds-panel index="1"&gt;關於內容&lt;/ds-panel&gt;
// &lt;/ds-tabs&gt;</code></pre>
</section>

<section id="storybook">
  <h2>Storybook 文件化設計系統</h2>

  <pre data-lang="javascript"><code class="language-javascript">// stories/DsButton.stories.js
import '../src/components/ds-button.js';

export default {
  title: 'Components/Button',
  component: 'ds-button',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

// 基本 Story
export const Primary = {
  args: { variant: 'primary' },
  render: ({ variant, size, disabled }) => \`
    &lt;ds-button variant="\${variant}" size="\${size}" \${disabled ? 'disabled' : ''}&gt;
      Click me
    &lt;/ds-button&gt;
  \`,
};

// 展示所有 Variants
export const AllVariants = {
  render: () => \`
    &lt;div style="display: flex; gap: 12px; align-items: center;"&gt;
      &lt;ds-button variant="primary"&gt;Primary&lt;/ds-button&gt;
      &lt;ds-button variant="secondary"&gt;Secondary&lt;/ds-button&gt;
      &lt;ds-button variant="ghost"&gt;Ghost&lt;/ds-button&gt;
      &lt;ds-button disabled&gt;Disabled&lt;/ds-button&gt;
    &lt;/div&gt;
  \`,
};

// 互動測試
export const InteractionTest = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};</code></pre>
</section>
  `,
};
