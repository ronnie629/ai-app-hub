import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, APP_TYPES, safeJsonParse } from "@/lib/constants";
import { PublishForm } from "@/components/publish-form";

export default async function EditAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const app = await prisma.app.findUnique({ where: { id } });
  if (!app) redirect("/dashboard/apps");
  if (app.developerId !== session.id && session.role !== "ADMIN") {
    redirect("/dashboard/apps");
  }

  const initialData = {
    id: app.id,
    title: app.title,
    description: app.description,
    category: app.category,
    appType: app.appType,
    price: app.price,
    accessUrl: app.accessUrl,
    usageInstructions: app.usageInstructions,
    coverImage: app.coverImage,
    screenshots: safeJsonParse<string[]>(app.screenshots, []),
    tags: safeJsonParse<string[]>(app.tags, []),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">编辑应用</h1>
          <p className="text-gray-500 mt-1">
            修改后状态会重置为「待审核」，需要重新审核才能上架
          </p>
        </div>
        <span className="rounded-full bg-yellow-50 text-yellow-700 px-3 py-1 text-xs font-medium">
          编辑模式
        </span>
      </div>

      <PublishForm
        categories={CATEGORIES}
        appTypes={APP_TYPES}
        initialData={initialData}
        mode="edit"
      />
    </div>
  );
}
