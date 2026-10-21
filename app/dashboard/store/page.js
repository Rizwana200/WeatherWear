
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const WEATHER_KEY = "weatherwear-weather";
const WISHLIST_KEY = "weatherwear-wishlist";

const weatherSearches = {
  Hot: "summer cotton tops shirts shorts dresses",
  Warm: "casual tops shirts trousers dresses",
  Mild: "casual shirts trousers skirts kurtis",
  Cool: "hoodies jeans cardigans jackets",
  Cold: "sweaters winter jackets warm outfits",
  Rainy: "raincoats waterproof jackets rain footwear",
};

const climateTerms = {
  Hot: "summer lightweight breathable",
  Warm: "everyday casual comfortable",
  Mild: "versatile everyday",
  Cool: "light warm layers",
  Cold: "winter warm cozy",
  Rainy: "rain waterproof weather ready",
};

const categorySearches = {
  "Tops & Tunics": "tops tunics blouses",
  Shirts: "casual shirts",
  "Kurtis & Kurtas": "kurtis kurtas",
  Dresses: "casual dresses gowns",
  Sarees: "sarees",
  "Ethnic Wear": "ethnic wear salwar suits lehengas",
  "Jeans & Trousers": "jeans trousers pants leggings",
  Skirts: "skirts",
  "Jackets & Coats": "jackets coats raincoats blazers",
  "Sweaters & Hoodies": "sweaters hoodies cardigans",
  Footwear: "shoes sandals sneakers boots slippers",
  Accessories: "bags caps scarves belts",
};

const categories = [
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
];

const genderOptions = [
  { name: "Everyone", emoji: "🛍️" },
  { name: "Women", emoji: "👗" },
  { name: "Men", emoji: "👔" },
];

const weatherOptions = [
  { name: "Hot", emoji: "☀️", color: "bg-amber-100" },
  { name: "Warm", emoji: "🌤️", color: "bg-orange-100" },
  { name: "Mild", emoji: "🌿", color: "bg-emerald-100" },
  { name: "Rainy", emoji: "🌧️", color: "bg-sky-100" },
  { name: "Cool", emoji: "🍃", color: "bg-violet-100" },
  { name: "Cold", emoji: "❄️", color: "bg-blue-100" },
];

