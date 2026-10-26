"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const WEATHER_KEY = "weatherwear-weather";
const WISHLIST_KEY = "weatherwear-wishlist";
const PAGE_SIZE = 20;

const genderOptions = ["Everyone", "Women", "Men"];

/*
  Each climate re-themes the hero, buttons and active chips, so the whole
  page "feels" like the weather you picked. Class names are written out in
  full so Tailwind can detect them.
*/
const climates = {
  Hot: {
    emoji: "☀️",
    hint: "32°C and above",
    title: "Summer essentials",
    description:
      "Lightweight styles and breathable fabrics for the hottest days.",
    hero: "bg-amber-100",
    heroText: "text-amber-950",
    soft: "bg-amber-50 text-amber-800 border-amber-200",
    solid: "bg-amber-600 hover:bg-amber-700",
    ring: "focus-visible:ring-amber-500",
  },
  Warm: {
    emoji: "🌤️",
    hint: "24–31°C",
    title: "Warm-weather favourites",
    description: "Easy, light outfits for comfortable everyday wear.",
    hero: "bg-orange-100",
    heroText: "text-orange-950",
    soft: "bg-orange-50 text-orange-800 border-orange-200",
    solid: "bg-orange-600 hover:bg-orange-700",
    ring: "focus-visible:ring-orange-500",
  },
  Mild: {
    emoji: "🌿",
    hint: "16–23°C",
    title: "Everyday essentials",
    description: "Versatile pieces that work from morning to evening.",
    hero: "bg-emerald-100",
    heroText: "text-emerald-950",
    soft: "bg-emerald-50 text-emerald-800 border-emerald-200",
    solid: "bg-emerald-600 hover:bg-emerald-700",
    ring: "focus-visible:ring-emerald-500",
  },
  Rainy: {
    emoji: "🌧️",
    hint: "Rain expected",
    title: "Rain-ready collection",
    description: "Raincoats, practical layers and weather-ready footwear.",
    hero: "bg-sky-100",
    heroText: "text-sky-950",
    soft: "bg-sky-50 text-sky-800 border-sky-200",
    solid: "bg-sky-600 hover:bg-sky-700",
    ring: "focus-visible:ring-sky-500",
  },
  Cool: {
    emoji: "🍃",
    hint: "8–15°C",
    title: "Comfortable layers",
    description: "Cardigans, hoodies and light jackets for easy layering.",
    hero: "bg-violet-100",
    heroText: "text-violet-950",
    soft: "bg-violet-50 text-violet-800 border-violet-200",
    solid: "bg-violet-600 hover:bg-violet-700",
    ring: "focus-visible:ring-violet-500",
  },
  Cold: {
    emoji: "❄️",
    hint: "Below 8°C",
    title: "Winter wardrobe",
    description: "Cozy sweaters, warm jackets and shawls for cold days.",
    hero: "bg-blue-100",
    heroText: "text-blue-950",
    soft: "bg-blue-50 text-blue-800 border-blue-200",
    solid: "bg-blue-600 hover:bg-blue-700",
    ring: "focus-visible:ring-blue-500",
  },
};

const climateOrder = ["Hot", "Warm", "Mild", "Rainy", "Cool", "Cold"];

const genderCategories = {
  Women: [
    "All",
    "Tops & Tunics",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Skirts",
    "Jackets & Coats",
    "Sweaters & Hoodies",
    "Footwear",
    "Accessories",
  ],
  Men: [
    "All",
    "Shirts",
    "Tops & Tunics",
    "Jeans & Trousers",
    "Jackets & Coats",
    "Sweaters & Hoodies",
    "Footwear",
    "Accessories",
  ],
  Everyone: [
    "All",
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Skirts",
    "Jackets & Coats",
    "Sweaters & Hoodies",
    "Footwear",
    "Accessories",
  ],
};

