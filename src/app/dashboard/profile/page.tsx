import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { ProfileForm } from "@/components/profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      bio: true,
      profession: true,
      interests: true,
      workYears: true,
      isDeveloper: true,
      appDomains: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const safeUser = {
    ...user,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="profile" role={session.role} />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">个人资料</h1>
            <p className="text-gray-500 text-sm mt-1">邮箱不可修改，其他信息随时可更新</p>
          </div>

          {/* Account info card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-4">账号信息</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">邮箱</dt>
                <dd className="font-medium text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">角色</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                    user.role === "DEVELOPER" ? "bg-indigo-100 text-indigo-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {user.role === "ADMIN" ? "管理员" : user.role === "DEVELOPER" ? "开发者" : "普通用户"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">注册时间</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleString("zh-CN")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">最后登录</dt>
                <dd className="font-medium text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Edit form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-4">编辑资料</h2>
            <ProfileForm user={safeUser} />
          </div>

          {/* Change password */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-1">修改密码</h2>
            <p className="text-sm text-gray-500 mb-4">建议定期更换密码以保障账号安全</p>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
