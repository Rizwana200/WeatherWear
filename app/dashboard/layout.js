
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Home", href: "/dashboard", icon: "⌂" },
  { label: "Compare", href: "/dashboard/compare", icon: "⇄" },
  { label: "Store", href: "/dashboard/store", icon: "▣" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      {/* Compact top navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex min-h-[66px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand on the left */}
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-xl text-white">
              🌦️
            </span>

            <span>
              <span className="block text-base font-extrabold tracking-tight text-slate-900">
                WeatherWear
              </span>
              <span className="hidden text-[11px] text-slate-500 sm:block">
                Weather meets style
              </span>
            </span>
          </Link>

          {/* Menu aligned to the right */}
          <nav
            aria-label="Main navigation"
            className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
          >
            {menuItems.map((item) => {
              const isHome = item.href === "/dashboard";

              const isActive = isHome
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span className="text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main page content */}
      <main className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        WeatherWear · Weather-aware recommendations for everyday style
      </footer>
    </div>
  );
}
