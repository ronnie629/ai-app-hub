import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CATEGORIES, APP_TYPES } from "@/lib/constants";

/**
 * POST /api/ai/generate-app
 * Body: { prompt: string }
 * 根据一句话描述，AI 自动生成应用名称、详细描述、标签、推荐分类
 *
 * 实现策略：
 * 1. 默认使用规则化 mock（快速稳定，无需外部 API）
 * 2. 若配置 OPENAI_API_KEY，则调用 GPT 真实生成（更高质量）
 */

interface GeneratedResult {
  title: string;
  description: string;
  category: string;
  appType: string;
  tags: string[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function callOpenAI(prompt: string): Promise<GeneratedResult | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你是 AI 应用商店的运营专家，擅长为开发者起名字、写描述、提标签。

任务：基于用户的一句话描述，生成结构化的应用信息。

输出 JSON 格式：
{
  "title": "≤ 15 字、有记忆点的应用名",
  "description": "150-300 字的详细描述，结构：解决什么问题 + 怎么解决 + 用户能得到什么",
  "category": 9 个分类之一（${CATEGORIES.map((c) => c.label).join("、")}），
  "appType": 6 个类型之一（${APP_TYPES.map((t) => t.label).join("、")}），
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("OpenAI call failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    // 校验 category / appType 是否在合法值中
    if (!CATEGORIES.find((c) => c.key === parsed.category)) {
      parsed.category = "其他";
    }
    if (!APP_TYPES.find((t) => t.key === parsed.appType)) {
      parsed.appType = "WEB";
    }
    return parsed;
  } catch (err) {
    console.error("OpenAI error:", err);
    return null;
  }
}

function mockGenerate(prompt: string): GeneratedResult {
  // 简单规则化生成：基于关键词匹配分类
  const lower = prompt.toLowerCase();

  let category = "其他";
  if (/写作|文|文章|小说|文案|脚本|稿/.test(prompt)) category = "写作助手";
  else if (/图|画|设计|海报|插画|头像/.test(prompt)) category = "图像生成";
  else if (/代码|编程|开发|debug|review|重构|sql|正则/.test(lower))
    category = "代码开发";
  else if (/效率|便签|笔记|todo|任务|日程|提醒|自动化/.test(prompt))
    category = "效率工具";
  else if (/教育|学习|课程|作业|题|考试|辅导|语言/.test(prompt)) category = "教育学习";
  else if (/营销|推广|小红书|抖音|种草|带货|广告/.test(prompt)) category = "营销文案";
  else if (/游戏|娱乐|聊天|故事|音乐|视频/.test(prompt)) category = "生活娱乐";
  else if (/数据|分析|图表|统计|可视化|报表/.test(prompt)) category = "数据分析";

  let appType = "WEB";
  if (/api|接口|服务|调用/.test(prompt)) appType = "API";
  else if (/插件|extension|chrome|vscode/.test(lower)) appType = "PLUGIN";
  else if (/小程序|微信|支付宝/.test(prompt)) appType = "MINIPROGRAM";
  else if (/bot|机器人|discord|telegram|微信群/.test(lower)) appType = "BOT";

  // 提取简短标题：取前 12 字 + 加后缀
  const shortPrompt = prompt.slice(0, 20);
  const title = shortPrompt.length < prompt.length ? `${shortPrompt}...` : shortPrompt;

  // 描述模板
  const description = `【${title}】是一款专为解决用户「${prompt}」需求的 AI 应用。

🎯 解决什么问题
${prompt} 是当下越来越普遍的需求，传统方式效率低、成本高、质量参差不齐。

⚙️ 怎么解决
基于最新大语言模型技术，深度理解用户输入，智能生成符合需求的高质量结果。

✨ 用户能获得什么
• 节省 80% 的时间成本
• 获得专业级输出结果
• 7×24 小时随时可用

适合人群：所有需要 ${prompt} 的用户。`;

  // 标签：从提示词提取关键词
  const keywords = prompt.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const tags = Array.from(new Set(keywords)).slice(0, 5);
  if (tags.length < 3) {
    tags.push("AI", "效率");
  }

  return {
    title,
    description,
    category,
    appType,
    tags: tags.slice(0, 5),
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return NextResponse.json({ error: "请输入有效描述" }, { status: 400 });
    }

    // 优先用 OpenAI，没有则 mock
    let result = await callOpenAI(prompt.trim());
    if (!result) {
      result = mockGenerate(prompt.trim());
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
