import Link from "next/link";

interface DashboardNavProps {
  active: string;
  role: string;
}

export function DashboardNav({ active, role }: DashboardNavProps) {
  const links = [
    { href: "/dashboard", key: "overview", label: "概览" },
    { href: "/dashboard/apps", key: "apps", label: "我的应用" },
    { href: "/dashboard/points", key: "points", label: "积分充值" },
    { href: "/dashboard/earnings", key: "earnings", label: "收入记录" },
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
            active === link.key
              ? "bg-indigo-50 text-indigo-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
      {role === "ADMIN" && (
        <>
          <div className="my-3 border-t border-gray-200" />
          <Link
            href="/admin"
            className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
              active === "admin" ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            管理后台
          </Link>
        </>
      )}
    </nav>
  );
}
