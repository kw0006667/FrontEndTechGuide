export default {
  title: '瀏覽器安全與前端防禦',
  intro: '安全不是事後補丁，而是設計時就要考慮的。本章介紹前端開發者必須理解的安全威脅，以及如何在設計階段就阻止這些攻擊。',
  content: `
<section id="xss">
  <h2>XSS (Cross-Site Scripting) 防禦</h2>
  <p>XSS 是最常見的前端安全威脅之一。攻擊者注入惡意腳本，在受害者的瀏覽器中執行。</p>

  <pre data-lang="javascript"><code class="language-javascript">// ❌ 危險：直接插入使用者輸入
element.innerHTML = userInput; // 如果 userInput 含 &lt;script&gt; 就被攻擊了

// ✅ 安全：使用 textContent 或 innerText
element.textContent = userInput; // 純文字，不解析 HTML

// ✅ 安全：使用 DOMPurify 清理 HTML（當你確實需要允許部分 HTML 時）
import DOMPurify from 'dompurify';

// 只允許安全的 HTML 標籤，移除所有腳本和事件處理器
const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
  ALLOWED_ATTR: ['href', 'target'],
  FORCE_HTTPS: true,
});
element.innerHTML = clean;

// ✅ Lit 的模板自動轉義：html\`\` 會自動轉義插值
// 這是 Lit 的重要安全特性！
class SafeComponent extends LitElement {
  @property() userContent = '';

  render() {
    return html\`
      &lt;!-- 自動轉義，使用者輸入不會被解析為 HTML --&gt;
      &lt;p&gt;\${this.userContent}&lt;/p&gt;
    \`;
  }
}

// ⚠️ 例外：使用 unsafeHTML 時需要自己清理
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

render() {
  const safeContent = DOMPurify.sanitize(this.htmlContent);
  return html\`&lt;div&gt;\${unsafeHTML(safeContent)}&lt;/div&gt;\`;
}</code></pre>
</section>

<section id="csp">
  <h2>Content Security Policy (CSP)</h2>
  <p>CSP 是阻止 XSS 的最後防線，即使攻擊者成功注入惡意腳本，CSP 也能阻止它執行。</p>

  <pre data-lang="javascript"><code class="language-javascript">// 嚴格的 CSP 設定（在 HTTP header 中設置）
// Content-Security-Policy:
//   default-src 'self';
//   script-src 'self' 'nonce-{random}';
//   style-src 'self' 'unsafe-inline';
//   img-src 'self' data: https:;
//   connect-src 'self' https://api.example.com;
//   font-src 'self';
//   frame-src 'none';
//   object-src 'none';
//   base-uri 'self';
//   form-action 'self';

// 使用 nonce 允許特定 inline script（比 unsafe-inline 更安全）
// &lt;script nonce="abc123"&gt;...&lt;/script&gt;

// 在 meta tag 中設置 CSP（較弱，無法阻止部分攻擊）
// &lt;meta http-equiv="Content-Security-Policy" content="..."&gt;

// 報告違規（collect without blocking）
// Content-Security-Policy-Report-Only: ...; report-uri /csp-report

// 處理 CSP 違規報告
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];
  console.log('CSP Violation:', {
    blockedURI: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
  });
  res.sendStatus(204);
});</code></pre>
</section>

<section id="csrf">
  <h2>CSRF (Cross-Site Request Forgery) 防禦</h2>

  <pre data-lang="javascript"><code class="language-javascript">// CSRF 攻擊：惡意網站使用受害者的 Cookie 發送請求

// 防禦方法一：SameSite Cookie
// Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
// SameSite=Strict → 完全阻止跨站 Cookie
// SameSite=Lax    → 允許頂層導航（點連結），阻止其他跨站請求

// 防禦方法二：CSRF Token
// 每次表單提交都附帶 server 產生的隨機 token

// 前端：從 meta tag 讀取 CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

// 所有狀態修改請求都附帶 token
api.use('request', (config) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// 防禦方法三：Double Submit Cookie Pattern
// 前端產生隨機 token，同時放在 Cookie 和 request header
// 伺服器比對兩者是否相同

function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// 初始化時設定
const token = generateCSRFToken();
document.cookie = \`csrf=\${token}; SameSite=Strict; Secure\`;
// 每次請求在 header 中也帶上相同 token
api.defaults.headers['X-CSRF-Token'] = token;</code></pre>
</section>

<section id="sensitive-data">
  <h2>敏感資料處理</h2>

  <pre data-lang="javascript"><code class="language-javascript">// ❌ 永遠不要在前端儲存 access token 在 localStorage
// localStorage 可被任何同源 JS 讀取（XSS 攻擊可竊取）
localStorage.setItem('access_token', token); // 危險！

// ✅ 使用 HttpOnly Cookie（JS 無法讀取）
// 由伺服器設定：Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// ✅ 如果必須在前端管理 token，使用 in-memory（最短壽命）
class AuthStore {
  #accessToken = null;
  #refreshToken = null; // 可存在 HttpOnly cookie 中

  setTokens(accessToken, refreshToken) {
    this.#accessToken = accessToken; // 只存在記憶體，關閉 tab 就消失
    // refreshToken 由 server 設定在 HttpOnly cookie
  }

  getAccessToken() { return this.#accessToken; }

  isLoggedIn() { return !!this.#accessToken; }

  clear() {
    this.#accessToken = null;
    // 呼叫 logout API 清除 server 端的 session
  }
}

// 環境變數：永遠不要在前端包含真實密鑰
// .env.local（不要提交）
// VITE_API_KEY=sk-secret-key  ← 這是錯誤的！前端 bundle 會包含這個值

// 正確做法：敏感 API 呼叫應在後端代理，前端只呼叫自己的後端
// 前端：
await fetch('/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
// 後端：在伺服器端使用真實 API key 呼叫 AI 服務</code></pre>

  <div class="callout callout-warning">
    <div class="callout-title">前端安全的根本限制</div>
    <p>記住：前端程式碼是公開的。任何用 <code>VITE_</code> 前綴放進 bundle 的環境變數，使用者都能看到。真正的密鑰、API 金鑰、私鑰永遠不應出現在前端程式碼中。</p>
  </div>
</section>
  `,
};
