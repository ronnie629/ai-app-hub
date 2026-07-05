import { z } from "zod";

// 应用创建/更新验证 Schema
export const createAppSchema = z.object({
  title: z.string().min(2, "应用名称至少2个字符").max(100, "应用名称最多100个字符"),
  description: z.string().min(10, "描述至少10个字符").max(2000, "描述最多2000个字符"),
  category: z.string().min(1, "请选择分类"),
  appType: z.enum(["WEB", "API", "PLUGIN", "MINIPROGRAM", "BOT", "OTHER"], {
    message: "请选择有效的应用类型",
  }),
  coverImage: z.string().regex(/^(https?:\/\/|\/)/, "封面图URL格式无效").optional().or(z.literal("")),
  screenshots: z.array(z.string().regex(/^(https?:\/\/|\/)/, "截图URL格式无效")).optional(),
  price: z.number().min(0, "价格不能为负数").max(1000000, "价格不能超过1000000"),
  pricePerUse: z.number().min(-1).max(1000000).optional(),
  usageInstructions: z.string().max(5000).optional(),
  accessUrl: z.string().url("访问URL必须是有效的URL").min(1, "请输入访问地址"),
  tags: z.array(z.string()).max(10, "最多10个标签").optional(),
});

// 用户注册验证 Schema
export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符").max(50, "密码最多50个字符"),
  name: z.string().min(2, "昵称至少2个字符").max(50, "昵称最多50个字符"),
  phone: z.string().optional(),
});

// 用户登录验证 Schema
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

// 评论验证 Schema
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(5).optional(),
});

// 购买验证 Schema
export const purchaseSchema = z.object({
  type: z.enum(["buyout", "per_use"]),
});
