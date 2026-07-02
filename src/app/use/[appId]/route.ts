import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  // 无 token → 回到应用详情页
  if (!token) {
    return NextResponse.redirect(new URL(`/app/${appId}`, request.url));
  }

  // 查询 token 记录
  const accessToken = await prisma.accessToken.findUnique({
    where: { token },
  });

  // token 不存在
  if (!accessToken) {
    return renderErrorPage(request, "访问令牌无效", "请返回应用页面重新点击「使用」", appId);
  }

  // token 已使用
  if (accessToken.status === "USED") {
    return renderErrorPage(request, "访问令牌已失效", "每次使用需重新点击「使用」按钮", appId);
  }

  // token 已过期
  if (accessToken.expiresAt < new Date()) {
    await prisma.accessToken.update({
      where: { id: accessToken.id },
      data: { status: "EXPIRED" },
    });
    return renderErrorPage(request, "访问令牌已过期", "令牌有效期 30 分钟，请重新点击「使用」", appId);
  }

  // token 对应的 appId 不匹配
  if (accessToken.appId !== appId) {
    return renderErrorPage(request, "访问令牌无效", "令牌与应用不匹配", appId);
  }

  // 查询应用信息
  const appData = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true, title: true, accessUrl: true, status: true },
  });

  if (!appData || appData.status !== "APPROVED") {
    return renderErrorPage(request, "应用不可用", "该应用当前无法访问", appId);
  }

  if (!appData.accessUrl) {
    return renderErrorPage(request, "应用未配置", "该应用暂无访问地址", appId);
  }

  // 标记 token 为已使用（一次性）
  await prisma.accessToken.update({
    where: { id: accessToken.id },
    data: {
      status: "USED",
      usedAt: new Date(),
    },
  });

  const appTitle = appData.title;
  const accessUrl = appData.accessUrl;
  const expiresAtTs = accessToken.expiresAt.getTime();

  // 返回 iframe 代理页面
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(appTitle)} - AIHub</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 48px;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
    flex-shrink: 0;
  }
  #topbar .title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #topbar .countdown { font-size: 12px; color: #aaa; flex-shrink: 0; margin-left: 12px; }
  #topbar .back { color: #818cf8; text-decoration: none; font-size: 13px; flex-shrink: 0; margin-left: 16px; }
  #topbar .back:hover { text-decoration: underline; }
  #iframe-wrap { width: 100%; height: calc(100% - 48px); }
  #iframe-wrap iframe { width: 100%; height: 100%; border: none; }
  #loading {
    position: fixed; top: 48px; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    background: #f9fafb; z-index: 10;
  }
  #loading .spinner {
    width: 40px; height: 40px; border: 3px solid #e5e7eb;
    border-top-color: #6366f1; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div id="topbar">
  <span class="title">AIHub - ${escapeHtml(appTitle)}</span>
  <span class="countdown" id="countdown"></span>
  <a class="back" href="/app/${appId}">返回详情</a>
</div>
<div id="loading"><div class="spinner"></div></div>
<div id="iframe-wrap" style="display:none">
  <iframe src="${escapeAttr(accessUrl)}" id="appFrame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" allow="clipboard-read; clipboard-write"></iframe>
</div>
<script>
  (function() {
    var loading = document.getElementById('loading');
    var wrap = document.getElementById('iframe-wrap');
    var frame = document.getElementById('appFrame');
    frame.addEventListener('load', function() {
      loading.style.display = 'none';
      wrap.style.display = 'block';
    });
    // 倒计时
    var expires = ${expiresAtTs};
    var cd = document.getElementById('countdown');
    function tick() {
      var remain = expires - Date.now();
      if (remain <= 0) {
        cd.textContent = '已过期';
        cd.style.color = '#f87171';
        return;
      }
      var min = Math.floor(remain / 60000);
      var sec = Math.floor((remain % 60000) / 1000);
      cd.textContent = '剩余 ' + min + ':' + (sec < 10 ? '0' : '') + sec;
    }
    tick();
    setInterval(tick, 1000);
    // 禁止右键
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  })();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Frame-Options": "DENY",
    },
  });
}

function renderErrorPage(
  request: NextRequest,
  title: string,
  desc: string,
  appId: string
): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} - AIHub</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9fafb; }
  .card { text-align: center; padding: 48px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  .title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
  .desc { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
  .btn { display: inline-block; padding: 10px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; }
  .btn:hover { background: #4f46e5; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">🔒</div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="desc">${escapeHtml(desc)}</div>
  <a class="btn" href="/app/${appId}">返回应用详情</a>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
