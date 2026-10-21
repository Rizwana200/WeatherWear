
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", icon: "⌂", label: "Home", exact: true },
  { href: "/dashboard/search", icon: "⌕", label: "Search" },
  { href: "/dashboard/compare", icon: "⇄", label: "Compare" },
  { href: "/dashboard/style", icon: "♧", label: "Style" },
];

export default function MobileNavigation({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard navigation"
      className="grid grid-cols-4 gap-2"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-3 text-xs font-medium transition ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
