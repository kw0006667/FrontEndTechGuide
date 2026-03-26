export default {
  title: '行為面試與職涯發展',
  intro: '技術能力是門票，但行為面試決定你能否晉升到高級職位。本章分析大型科技公司的行為面試框架，以及如何規劃資深前端工程師的職涯路徑。',
  content: `
<section id="behavioral-interview">
  <h2>行為面試的 STAR 框架</h2>
  <p>STAR 是行為面試的標準答題框架：Situation（情境）、Task（任務）、Action（行動）、Result（結果）。</p>

  <div class="callout callout-tip">
    <div class="callout-title">STAR 框架要點</div>
    <p><strong>Situation + Task：</strong>說清楚背景，30 秒內帶到重點。<br>
    <strong>Action：</strong>這是最重要的部分，詳細說明「你」做了什麼（不是團隊）。<br>
    <strong>Result：</strong>必須有量化數據——效能提升 40%、工程師滿意度從 6 升到 9 分等。</p>
  </div>

  <pre data-lang="javascript"><code class="language-javascript">// 常見行為面試問題準備框架

const commonQuestions = {
  // 1. 說一個你主導解決複雜技術問題的例子
  technicalLeadership: {
    focus: '展示你的技術深度和問題分解能力',
    keyPoints: [
      '你如何診斷問題的根本原因',
      '你考慮過哪些方案，最終為什麼選這個',
      '你如何說服其他人接受你的方案',
    ],
  },

  // 2. 說一個你和他人意見不合的例子
  conflict: {
    focus: '展示你能在尊重不同觀點的前提下推動事情前進',
    keyPoints: [
      '承認對方的觀點有其合理性',
      '你如何尋求共識或做出決定',
      '事後這段關係如何（理想情況是變更好）',
    ],
  },

  // 3. 說一個你失敗的例子
  failure: {
    focus: '展示你的成長心態和自我反思能力',
    keyPoints: [
      '誠實地承認錯誤，不推卸責任',
      '詳細說明你從中學到了什麼',
      '說明你之後如何避免同樣的錯誤',
    ],
  },

  // 4. 說一個你在模糊中推動事情的例子
  ambiguity: {
    focus: '展示你的主動性和方向感',
    keyPoints: [
      '你如何在資訊不完整時做決定',
      '你如何讓利害關係人對齊方向',
      '你如何平衡速度和準確性',
    ],
  },
};</code></pre>
</section>

<section id="senior-expectations">
  <h2>Senior/Staff 工程師的期望</h2>

  <div class="comparison-grid">
    <div class="comparison-card">
      <h4>Mid-level → Senior</h4>
      <p>能獨立解決複雜的技術問題，產出高品質的程式碼，並開始 mentor 初級工程師。</p>
      <p><strong>關鍵轉變：</strong>從「執行任務」到「定義和執行任務」</p>
    </div>
    <div class="comparison-card">
      <h4>Senior → Staff</h4>
      <p>影響力跨越多個團隊，能識別和解決組織層級的技術問題。</p>
      <p><strong>關鍵轉變：</strong>從「解決自己負責區域的問題」到「識別整個組織需要解決的問題」</p>
    </div>
  </div>

  <pre data-lang="javascript"><code class="language-javascript">// Staff 工程師的工作類型分佈（典型）
const staffWorkBreakdown = {
  coding: '30-40%',         // 仍然寫程式，但更多是關鍵設計
  design: '20-30%',         // 技術架構設計、RFC
  mentoring: '15-20%',      // 培育其他工程師
  crossTeam: '15-20%',      // 跨團隊協作和影響力
  strategy: '10%',          // 技術策略制定
};

// 如何展示「組織影響力」：
// ✅ 設計了跨 5 個團隊使用的共享 UI 元件庫
// ✅ 寫了 RFC 並推動了全公司的效能監控標準
// ✅ 識別並解決了導致整個組織重複造輪子的根因
// ✅ Mentor 的工程師成功晉升到更高職位</code></pre>
</section>

<section id="technical-growth">
  <h2>技術深度 vs 廣度</h2>

  <pre data-lang="javascript"><code class="language-javascript">// T型工程師模型：一個深度 + 廣泛的廣度
const tShapedEngineer = {
  // 深度（Deep Expertise）：成為至少一個領域的 Go-To Person
  depth: [
    'Web Performance Optimization',
    'Web Components & Browser APIs',
    'Frontend Architecture',
    // 選擇一個，深入到 Level 5/5
  ],

  // 廣度（Broad Knowledge）：足夠理解和協作的廣度
  breadth: [
    'Backend 基礎（API design, DB concepts）',
    'DevOps 基礎（CI/CD, Docker, CDN）',
    'Product 思維（使用者需求, metrics）',
    'Security 基礎（OWASP Top 10）',
    'Accessibility（WCAG 2.1）',
  ],
};

// 學習新技術的評估框架
function evaluateNewTechnology(tech) {
  return {
    // 1. 它解決什麼問題？我現在有這個問題嗎？
    problemFit: 'Does it solve a real problem I have?',

    // 2. 學習成本 vs 收益
    roi: 'Learning cost vs. long-term benefit',

    // 3. 社群和生命週期
    ecosystem: 'Is it well-maintained? What is the community size?',

    // 4. 它的核心思想（比 API 更重要）
    coreIdea: 'What new mental model does it introduce?',
  };
}

// 持續學習的系統
const learningSystem = {
  daily: ['Follow key blogs/newsletters (30min)', 'Read release notes for tools you use'],
  weekly: ['Deep dive one topic (2h)', 'Code review others\' PRs with learning intent'],
  monthly: ['Build one small project with a new concept', 'Write about what you learned'],
  quarterly: ['Attend or watch 1 conference talk series', 'Reassess your depth/breadth balance'],
};</code></pre>
</section>

<section id="negotiation">
  <h2>薪資談判與 Offer 評估</h2>

  <pre data-lang="javascript"><code class="language-javascript">// Offer 評估框架（不只是 Base Salary）
function evaluateOffer(offer) {
  return {
    compensation: {
      base: offer.base,
      equity: estimateEquityValue(offer.equity, offer.vestingSchedule),
      bonus: offer.targetBonus,
      totalComp: calculateTotalComp(offer),
    },

    growth: {
      learningOpportunities: rateOpportunities(offer.teamSize, offer.projectComplexity),
      titleAndScope: offer.title,
      mentorship: offer.seniorEngineersOnTeam,
    },

    culture: {
      workLifeBalance: offer.expectedHours,
      remote: offer.remotePolicy,
      management: meetManagerImpressions,
    },

    // 最重要：5年後你會是誰？
    trajectory: '5 years from now, what will this role make you?',
  };
}

// 談判基本原則：
// 1. 永遠談判——研究顯示談判的人平均多得 $5000-$20000
// 2. 不要先出數字——讓對方先說
// 3. 用競爭 offer 作為槓桿（誠實地）
// 4. 不只談 base，談簽約獎金、股票加速、標題、review cycle
// 5. 保持友善——你即將和這些人共事</code></pre>
</section>
  `,
};
