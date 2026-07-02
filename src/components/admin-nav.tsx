import Link from "next/link";

interface AdminNavProps {
  active: string;
}

export function AdminNav({ active }: AdminNavProps) {
  const links = [
    { href: "/admin", key: "overview", label: "概览" },
    { href: "/admin/apps", key: "apps", label: "应用审核" },
    { href: "/admin/users", key: "users", label: "用户管理" },
  ];

  return (
    <nav className="space-y-1">
      <div className="mb-2 px-4 text-xs font-medium text-gray-400 uppercase">管理后台</div>
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
            active === link.key
              ? "bg-purple-50 text-purple-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <div className="my-3 border-t border-gray-200" />
      <Link
        href="/dashboard"
        className="block rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        返回用户中心
      </Link>
    </nav>
  );
}