const weatherCategories = {
  Hot: [
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Skirts",
    "Footwear",
    "Accessories",
  ],
  Warm: [
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Skirts",
    "Footwear",
    "Accessories",
  ],
  Mild: [
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Skirts",
    "Jackets & Coats",
    "Footwear",
    "Accessories",
  ],
  Rainy: [
    "Tops & Tunics",
    "Shirts",
    "Dresses",
    "Jeans & Trousers",
    "Jackets & Coats",
    "Footwear",
    "Accessories",
  ],
  Cool: [
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Jackets & Coats",
    "Sweaters & Hoodies",
    "Footwear",
    "Accessories",
  ],
  Cold: [
    "Tops & Tunics",
    "Shirts",
    "Kurtis & Kurtas",
    "Dresses",
    "Sarees",
    "Ethnic Wear",
    "Jeans & Trousers",
    "Jackets & Coats",
    "Sweaters & Hoodies",
    "Footwear",
    "Accessories",
  ],
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function detectClimate(weather) {
  const current = weather?.current;
  if (!current) return null;

  const temperature = Number(current.temperature_2m);
  const code = Number(current.weather_code);
  const today = current.time?.slice(0, 10);
  const index = weather?.daily?.time?.indexOf(today) ?? -1;

  const rainProbability =
    index >= 0
      ? Number(weather.daily.precipitation_probability_max?.[index] ?? 0)
      : 0;

  const precipitation =
    index >= 0
      ? Number(weather.daily.precipitation_sum?.[index] ?? 0)
      : Number(current.precipitation ?? 0);

  if (
    rainProbability >= 40 ||
    precipitation >= 1 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 99)
  ) {
    return "Rainy";
  }

  if (temperature >= 32) return "Hot";
  if (temperature >= 24) return "Warm";
  if (temperature >= 16) return "Mild";
  if (temperature >= 8) return "Cool";
  return "Cold";
}

function readWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/* Words people type that don't appear in a product title or category name. */
const searchSynonyms = {
  shoe: "footwear",
  sandal: "footwear",
  heel: "footwear",
  sneaker: "footwear",
  boot: "footwear",
  slipper: "footwear",
  chappal: "footwear",
  flat: "footwear",
  pant: "trousers",
  trouser: "trousers",
  jean: "jeans",
  tshirt: "tops",
  "t-shirt": "tops",
  top: "tunics",
  frock: "dress",
  gown: "dress",
  lehenga: "ethnic",
  salwar: "ethnic",
  dupatta: "ethnic",
  bag: "accessories",
  watch: "accessories",
  jewellery: "accessories",
  jewelry: "accessories",
  scarf: "accessories",
  shawl: "accessories",
};

/* Words that mean "for women" or "for men" rather than part of a product name. */
const womenWords = ["women", "woman", "womens", "ladies", "lady", "girls", "girl", "female"];
const menWords = ["men", "man", "mens", "boys", "boy", "male"];

/*
  Every word typed must match the title or category (plurals allowed).
  Gender words like "women" filter by who the product is for instead of
  being matched against the title. Synonyms ("shoes" -> footwear) are only
  used when there is no direct match, so they never crowd out exact results.
*/
function matchesSearch(product, query, useSynonyms = false) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/['’]s?$/, ""))
    .filter(Boolean);

  const wantsWomen = words.some((word) => womenWords.includes(word));
  const wantsMen = words.some((word) => menWords.includes(word));

  if (wantsWomen !== wantsMen && product._gender) {
    if (wantsWomen && product._gender !== "Women") return false;
    if (wantsMen && product._gender !== "Men") return false;
  }

  const textWords = words.filter(
    (word) => !womenWords.includes(word) && !menWords.includes(word)
  );
  if (textWords.length === 0) return true;

  const haystack = `${product.title || ""} ${product.category || ""}`.toLowerCase();

  return textWords.every((word) => {
    const base = word.length > 3 ? word.replace(/(es|s)$/, "") : word;
    const synonym = searchSynonyms[word] || searchSynonyms[base];

    return (
      haystack.includes(word) ||
      haystack.includes(base) ||
      (useSynonyms && synonym ? haystack.includes(synonym) : false)
    );
  });
}

