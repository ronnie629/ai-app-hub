export const CATEGORIES = [
  { key: "效率工具", label: "效率工具", icon: "⚡" },
  { key: "写作助手", label: "写作助手", icon: "✍️" },
  { key: "图像生成", label: "图像生成", icon: "🎨" },
  { key: "代码开发", label: "代码开发", icon: "💻" },
  { key: "教育学习", label: "教育学习", icon: "📚" },
  { key: "营销文案", label: "营销文案", icon: "📢" },
  { key: "生活娱乐", label: "生活娱乐", icon: "🎮" },
  { key: "数据分析", label: "数据分析", icon: "📊" },
  { key: "其他", label: "其他", icon: "📦" },
];

export const APP_TYPES = [
  { key: "WEB", label: "Web应用", desc: "网页端应用，浏览器直接使用" },
  { key: "API", label: "API服务", desc: "提供API接口供调用" },
  { key: "PLUGIN", label: "插件", desc: "浏览器/软件插件" },
  { key: "MINIPROGRAM", label: "小程序", desc: "微信/支付宝等小程序" },
  { key: "BOT", label: "机器人", desc: "Discord/微信/Telegram等Bot" },
  { key: "OTHER", label: "其他", desc: "其他类型" },
];

export const APP_STATUS = {
  PENDING: { label: "待审核", color: "text-yellow-600 bg-yellow-50" },
  APPROVED: { label: "已上架", color: "text-green-600 bg-green-50" },
  REJECTED: { label: "已拒绝", color: "text-red-600 bg-red-50" },
  SUSPENDED: { label: "已下架", color: "text-gray-600 bg-gray-100" },
};

export function formatPoints(points: number): string {
  return points.toLocaleString("zh-CN");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDate(d);
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
