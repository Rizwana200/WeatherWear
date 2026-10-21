
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", icon: "⌂", label: "Home", exact: true },
  { href: "/dashboard/compare", icon: "⇄", label: "Compare" },
  { href: "/dashboard/store", icon: "🛍", label: "Store" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm transition-[width] duration-300 md:flex lg:top-5 lg:h-[calc(100vh-2.5rem)] ${
        collapsed ? "w-[76px]" : "w-60 lg:w-64"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex min-h-[64px] items-center gap-3 px-1 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link
          href="/dashboard"
          aria-label="WeatherWear Home"
          className={`flex min-w-0 items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl text-white shadow-sm">
            🌦️
          </span>

          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-slate-900">
                WeatherWear
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Weather meets style
              </span>
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${
            collapsed ? "absolute right-1 top-[58px]" : ""
          }`}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
        </button>
      </div>

      {/* Navigation */}
      <div
        className={`mb-3 mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
          collapsed ? "text-center" : "px-3"
        }`}
      >
        {collapsed ? "MENU" : "Workspace"}
      </div>

      <nav aria-label="Main navigation" className="space-y-1.5">
        {menuItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-all duration-200 ${
                collapsed ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-indigo-600" />
              )}

              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xl transition ${
                  active
                    ? "text-indigo-700"
                    : "text-slate-500 group-hover:text-indigo-600"
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
