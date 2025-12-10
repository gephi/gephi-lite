// ---- 設定 ----
const SUPABASE_URL = "https://vebhoeiltxspsurqoxvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4"; // 公開OKなAnon Key
const API_BASE_URL = "https://api.dataviz.jp"; // ユーザープロファイルAPIなど
const AUTH_APP_URL = "https://auth.dataviz.jp"; // ログイン画面

// ガイドに従った固定クッキー名
const AUTH_COOKIE_NAME = "sb-dataviz-auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * クッキー操作ヘルパー
 */
const COOKIE_DOMAIN = (() => {
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)
  ) {
    return null;
  }
  return ".dataviz.jp";
})();

const cookieStorage = {
  getItem: (key) => {
    const cookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);

    for (const c of cookies) {
      const [k, ...rest] = c.split("=");
      if (k === key) {
        const rawVal = decodeURIComponent(rest.join("="));
        try { return JSON.parse(rawVal); } catch (e) { }
        try {
          let toDecode = rawVal.startsWith('base64-') ? rawVal.slice(7) : rawVal;
          const base64Standard = toDecode.replace(/-/g, '+').replace(/_/g, '/');
          return JSON.parse(atob(base64Standard));
        } catch (e) { return null; }
      }
    }
    return null;
  },
  setItem: (key, value) => {
    let encoded;
    try { encoded = btoa(value); } catch (e) { return; }
    let cookieStr = `${key}=${encoded}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=None; Secure`;
    if (COOKIE_DOMAIN) cookieStr += `; Domain=${COOKIE_DOMAIN}`;
    document.cookie = cookieStr;
  },
  removeItem: (key) => {
    let cookieStr = `${key}=; Max-Age=0; Path=/; SameSite=None; Secure`;
    if (COOKIE_DOMAIN) cookieStr += `; Domain=${COOKIE_DOMAIN}`;
    document.cookie = cookieStr;
  },
};

// ---- Supabase クライアント作成 ----
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: AUTH_COOKIE_NAME,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) : null;


