import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CATEGORIES, APP_TYPES } from "@/lib/constants";
import { PublishForm } from "@/components/publish-form";

export default async function PublishPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/publish");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">发布 AI 应用</h1>
        <p className="text-gray-500 mt-1">把你的 AI 应用分享给更多用户，开始赚取积分</p>
      </div>

      <PublishForm categories={CATEGORIES} appTypes={APP_TYPES} />
    </div>
  );
}
