
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pageInfo = {
  "/dashboard": {
    title: "Home",
    description: "Your daily weather at a glance",
  },
  "/dashboard/search": {
    title: "Search Location",
    description: "Find weather anywhere",
  },
  "/dashboard/compare": {
    title: "Compare Weather",
    description: "Compare conditions across destinations",
  },
  "/dashboard/style": {
    title: "Style Studio",
    description: "Make weather work with your style",
  },
};

export default function Header({ onMenuClick, mobileMenuOpen }) {
  const pathname = usePathname();

  const info =
    pageInfo[pathname] ||
    (pathname.startsWith("/dashboard/compare")
      ? pageInfo["/dashboard/compare"]
      : pathname.startsWith("/dashboard/search")
        ? pageInfo["/dashboard/search"]
        : pathname.startsWith("/dashboard/style")
          ? pageInfo["/dashboard/style"]
          : pageInfo["/dashboard"]);

  return (
    <header className="sticky top-3 z-30 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 sm:py-4 lg:top-5">
      <div className="flex min-h-11 items-center justify-between gap-4">
        {/* Page identity */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50 md:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden h-2 w-2 rounded-full bg-emerald-500 sm:block" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                WeatherWear
              </p>
            </div>

            <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {info.title}
            </h1>

            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              {info.description}
            </p>
          </div>
        </div>

        {/* Header action */}
        <Link
          href="/dashboard/search"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4 sm:text-sm"
        >
          <span className="text-base leading-none">+</span>
          <span className="hidden sm:inline">Search location</span>
          <span className="sm:hidden">Location</span>
        </Link>
      </div>
    </header>
  );
}