// =========================================================================
// UI Component: 共通ヘッダー (Shadow DOM使用)
// =========================================================================
class DatavizGlobalHeader {
  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'dataviz-global-header-host';
    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.state = {
      isLoading: true,
      user: null
    };
  }

  mount() {
    // 既存のものがあれば削除（二重防止）
    const existing = document.getElementById('dataviz-global-header-host');
    if (existing) existing.remove();
    document.body.prepend(this.host);
    this.render();
  }

  update(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  // スタイル定義
  getStyles() {
    return `
      :host {
        all: initial; /* 親スタイルの影響をリセット */
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 99999;
        position: relative;
      }
      .dv-header {
        background-color: #111;
        color: #ddd;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .dv-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dv-brand {
        font-weight: 700;
        color: #fff;
        text-decoration: none;
        letter-spacing: 0.5px;
      }
      .dv-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .dv-user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #aaa;
      }
      .dv-user-email {
        white-space: nowrap;
        color: inherit;
        text-decoration: none;
        cursor: pointer;
      }
      .dv-user-email:hover {
        color: #fff;
        text-decoration: underline;
      }
      .dv-btn {
        background: transparent;
        border: 1px solid #444;
        color: #eee;
        padding: 4px 10px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }
      .dv-btn:hover {
        background: #333;
        border-color: #666;
        color: #fff;
      }
      .dv-btn-primary {
        background: #eee;
        color: #111;
        border-color: #eee;
        font-weight: 600;
      }
      .dv-btn-primary:hover {
        background: #fff;
        color: #000;
      }
      .dv-loading {
        opacity: 0.5;
        font-size: 12px;
      }
      /* Mobile Optimizations */
      @media (max-width: 600px) {
        .dv-user-email { display: none; }
      }
    `;
  }

  render() {
    const { isLoading, user } = this.state;

    // アカウントページのURL
    const accountUrl = `${AUTH_APP_URL}/account`;
    const loginUrl = `${AUTH_APP_URL}/auth/sign-up?redirect_to=${encodeURIComponent(window.location.href)}`;

    let rightContent = '';

    if (isLoading) {
      rightContent = `<span class="dv-loading">Loading...</span>`;
    } else if (user) {
      const email = user.email || 'User';
      rightContent = `
        <div class="dv-user-info">
          <a href="${accountUrl}" class="dv-user-email" title="${email}">${email}</a>
        </div>
        <button class="dv-btn" id="dv-logout-btn">Log out</button>
      `;
    } else {
      rightContent = `
        <span style="font-size:12px; color:#888;">Not logged in</span>
        <a href="${loginUrl}" class="dv-btn dv-btn-primary">Log in</a>
      `;
    }

    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="dv-header">
        <div class="dv-left">
          <a href="${AUTH_APP_URL}" class="dv-brand">dataviz.jp</a>
        </div>
        <div class="dv-right">
          ${rightContent}
        </div>
      </div>
    `;

    // イベントリスナーの再結合 (Shadow DOM再描画後)
    const logoutBtn = this.shadow.getElementById('dv-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('ログアウトしますか？')) {
          await supabase.auth.signOut();
          window.location.reload();
        }
      });
    }
  }
}


// =========================================================================
// Logic: 認証・認可ロジック
// =========================================================================

function isAuthDebugMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("auth_debug");
}

function performRedirect(url, reason) {
  if (isAuthDebugMode()) {
    console.warn(`[dataviz-auth-client] Redirect suppressed. Reason: ${reason} -> ${url}`);
    return;
  }
  window.location.href = url;
}

/**
 * ユーザー状態検証
 * @returns UserProfile object OR null (if unauthenticated/invalid)
 */
async function verifyUserAccess(session) {
  if (!session) {
    const redirectTo = encodeURIComponent(window.location.href);
    const signUpUrl = `${AUTH_APP_URL}/auth/sign-up?redirect_to=${redirectTo}`;
    performRedirect(signUpUrl, 'Unauthenticated');
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.access_token}` },
      credentials: "include", // Cookie送信
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const profile = await res.json();

    // サブスクチェック
    const sub = profile.subscription || {};
    const status = sub.status || "none";

    // 「キャンセル済みだが期間内」は cancel_at_period_end で判断
    const isCanceledButValid = sub.cancel_at_period_end;

    const isActive = status === "active" || status === "trialing" || isCanceledButValid;

    if (!isActive) {
      performRedirect(AUTH_APP_URL, `Inactive Subscription (${status})`);
      return null;
    }

    // ユーザー情報にemailが含まれていない場合があるので、Sessionからマージ
    return { ...profile, email: session.user.email };

  } catch (err) {
    console.error("[dataviz-auth-client] Profile check failed", err);
    performRedirect(AUTH_APP_URL, 'Profile Error');
    return null;
  }
}


// =========================================================================
// Controller: メイン処理 (変更なしのエントリーポイント名)
// =========================================================================

async function initDatavizToolAuth() {
  if (!supabase) {
    console.error("[dataviz-auth-client] Supabase client missing.");
    return;
  }

  // 1. UIの初期化・表示
  const headerUI = new DatavizGlobalHeader();
  // DOMContentLoadedを待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => headerUI.mount());
  } else {
    headerUI.mount();
  }

  let isCheckDone = false;

  const handleSession = async (session) => {
    // UIをローディング状態に
    // headerUI.update({ isLoading: true }); // チラつき防止のためここでのローディング表示は慎重に

    // URLパラメータ掃除
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("code") || hashParams.has("access_token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!session) {
      // 未ログイン
      headerUI.update({ isLoading: false, user: null });
      await verifyUserAccess(null); // リダイレクト実行
      return;
    }

    // ログイン済み -> 権限チェック
    const profile = await verifyUserAccess(session);
    if (profile) {
      // 成功 -> UI更新
      headerUI.update({ isLoading: false, user: profile });
    }
    // 失敗時は verifyUserAccess 内でリダイレクトされる
  };

  // Authイベント監視
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION') {
      if (isCheckDone) return;
      isCheckDone = true;
      await handleSession(session);
    }
    else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await handleSession(session);
    }
    else if (event === 'SIGNED_OUT') {
      await handleSession(null);
    }
  });

  // フォールバックチェック
  const { data } = await supabase.auth.getSession();
  if (!isCheckDone) {
    isCheckDone = true;
    await handleSession(data.session);
  }
}

// 自動実行
initDatavizToolAuth();