/* "women scarfs" -> { text: "scarfs", gender: "Women" } */
function parseSearch(query) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/['’]s?$/, ""))
    .filter(Boolean);

  const wantsWomen = words.some((word) => womenWords.includes(word));
  const wantsMen = words.some((word) => menWords.includes(word));

  return {
    text: words
      .filter((word) => !womenWords.includes(word) && !menWords.includes(word))
      .join(" "),
    gender: wantsWomen !== wantsMen ? (wantsWomen ? "Women" : "Men") : null,
  };
}

function getProductId(product) {
  return String(product?.id || product?.url || "");
}

function formatPrice(product) {
  if (product.price == null) return "View price";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: product.currency || "INR",
    maximumFractionDigits: 0,
  }).format(product.price);
}

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

/*
  All motion lives here. Everything is wrapped in "no-preference" so people
  who ask their device for reduced motion get a still page.
*/
function AnimationStyles() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        @keyframes ww-drop {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ww-hero-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ww-fade-up {
          from { opacity: 0; transform: translateY(18px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ww-float {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes ww-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.45); }
          70%  { transform: scale(.9); }
          100% { transform: scale(1); }
        }
        @keyframes ww-shimmer {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }

        .ww-drop    { animation: ww-drop .5s cubic-bezier(.22,1,.36,1) both; }
        .ww-hero-in { animation: ww-hero-in .55s cubic-bezier(.22,1,.36,1) both; }
        .ww-hero-in-2 { animation: ww-hero-in .55s .1s cubic-bezier(.22,1,.36,1) both; }
        .ww-fade-up {
          animation: ww-fade-up .5s cubic-bezier(.22,1,.36,1) both;
          animation-delay: var(--d, 0ms);
        }
        .ww-float { animation: ww-float 6s ease-in-out infinite; }
        .ww-pop   { animation: ww-pop .45s ease-out; }
        .ww-shimmer {
          background-image: linear-gradient(90deg, #f5f5f4 25%, #e7e5e4 50%, #f5f5f4 75%);
          background-size: 200% 100%;
          animation: ww-shimmer 1.4s linear infinite;
        }
        .ww-buy .ww-arrow { display: inline-block; transition: transform .2s ease; }
        .ww-buy:hover .ww-arrow { transform: translate(3px, -3px); }
      }
    `}</style>
  );
}

function SiteHeader({ search, onSearch, onSubmit, wishlistCount, wishlistOnly, onToggleWishlist, theme }) {
  return (
    <header className="ww-drop sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <a href="#top" aria-label="Back to top" className="flex shrink-0 items-center">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg text-white ${theme.solid.split(" ")[0]}`}
            aria-hidden="true"
          >
            {theme.emoji}
          </span>
        </a>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 focus-within:border-stone-400 focus-within:bg-white">
          <svg
            className="h-4 w-4 shrink-0 text-stone-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" />
          </svg>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="Search Meesho: skirts, women scarfs, jackets"
            aria-label="Search products"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="text-lg leading-none text-stone-400 hover:text-stone-900"
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={onToggleWishlist}
          aria-pressed={wishlistOnly}
          className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
            wishlistOnly
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-stone-200 bg-white text-stone-700 hover:border-rose-300 hover:text-rose-600"
          }`}
        >
          <span aria-hidden="true">{wishlistOnly ? "♥" : "♡"}</span>
          <span className="hidden sm:inline">Wishlist</span>
          <span
            key={wishlistCount}
            className={`ww-pop rounded-full px-2 py-0.5 text-xs ${
              wishlistOnly ? "bg-white/20" : "bg-stone-100 text-stone-600"
            }`}
          >
            {wishlistCount}
          </span>
        </button>
      </div>
    </header>
  );
}

function WeatherHero({ climate, theme, onSelect }) {
  return (
    <section
      className={`relative overflow-hidden ${theme.hero} ${theme.heroText} transition-colors duration-700`}
      aria-labelledby="hero-title"
    >
      <span
        key={climate}
        className="ww-float ww-hero-in pointer-events-none absolute -right-6 -top-4 select-none text-[9rem] opacity-20 sm:text-[14rem]"
        aria-hidden="true"
      >
        {theme.emoji}
      </span>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div key={climate} className="max-w-2xl">
            <p className="ww-hero-in text-sm font-semibold opacity-70">
              Dressed for today's weather
            </p>
            <h1
              id="hero-title"
              className="ww-hero-in mt-2 text-4xl font-black tracking-tight sm:text-5xl"
            >
              {theme.title}
            </h1>
            <p className="ww-hero-in-2 mt-3 max-w-lg text-base leading-7 opacity-80">
              {theme.description}
            </p>
          </div>

          <div
            className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:pb-0"
            role="group"
            aria-label="Choose your weather"
          >
            {climateOrder.map((name) => {
              const active = climate === name;
              return (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  aria-pressed={active}
                  className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-3 text-sm font-bold transition motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 ${theme.ring} ${
                    active
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-white/70 text-slate-800 hover:bg-white"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {climates[name].emoji}
                  </span>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterBar({
  gender,
  onGender,
  categories,
  category,
  onCategory,
  sortBy,
  onSort,
  theme,
}) {
  return (
    <div className="sticky top-[65px] z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-full bg-stone-100 p-1"
            role="group"
            aria-label="Shop for"
          >
            {genderOptions.map((option) => (
              <button
                key={option}
                onClick={() => onGender(option)}
                aria-pressed={gender === option}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${theme.ring} ${
                  gender === option
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-stone-500 hover:text-slate-900"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-stone-500">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => onSort(event.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-semibold outline-none focus:border-stone-400"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Category">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => onCategory(item)}
              aria-pressed={category === item}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${theme.ring} ${
                category === item
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index, saved, onToggle, theme }) {
  return (
    <article
      style={{ "--d": `${(index % 10) * 55}ms` }}
      className="ww-fade-up group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition motion-safe:hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${product.title} on Meesho`}
          className="flex h-full w-full items-center justify-center text-6xl"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              loading={index < 4 ? "eager" : "lazy"}
              className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <span aria-hidden="true">👕</span>
          )}
        </a>

        <button
          onClick={() => onToggle(product)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 motion-safe:hover:scale-110 ${
            saved
              ? "bg-rose-600 text-white"
              : "bg-white text-stone-500 hover:text-rose-600"
          }`}
        >
          <span
            key={saved ? "on" : "off"}
            className={`inline-block ${saved ? "ww-pop" : ""}`}
          >
            {saved ? "♥" : "♡"}
          </span>
        </button>

        {product.rating != null && (
          <span className="absolute bottom-3 left-3 rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-sm">
            ★ {product.rating}
            {product.ratingCount
              ? ` · ${Number(product.ratingCount).toLocaleString("en-IN")}`
              : ""}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="truncate text-xs font-medium text-stone-500">
          {product.category || "Fashion"}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">
          {product.title}
        </h3>

        <p className="mt-3 text-lg font-extrabold text-slate-900">
          {formatPrice(product)}
        </p>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`ww-buy mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme.solid} ${theme.ring}`}
        >
          Buy on Meesho
          <span className="ww-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function ProductSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, item) => (
        <div
          key={item}
          style={{ "--d": `${item * 40}ms` }}
          className="ww-fade-up overflow-hidden rounded-2xl border border-stone-200 bg-white"
        >
          <div className="ww-shimmer aspect-[4/5] bg-stone-100" />
          <div className="space-y-3 p-4">
            <div className="ww-shimmer h-3 w-1/3 rounded bg-stone-100" />
            <div className="ww-shimmer h-4 rounded bg-stone-100" />
            <div className="ww-shimmer h-4 w-2/3 rounded bg-stone-100" />
            <div className="ww-shimmer h-10 rounded-xl bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateMessage({ emoji, title, text, actionLabel, onAction }) {
  return (
    <div className="ww-hero-in mx-auto max-w-md rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        {emoji}
      </span>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">{text}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-5 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function StorePage() {
  const [climate, setClimate] = useState("Warm");
  const [gender, setGender] = useState("Everyone");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Ignore responses from older clicks when a newer request has started.
  const requestId = useRef(0);

  const theme = climates[climate] || climates.Warm;

  const availableCategories = useMemo(() => {
    const genderMenu = genderCategories[gender] || genderCategories.Everyone;
    const weatherMenu = weatherCategories[climate] || weatherCategories.Warm;

    return genderMenu.filter(
      (item) => item === "All" || weatherMenu.includes(item)
    );
  }, [gender, climate]);

  /* Restore saved weather + wishlist */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEATHER_KEY);

      if (raw) {
        const saved = JSON.parse(raw);
        const detected = detectClimate(saved?.weather || null);
        if (detected) setClimate(detected);
      }

      setWishlist(readWishlist());
    } catch (err) {
      console.error("Could not restore saved WeatherWear data:", err);
    } finally {
      setReady(true);
    }
  }, []);

  // Wait for a pause in typing before asking the server (clearing is instant).
  useEffect(() => {
    if (!search.trim()) {
      setDebouncedSearch("");
      return undefined;
    }
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // While searching, look across all categories so a selected chip can't hide results.
  const searching = debouncedSearch.trim().length > 0;
  const parsedSearch = useMemo(
    () => parseSearch(debouncedSearch),
    [debouncedSearch]
  );

  /* Load products (the server filters by climate, gender and category) */
  const loadProducts = useCallback(async () => {
    const thisRequest = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const selectedGenders = parsedSearch.gender
        ? [parsedSearch.gender]
        : gender === "Everyone"
          ? ["Women", "Men"]
          : [gender];

      const results = await Promise.all(
        selectedGenders.map(async (selectedGender) => {
          const params = new URLSearchParams({
            climate,
            gender: selectedGender,
            category: searching ? "All" : category,
          });

          // The server searches Meesho for this text.
          if (parsedSearch.text) params.set("search", parsedSearch.text);

          const response = await fetch(`/api/products?${params}`, {
            cache: "no-store",
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Product search failed.");
          }

          return Array.isArray(result.products)
            ? result.products.map((product) => ({
                ...product,
                _gender: selectedGender,
              }))
            : [];
        })
      );

      if (thisRequest !== requestId.current) return;

      const unique = new Map();

      results.flat().forEach((product) => {
        if (!product?.url || !product?.title) return;

        const id = getProductId(product);
        if (id && !unique.has(id)) unique.set(id, product);
      });

      setProducts(Array.from(unique.values()));
    } catch (err) {
      if (thisRequest !== requestId.current) return;

      setProducts([]);
      setError(err.message || "Could not load products. Please try again.");
    } finally {
      if (thisRequest === requestId.current) setLoading(false);
    }
  }, [climate, gender, category, searching, parsedSearch]);

  useEffect(() => {
    if (ready) loadProducts();
  }, [ready, loadProducts]);

  /* Start from the first page whenever the visible list changes */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [products, search, sortBy, wishlistOnly]);

  const selectClimate = (next) => {
    setClimate(next);
    setCategory("All");
    setSearch("");
    setWishlistOnly(false);
  };

  const selectGender = (next) => {
    setGender(next);
    setCategory("All");
    setSearch("");
    setWishlistOnly(false);
  };

  const selectCategory = (next) => {
    setCategory(next);
    setWishlistOnly(false);
  };

  const toggleWishlist = (product) => {
    const productId = getProductId(product);
    const exists = wishlist.some((item) => getProductId(item) === productId);

    const updated = exists
      ? wishlist.filter((item) => getProductId(item) !== productId)
      : [
          ...wishlist,
          {
            id: product.id || product.url,
            title: product.title,
            image: product.image,
            price: product.price,
            currency: product.currency,
            rating: product.rating,
            ratingCount: product.ratingCount,
            category: product.category,
            url: product.url,
            _gender: product._gender,
          },
        ];

    setWishlist(updated);

    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Could not save wishlist:", err);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setWishlistOnly(false);
    setSortBy("recommended");
  };

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((item) => getProductId(item))),
    [wishlist]
  );

  const filteredProducts = useMemo(() => {
    // The wishlist view shows saved items from any weather, not just this search.
    const source = wishlistOnly ? wishlist : products;
    // The server already searched Meesho, so only the wishlist is filtered here.
    let list = source;

    if (wishlistOnly && search.trim()) {
      list = source.filter((product) => matchesSearch(product, search));

      if (list.length === 0) {
        list = source.filter((product) => matchesSearch(product, search, true));
      }
    }

    if (sortBy === "price-low") {
      list = [...list].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
      );
    } else if (sortBy === "price-high") {
      list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else if (sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return list;
  }, [products, wishlist, wishlistOnly, search, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const showLoading = loading && !wishlistOnly;
  const showError = !loading && error && !wishlistOnly;
  const showEmpty = !showLoading && !showError && filteredProducts.length === 0;
  const showGrid = !showLoading && !showError && filteredProducts.length > 0;

  const heading = wishlistOnly
    ? "Your wishlist"
    : searching
      ? `Results for “${search.trim()}”`
      : gender === "Everyone"
      ? "All collections"
      : `${gender}'s collection`;

  return (
    <main id="top" className="min-h-screen bg-stone-50 text-slate-900">
      <AnimationStyles />
      <SiteHeader
        search={search}
        onSearch={setSearch}
        onSubmit={() => setDebouncedSearch(search)}
        wishlistCount={wishlist.length}
        wishlistOnly={wishlistOnly}
        onToggleWishlist={() => setWishlistOnly((value) => !value)}
        theme={theme}
      />

      <WeatherHero climate={climate} theme={theme} onSelect={selectClimate} />

      <FilterBar
        gender={gender}
        onGender={selectGender}
        categories={availableCategories}
        category={category}
        onCategory={selectCategory}
        sortBy={sortBy}
        onSort={setSortBy}
        theme={theme}
      />

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        aria-labelledby="products-title"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="products-title" className="text-2xl font-extrabold tracking-tight">
              {heading}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {showLoading
                ? searching
                  ? `Searching Meesho for “${debouncedSearch.trim()}”…`
                  : "Finding the best picks…"
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1 ? "product" : "products"
                  }${category !== "All" && !wishlistOnly && !searching ? ` in ${category}` : ""}${searching && !wishlistOnly ? " from Meesho" : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.soft}`}
            >
              {theme.emoji} {climate} · {theme.hint}
            </span>
            {(search || category !== "All" || wishlistOnly || sortBy !== "recommended") && (
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-stone-600 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {showLoading && <ProductSkeletons />}

        {showError && (
          <StateMessage
            emoji="🛍️"
            title="We couldn't load the products"
            text={error}
            actionLabel="Try again"
            onAction={loadProducts}
          />
        )}

        {showGrid && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={getProductId(product)}
                  product={product}
                  index={index}
                  saved={wishlistIds.has(getProductId(product))}
                  onToggle={toggleWishlist}
                  theme={theme}
                />
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div className="mt-10 text-center">
                <p className="mb-3 text-sm text-stone-500">
                  Showing {visibleProducts.length} of {filteredProducts.length}
                </p>
                <button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-full border border-slate-900 bg-white px-8 py-3 text-sm font-bold text-slate-900 transition motion-safe:active:scale-95 hover:bg-slate-900 hover:text-white"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}

        {showEmpty && (
          <StateMessage
            emoji={wishlistOnly ? "♡" : "🔎"}
            title={wishlistOnly ? "Your wishlist is empty" : "No matching products"}
            text={
              wishlistOnly
                ? "Tap the heart on any product to save it here."
                : searching
                  ? "Nothing came back from Meesho for that search. Try different words, like “skirt” instead of “skirts”."
                  : "Try a different category, or clear your search and filters."
            }
            actionLabel={wishlistOnly ? "Browse products" : "Clear filters"}
            onAction={clearFilters}
          />
        )}
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-800">WeatherWear</p>
          <p>Clothing picked for the forecast. Purchases are completed on Meesho.</p>
        </div>
      </footer>
    </main>
  );
}