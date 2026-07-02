import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatPoints, formatDate } from "@/lib/constants";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/users");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { apps: true, purchases: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="users" />
        <div>
          <h1 className="text-2xl font-bold mb-6">用户管理</h1>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">积分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">应用</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">购买</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN" ? "bg-purple-50 text-purple-600" :
                        user.role === "DEVELOPER" ? "bg-indigo-50 text-indigo-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {user.role === "ADMIN" ? "管理员" : user.role === "DEVELOPER" ? "开发者" : "用户"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600 font-medium">⚡{formatPoints(user.points)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user._count.apps}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user._count.purchases}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
