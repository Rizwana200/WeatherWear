
"use client";

import { useCallback, useEffect, useState } from "react";

function getClimate(temperature, condition, rainChance) {
  const text = String(condition || "").toLowerCase();
  const temp = Number(temperature ?? 25);
  const rain = Number(rainChance ?? 0);

  // Very cold temperatures should remain Cold even when skies are clear.
  if (
    temp <= 2 ||
    text.includes("snow") ||
    text.includes("blizzard")
  ) {
    return "Cold";
  }

  if (
    text.includes("thunderstorm") ||
    text.includes("heavy rain") ||
    text.includes("rain") ||
    text.includes("drizzle") ||
    rain >= 40
  ) {
    return "Rainy";
  }

  if (temp >= 32 || text.includes("hot")) return "Hot";
  if (temp >= 25) return "Warm";
  if (temp >= 18) return "Mild";
  if (temp >= 10) return "Cool";

  return "Cold";
}

function getFallbackDescription(climate) {
  const descriptions = {
    Hot: "Choose lightweight, breathable fabrics for hot weather.",
    Warm: "Choose comfortable, lightweight everyday outfits.",
    Mild: "Explore versatile outfits for comfortable weather.",
    Rainy: "Look for rain-ready layers and suitable footwear.",
    Cool: "Try cardigans, hoodies and comfortable layers.",
    Cold: "Prioritize warm sweaters, winter coats and thermal layers.",
  };

  return descriptions[climate] || descriptions.Warm;
}

export default function ExploreOutfitIdeas({
  open,
  onClose,
  temperature,
  condition,
  rainChance = 0,
}) {
  const [gender, setGender] = useState("Women");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const climate = getClimate(temperature, condition, rainChance);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        climate,
        gender,
        condition: condition || "",
        source: "explore",
        refresh: String(refreshCount),
      });

      const response = await fetch(
        `/api/products?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The products API returned HTML instead of JSON. Check app/api/products/route.js."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load clothing products."
        );
      }

      if (!Array.isArray(data.products)) {
        throw new Error(
          "The products API did not return a products array."
        );
      }

      const validProducts = data.products.filter((product) => {
        return (
          product &&
          typeof product.title === "string" &&
          product.title.trim() !== "" &&
          typeof product.image === "string" &&
          /^https?:\/\//i.test(product.image) &&
          typeof product.url === "string" &&
          /^https?:\/\//i.test(product.url)
        );
      });

      setProducts(validProducts);

      if (validProducts.length === 0) {
        setError(
          data.notice ||
            `No matching ${gender.toLowerCase()}'s clothing was found for ${climate.toLowerCase()} weather. Try refreshing.`
        );
      }
    } catch (err) {
      setProducts([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load clothing products."
      );
    } finally {
      setLoading(false);
    }
  }, [climate, gender, condition, refreshCount]);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, loadProducts]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Clear old products immediately when the user changes the selection.
  useEffect(() => {
    setProducts([]);
    setError("");
  }, [gender, climate]);

  if (!open) return null;

  const weatherEmoji = {
    Hot: "☀️",
    Warm: "🌤️",
    Mild: "🌿",
    Rainy: "🌧️",
    Cool: "🍃",
    Cold: "❄️",
  };

  const isCold = climate === "Cold";
  const isRainy = climate === "Rainy";

  const outfitDescription = isCold
    ? "Prioritize warm layers, sweaters, winter coats and thermal clothing."
    : isRainy
      ? "Explore rain-ready jackets, raincoats and suitable footwear."
      : getFallbackDescription(climate);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Explore outfit ideas"
        className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-indigo-600">
              WEATHERWEAR
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Explore Outfit Ideas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {climate} weather · {temperature ?? "--"}°C ·{" "}
              {condition || "Current conditions"} · {gender}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close outfit ideas"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        {/* Weather recommendation */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-indigo-50 p-4">
          <span className="text-3xl">
            {weatherEmoji[climate] || "🌤️"}
          </span>

          <div>
            <h3 className="font-bold text-slate-900">
              {climate} weather outfit guide
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {outfitDescription}
            </p>
          </div>
        </div>

        {/* Gender buttons and refresh */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {["Women", "Men"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGender(option)}
                aria-pressed={gender === option}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  gender === option
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option === "Women" ? "👗 Women" : "👔 Men"}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => setRefreshCount((count) => count + 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh ideas"}
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && products.length === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* Error message */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setRefreshCount((count) => count + 1)}
              className="mt-3 rounded-full bg-white px-4 py-2 font-semibold text-rose-700 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Product cards */}
        {!error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product, index) => (
              <a
                key={`${product.id || product.url}-${index}`}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                title={product.title}
              >
                <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      const card = event.currentTarget.closest("a");
                      if (card) card.style.display = "none";
                    }}
                  />
                </div>

                <div className="p-3">
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-800">
                    {product.title}
                  </p>

                  {product.category && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {product.category}
                    </p>
                  )}

                  {product.price != null && (
                    <p className="mt-2 font-bold text-slate-900">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-semibold text-violet-600">
                    View product ↗
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
            No outfit images are available for this selection. Try refreshing or choosing another weather category.
          </div>
        )}

        <p className="mt-5 text-xs text-slate-400">
          Product results come from your existing Meesho search API. Titles and images are displayed from the returned product data.
        </p>
      </section>
    </div>
  );
}