const weatherDetails = {
  Hot: {
    emoji: "☀️",
    title: "Summer styles",
    description: "Breathable fabrics and lightweight outfits.",
    color: "from-orange-100 to-amber-50",
  },
  Warm: {
    emoji: "🌤️",
    title: "Everyday favourites",
    description: "Comfortable outfits for everyday adventures.",
    color: "from-pink-100 to-orange-50",
  },
  Mild: {
    emoji: "🌿",
    title: "Effortless everyday wear",
    description: "Versatile outfits for comfortable days.",
    color: "from-emerald-100 to-lime-50",
  },
  Rainy: {
    emoji: "🌧️",
    title: "Rain-ready fashion",
    description: "Explore raincoats, jackets and practical footwear.",
    color: "from-sky-100 to-indigo-50",
  },
  Cool: {
    emoji: "🍃",
    title: "Comfortable layers",
    description: "Hoodies, jeans and lightweight jackets.",
    color: "from-violet-100 to-purple-50",
  },
  Cold: {
    emoji: "❄️",
    title: "Cozy winter looks",
    description: "Sweaters, jackets and warm outfits.",
    color: "from-blue-100 to-cyan-50",
  },
};

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
    const saved = JSON.parse(
      localStorage.getItem(WISHLIST_KEY) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function matchesGender(product, gender) {
  const text =
    `${product.title || ""} ${product.category || ""}`.toLowerCase();

  const explicitlyMen =
    /\b(men|mens|men's|boys|boy's|male|menswear)\b/i.test(text);

  const explicitlyWomen =
    /\b(women|womens|women's|ladies|lady|girls|girl's|female)\b/i.test(text);

  if (gender === "Women" && explicitlyMen && !explicitlyWomen) {
    return false;
  }

  if (gender === "Men" && explicitlyWomen && !explicitlyMen) {
    return false;
  }

  return true;
}

function matchesCategory(product, selectedCategory) {
  if (selectedCategory === "All") return true;

  const text =
    `${product.title || ""} ${product.category || ""}`.toLowerCase();

  const rules = {
    "Tops & Tunics": /\b(top|tops|tunic|tunics|blouse|blouses|tee|tees)\b/,
    Shirts: /\b(shirt|shirts)\b/,
    "Kurtis & Kurtas": /\b(kurti|kurtis|kurta|kurtas)\b/,
    Dresses: /\b(dress|dresses|gown|gowns|frock|frocks|maxi)\b/,
    Sarees: /\b(saree|sarees|sari|saris)\b/,
    "Ethnic Wear": /\b(ethnic|salwar|lehenga|anarkali|churidar)\b/,
    "Jeans & Trousers": /\b(jeans|trouser|trousers|pants|leggings|joggers)\b/,
    Skirts: /\b(skirt|skirts)\b/,
    "Jackets & Coats": /\b(jacket|jackets|coat|coats|raincoat|blazer|blazers)\b/,
    "Sweaters & Hoodies": /\b(sweater|sweaters|hoodie|hoodies|cardigan|cardigans|pullover)\b/,
    Footwear: /\b(shoe|shoes|sandal|sandals|sneaker|sneakers|slipper|slippers|footwear|boots|boot)\b/,
    Accessories: /\b(bag|bags|scarf|scarves|belt|belts|cap|caps|hat|hats|accessory|accessories)\b/,
  };

  return rules[selectedCategory]?.test(text) ?? true;
}

export default function StorePage() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("");
  const [climate, setClimate] = useState("Warm");

  const [gender, setGender] = useState("Everyone");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [wishlistOnly, setWishlistOnly] = useState(false);

  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const current = weather?.current;
  const weatherInfo = weatherDetails[climate] || weatherDetails.Warm;

  // Restore weather and wishlist from the existing WeatherWear app.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEATHER_KEY);

      if (raw) {
        const saved = JSON.parse(raw);
        const savedWeather = saved?.weather || null;

        setWeather(savedWeather);

        setLocation(
          saved?.location ||
            [
              saved?.place?.name,
              saved?.place?.admin1,
              saved?.place?.country,
            ]
              .filter(Boolean)
              .join(", ")
        );

        const detected = detectClimate(savedWeather);
        if (detected) setClimate(detected);
      }

      setWishlist(readWishlist());
    } catch (err) {
      console.error("Could not restore saved WeatherWear data:", err);
    } finally {
      setReady(true);
    }
  }, []);

  // Fetch actual Meesho listings based on weather, gender and category.
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const selectedGender =
        gender === "Everyone" ? ["Women", "Men"] : [gender];

      const searchBase =
        category === "All"
          ? weatherSearches[climate] || weatherSearches.Warm
          : `${categorySearches[category]} ${climateTerms[climate] || ""}`;

      const results = await Promise.all(
        selectedGender.map(async (selected) => {
          const query = `${selected.toLowerCase()} ${searchBase}`;

          const response = await fetch(
            `/api/products?q=${encodeURIComponent(query)}`,
            { cache: "no-store" }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Product search failed.");
          }

          return Array.isArray(result.products)
            ? result.products
            : [];
        })
      );

      // Remove duplicates and apply gender/category checks.
      const unique = new Map();

      results.flat().forEach((product) => {
        if (!product?.url || !product?.title) return;
        if (!matchesGender(product, gender)) return;
        if (!matchesCategory(product, category)) return;

        const id = String(product.id || product.url);
        if (!unique.has(id)) unique.set(id, product);
      });

      setProducts(Array.from(unique.values()));
    } catch (err) {
      setProducts([]);
      setError(
        err.message || "Could not load products from Meesho."
      );
    } finally {
      setLoading(false);
    }
  }, [climate, gender, category]);

  useEffect(() => {
    if (ready) loadProducts();
  }, [ready, loadProducts]);

  const toggleWishlist = (product) => {
    setWishlist((previous) => {
      const exists = previous.some(
        (item) => String(item.id) === String(product.id)
      );

      const updated = exists
        ? previous.filter(
            (item) => String(item.id) !== String(product.id)
          )
        : [
            ...previous,
            {
              id: product.id,
              title: product.title,
              image: product.image,
              price: product.price,
              currency: product.currency,
              rating: product.rating,
              ratingCount: product.ratingCount,
              category: product.category,
              url: product.url,
            },
          ];

      try {
        localStorage.setItem(
          WISHLIST_KEY,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error("Could not save wishlist:", err);
      }

      return updated;
    });
  };

  const displayedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const text =
        `${product.title || ""} ${product.category || ""}`.toLowerCase();

      const matchesSearch = text.includes(search.trim().toLowerCase());

      const isSaved = wishlist.some(
        (item) => String(item.id) === String(product.id)
      );

      return matchesSearch && (!wishlistOnly || isSaved);
    });

    if (sortBy === "price-low") {
      filtered = [...filtered].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
      );
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort(
        (a, b) => (b.price ?? -1) - (a.price ?? -1)
      );
    } else if (sortBy === "rating") {
      filtered = [...filtered].sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
      );
    }

    return filtered;
  }, [products, search, wishlist, wishlistOnly, sortBy]);

  const openMeeshoSearch = () => {
    const query =
      search.trim() ||
      `${gender === "Everyone" ? "" : gender.toLowerCase() + " "}${category === "All" ? weatherSearches[climate] : categorySearches[category]}`;

    window.open(
      `https://www.meesho.com/search?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen bg-[#fffaf7] text-slate-900">
      {/* Store heading */}
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange-500">
              Weather meets style
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              The <span className="text-orange-500">WeatherWear</span> Store
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Real fashion for every forecast, every style, everyone.
            </p>
          </div>

          <button
            onClick={() => setWishlistOnly((value) => !value)}
            className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
              wishlistOnly
                ? "border-pink-600 bg-pink-600 text-white"
                : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
            }`}
          >
            ♥ Wishlist ({wishlist.length})
          </button>
        </div>

        {/* Current weather strip */}
        <section
          className={`mt-6 rounded-3xl border border-white bg-gradient-to-r ${weatherInfo.color} p-5 shadow-sm sm:p-6`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm">
                {weatherInfo.emoji}
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Shopping for {climate.toLowerCase()} weather
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {weatherInfo.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {weatherInfo.description}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/75 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {location || "Your forecast"}
              </p>
              <p className="mt-1 text-2xl font-black">
                {current?.temperature_2m != null
                  ? `${Math.round(current.temperature_2m)}°C`
                  : "WeatherWear"}
              </p>
              {current?.relative_humidity_2m != null && (
                <p className="text-xs text-slate-500">
                  {current.relative_humidity_2m}% humidity
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Gender selection */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black">Who are you shopping for?</h2>
            <span className="text-xs font-semibold text-slate-400">
              Choose your collection
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {genderOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  setGender(option.name);
                  setWishlistOnly(false);
                }}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-extrabold transition ${
                  gender === option.name
                    ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                {option.name}
              </button>
            ))}
          </div>
        </section>

        {/* Weather filters */}
        <section className="mt-8">
          <h2 className="text-lg font-black">Shop by weather</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {weatherOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  setClimate(option.name);
                  setWishlistOnly(false);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  climate === option.name
                    ? "border-slate-900 bg-slate-900 text-white"
                    : `${option.color} border-transparent text-slate-800 hover:border-slate-300`
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                {option.name}
              </button>
            ))}
          </div>
        </section>

        {/* Search and sorting */}
        <section id="products" className="mt-8 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-500">
                Fresh finds
              </p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                Explore the collection
              </h2>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <span className="text-slate-400">↕</span>
              <span className="font-semibold text-slate-500">Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="max-w-40 bg-transparent font-bold outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
              <span className="text-xl text-slate-400">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search outfits, shirts, jeans, footwear..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-lg text-slate-400 hover:text-slate-900"
                >
                  ×
                </button>
              )}
            </div>

            <button
              onClick={openMeeshoSearch}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-orange-100 transition hover:from-orange-600 hover:to-pink-600"
            >
              Search on Meesho ↗
            </button>
          </div>

          {/* Categories */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-3">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  setWishlistOnly(false);
                }}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  category === item
                    ? "bg-violet-600 text-white shadow-md shadow-violet-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {wishlistOnly ? "Your wishlist" : "Products"}{" "}
              <span className="font-extrabold text-slate-900">
                {loading ? "…" : displayedProducts.length}
              </span>
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setWishlistOnly(false);
              }}
              className="text-sm font-bold text-violet-600 hover:underline"
            >
              Clear filters
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl border border-orange-100 bg-white"
                >
                  <div className="aspect-[4/5] animate-pulse bg-gradient-to-br from-orange-100 via-pink-50 to-violet-100" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-8 text-center">
              <span className="text-4xl">🛍️</span>
              <h3 className="mt-3 text-lg font-extrabold">
                We couldn't load the products
              </h3>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <button
                onClick={loadProducts}
                className="mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Real product cards */}
          {!loading && !error && displayedProducts.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {displayedProducts.map((product, index) => {
                const saved = wishlist.some(
                  (item) => String(item.id) === String(product.id)
                );

                return (
                  <article
                    key={product.id || product.url}
                    className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/70"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-violet-50">
                      {product.image ? (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${product.title} on Meesho`}
                        >
                          <img
                            src={product.image}
                            alt={product.title}
                            loading={index < 4 ? "eager" : "lazy"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </a>
                      ) : (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full items-center justify-center text-6xl"
                        >
                          👕
                        </a>
                      )}

                      <span className="absolute left-3 top-3 max-w-[75%] truncate rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 shadow-sm">
                        {product.category || "Fashion"}
                      </span>

                      <button
                        onClick={() => toggleWishlist(product)}
                        aria-label={
                          saved
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-md transition hover:scale-110 ${
                          saved
                            ? "bg-pink-600 text-white"
                            : "bg-white/95 text-slate-500 hover:text-pink-600"
                        }`}
                      >
                        {saved ? "♥" : "♡"}
                      </button>

                      {product.rating != null && (
                        <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm">
                          ★ {product.rating}
                          {product.ratingCount
                            ? ` (${Number(product.ratingCount).toLocaleString("en-IN")})`
                            : ""}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 sm:p-4">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-slate-800 sm:text-base">
                        {product.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-lg font-black text-slate-900">
                          {product.price != null
                            ? new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: product.currency || "INR",
                                maximumFractionDigits: 0,
                              }).format(product.price)
                            : "View price"}
                        </p>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                          Meesho
                        </span>
                      </div>

                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-3 text-center text-xs font-extrabold text-white shadow-md shadow-orange-100 transition hover:from-orange-600 hover:to-pink-600 sm:text-sm"
                      >
                        Buy on Meesho <span>↗</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayedProducts.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-white p-10 text-center">
              <span className="text-5xl">🔎</span>
              <h3 className="mt-4 text-xl font-black">
                No matching products found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another category or search term.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setWishlistOnly(false);
                }}
                className="mt-5 rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700"
              >
                Show all products
              </button>
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-orange-100 py-6 text-center text-xs text-slate-400">
          WeatherWear · Style for every forecast ☀️
        </footer>
      </div>
    </main>
  );
}
