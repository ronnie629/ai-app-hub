import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { AdminUsersClient } from "@/components/admin-users-client";

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

  const serializedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    points: user.points,
    profession: user.profession,
    interests: user.interests,
    workYears: user.workYears,
    appDomains: user.appDomains,
    bio: user.bio,
    avatar: user.avatar,
    isDeveloper: user.isDeveloper,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    _count: user._count,
  }));

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="users" />
        <AdminUsersClient users={serializedUsers} />
      </div>
    </div>
  );
}
