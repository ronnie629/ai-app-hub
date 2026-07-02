import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatPoints, formatDate, timeAgo } from "@/lib/constants";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/users");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { apps: true, purchases: true } },
    },
  });

  const roleLabels: Record<string, { label: string; cls: string }> = {
    ADMIN: { label: "管理员", cls: "bg-purple-50 text-purple-600" },
    DEVELOPER: { label: "开发者", cls: "bg-indigo-50 text-indigo-600" },
    USER: { label: "普通用户", cls: "bg-gray-50 text-gray-500" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="users" />
        <div>
          <h1 className="text-2xl font-bold mb-6">用户管理</h1>
          <p className="text-sm text-gray-500 mb-4">共 {users.length} 位用户</p>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    {[
                      "用户信息",
                      "角色",
                      "手机号",
                      "职业",
                      "积分",
                      "发布应用",
                      "购买次数",
                      "注册时间",
                      "最近登录",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const role = roleLabels[user.role] || { label: user.role, cls: "bg-gray-50 text-gray-500" };
                    return (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${role.cls}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {user.phone || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {user.profession || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-amber-600">⚡{formatPoints(user.points)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          {user._count.apps}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          {user._count.purchases}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {user.lastLoginAt ? (
                            <span className="text-indigo-600">{timeAgo(user.lastLoginAt)}</span>
                          ) : (
                            <span className="text-gray-300">从未登录</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
