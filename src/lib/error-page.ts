export function renderErrorPage(): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>500 — 国会ウォッチ</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5}</style>
</head><body><div><h1>500</h1><p>サーバーでエラーが発生しました。/ Server error.</p><p><a href="/" style="color:#60a5fa">ホーム / Home</a></p></div></body></html>`;
}
