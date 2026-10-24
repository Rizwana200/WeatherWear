"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Settings you may want to change                                    */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "weatherwear-compare-session";
const EXPLORE_ENDPOINT = "/api/explore"; // your existing route.js (GET)
const MAX_CITIES = 5;

// Climate values sent to /api/explore?climate=...  (edit to match your route)
const CLIMATE_FOR = {
  rain: "Rainy",
  hot: "Hot",
  warm: "Warm",
  mild: "Mild",
  cold: "Cold",
};

const WEATHER_LABELS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

function weatherIcon(code) {
  if ([0, 1].includes(code)) return "☀️";
  if ([2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

/* Outfit text + colour per condition. `climate` feeds /api/explore. */
function getOutfit(temp, rain, code) {
  if (rain >= 50 || (code >= 51 && code <= 99)) {
    return {
      key: "rain",
      climate: CLIMATE_FOR.rain,
      title: "Rain-ready outfit",
      clothes: "Choose a water-resistant jacket and comfortable, quick-drying trousers.",
      shoes: "Water-resistant footwear",
      gradient: "linear-gradient(135deg,#0ea5e9,#4f46e5)",
      glow: "#38bdf8",
    };
  }
  if (temp >= 32) {
    return {
      key: "hot",
      climate: CLIMATE_FOR.hot,
      title: "Beat the heat",
      clothes: "Choose breathable cotton, lightweight trousers, and loose-fitting clothing.",
      shoes: "Breathable sneakers or sandals",
      gradient: "linear-gradient(135deg,#fb923c,#e11d48)",
      glow: "#fb923c",
    };
  }
  if (temp >= 24) {
    return {
      key: "warm",
      climate: CLIMATE_FOR.warm,
      title: "Light and comfortable",
      clothes: "Wear a breathable T-shirt with comfortable jeans or lightweight trousers.",
      shoes: "Everyday sneakers",
      gradient: "linear-gradient(135deg,#34d399,#0d9488)",
      glow: "#34d399",
    };
  }
  if (temp >= 16) {
    return {
      key: "mild",
      climate: CLIMATE_FOR.mild,
      title: "Layer up lightly",
      clothes: "Wear long sleeves and carry a lightweight jacket.",
      shoes: "Comfortable closed shoes",
      gradient: "linear-gradient(135deg,#a78bfa,#9333ea)",
      glow: "#a78bfa",
    };
  }
  return {
    key: "cold",
    climate: CLIMATE_FOR.cold,
    title: "Stay warm",
    clothes: "Choose a warm sweater, layered clothing, and a jacket.",
    shoes: "Closed shoes",
    gradient: "linear-gradient(135deg,#3b82f6,#4338ca)",
    glow: "#60a5fa",
  };
}

/* Fallback photos if /api/explore returns nothing */
const FALLBACK_PHOTOS = {
  rain: ["photo-1544923246-77307dd654cb", "photo-1542291026-7eec264c27ff"],
  hot: ["photo-1521572163474-6864f9cf17ab", "photo-1542291026-7eec264c27ff"],
  warm: ["photo-1521572163474-6864f9cf17ab", "photo-1542291026-7eec264c27ff"],
  mild: ["photo-1551028719-00167b16eac5", "photo-1542291026-7eec264c27ff"],
  cold: ["photo-1551028719-00167b16eac5", "photo-1542291026-7eec264c27ff"],
};

function fallbackPhotos(key) {
  return (FALLBACK_PHOTOS[key] || []).map((id) => ({
    image: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=80`,
    title: "Outfit idea",
    link: "",
  }));
}

/* Accepts several common shapes so it works with your route's output */
function normalizeProduct(item) {
  if (!item || typeof item !== "object") return null;
  const image =
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.photo ||
    item.thumbnail ||
    item.src ||
    item.urls?.small ||
    item.urls?.regular ||
    "";
  if (!image) return null;
  return {
    image,
    title:
      item.title ||
      item.name ||
      item.alt_description ||
      item.description ||
      "Outfit idea",
    link: item.link || item.url || item.links?.html || "",
  };
}

/* ------------------------------------------------------------------ */
/*  Location helpers                                                   */
/* ------------------------------------------------------------------ */
function normalizePhotonPlace(feature) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null;
  }

  const name =
    properties.name ||
    properties.city ||
    properties.town ||
    properties.village ||
    properties.county ||
    properties.state;

  if (!name) return null;

  return {
    name,
    admin1: properties.state || properties.county || properties.district || "",
    country: properties.country || "",
    latitude: Number(coordinates[1]),
    longitude: Number(coordinates[0]),
  };
}

function placeLabel(place) {
  if (!place) return "";
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

function makeSlot(place = null) {
  return {
    input: place ? placeLabel(place) : "",
    place,
    suggestions: [],
    searching: false,
    open: false,
  };
}

const initialPlaces = [
  { name: "Hyderabad", admin1: "Telangana", country: "India", latitude: 17.385, longitude: 78.4867 },
  { name: "Bengaluru", admin1: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
];

/* Slot accent colours so each city keeps its own colour everywhere */
const SLOT_COLORS = ["#7c3aed", "#0ea5e9", "#f43f5e", "#10b981", "#f59e0b"];

/* ------------------------------------------------------------------ */
/*  Location autocomplete                                              */
/* ------------------------------------------------------------------ */
function LocationAutocomplete({ index, slot, onInputChange, onChoose, onRemove, canRemove }) {
  useEffect(() => {
    const query = slot.input.trim();
    if (!slot.open || query.length < 2 || slot.place) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      onInputChange(index, query, { searching: true });

      try {
        const params = new URLSearchParams({ q: query, limit: "10", lang: "en" });
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Location search failed.");

        const data = await response.json();
        const results = (data.features || []).map(normalizePhotonPlace).filter(Boolean);

        if (!cancelled) {
          onInputChange(index, query, { suggestions: results, searching: false });
        }
      } catch (error) {
        if (error.name !== "AbortError" && !cancelled) {
          onInputChange(index, query, { suggestions: [], searching: false });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [index, slot.input, slot.open, slot.place, onInputChange]);

  const accent = SLOT_COLORS[index % SLOT_COLORS.length];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span
            className="ww-pin pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            style={{ filter: slot.place ? "none" : "grayscale(0.6)" }}
          >
            📍
          </span>

          <input
            type="text"
            value={slot.input}
            autoComplete="off"
            placeholder={`Search city ${index + 1}...`}
            aria-label={`Search city ${index + 1}`}
            aria-expanded={slot.open && !slot.place}
            onFocus={() => onInputChange(index, slot.input, { open: true })}
            onChange={(event) =>
              onInputChange(index, event.target.value, {
                place: null,
                suggestions: [],
                searching: false,
                open: true,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") onInputChange(index, slot.input, { open: false });
              if (event.key === "Enter" && slot.open && slot.suggestions.length > 0) {
                event.preventDefault();
                onChoose(index, slot.suggestions[0]);
              }
            }}
            style={{
              borderColor: slot.place ? accent : undefined,
              boxShadow: slot.place ? `0 8px 22px -12px ${accent}` : undefined,
            }}
            className="ww-input w-full rounded-2xl border-2 border-violet-100 bg-white py-3.5 pl-11 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />

          {slot.searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="ww-spinner" />
            </span>
          )}

          {slot.open && !slot.place && slot.input.trim().length >= 2 && (
            <div className="ww-drop-menu absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-violet-100 bg-white p-2 shadow-2xl">
              {slot.searching ? (
                <p className="px-3 py-3 text-sm text-slate-500">Finding matching places…</p>
              ) : slot.suggestions.length > 0 ? (
                slot.suggestions.map((place, i) => (
                  <button
                    key={`${place.latitude}-${place.longitude}-${i}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChoose(index, place)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className="ww-suggest flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:translate-x-1 hover:bg-violet-50"
                  >
                    <span>📍</span>
                    <span>
                      <span className="block font-semibold text-slate-800">{place.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[place.admin1, place.country].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-sm text-slate-500">
                  No matching places found. Try another spelling.
                </p>
              )}
            </div>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove city ${index + 1}`}
            className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-rose-500 transition hover:rotate-90 hover:scale-110 hover:bg-rose-100"
          >
            ✕
          </button>
        )}
      </div>

      {slot.place && (
        <div className="ww-pop mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate font-semibold" style={{ color: accent }}>
            <span className="ww-check">✓</span> {placeLabel(slot.place)}
          </span>
          <button
            type="button"
            onClick={() =>
              onInputChange(index, slot.input, { place: null, suggestions: [], open: true })
            }
            className="shrink-0 font-bold text-violet-600 hover:text-violet-800"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */
async function fetchCityWeather(place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "16",
    timezone: "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error(`Weather could not be loaded for ${place.name}.`);

  const data = await response.json();
  if (!data.current || !data.daily?.time?.length) {
    throw new Error(`Incomplete weather data for ${place.name}.`);
  }

  return { place, label: placeLabel(place), weather: data };
}

async function fetchOutfitPhotos(climate, gender) {
  const params = new URLSearchParams({ climate, gender });
  const response = await fetch(`${EXPLORE_ENDPOINT}?${params}`);
  if (!response.ok) throw new Error(`Photos failed (${response.status})`);
  const data = await response.json();
  const list = Array.isArray(data.products) ? data.products : [];
  return list.map(normalizeProduct).filter(Boolean).slice(0, 8);
}

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/* Small count-up so the temperature "lands" when a card appears */
function CountUp({ value }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 800;
    const target = Math.round(value);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown}</>;
}

/* Decorative: twinkling sparkles (purely visual) */
const SPARKLES = [
  { top: "12%", left: "46%", size: 14, delay: "0s" },
  { top: "68%", left: "58%", size: 10, delay: "0.8s" },
  { top: "30%", left: "78%", size: 16, delay: "1.4s" },
  { top: "80%", left: "30%", size: 12, delay: "2s" },
  { top: "18%", left: "64%", size: 9, delay: "2.6s" },
  { top: "52%", left: "90%", size: 12, delay: "1s" },
];

function Sparkles() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="ww-twinkle pointer-events-none absolute text-white"
          style={{ top: s.top, left: s.left, fontSize: s.size, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}
    </>
  );
}

/* Decorative: snow for cold cards */
function Snow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {[10, 24, 38, 52, 66, 80, 92].map((left, d) => (
        <span
          key={left}
          className="ww-flake"
          style={{ left: `${left}%`, animationDelay: `${d * 0.6}s`, animationDuration: `${4 + (d % 3)}s` }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

/* Decorative: pulsing sun glow for hot/warm cards */
function SunGlow({ strong }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className={`ww-sun ${strong ? "ww-sun-strong" : ""}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ComparePage() {
  const [slots, setSlots] = useState(() => initialPlaces.map((p) => makeSlot(p)));
  const [cityWeather, setCityWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const [gender, setGender] = useState("Women");
  const [photos, setPhotos] = useState({}); // "Rainy|Women" -> { status, items }
  const requested = useRef(new Set());

  const sliderRef = useRef(null);
  const [active, setActive] = useState(0);

  /* Restore session */
  useEffect(() => {
    const saved = readSession();

    if (saved) {
      if (Array.isArray(saved.slots) && saved.slots.length >= 2) {
        setSlots(
          saved.slots.slice(0, MAX_CITIES).map((slot) => ({
            ...makeSlot(slot.place || null),
            input: slot.input || "",
          }))
        );
      }
      if (Array.isArray(saved.cityWeather)) setCityWeather(saved.cityWeather);
      if (typeof saved.question === "string") setQuestion(saved.question);
      if (typeof saved.aiAnswer === "string") setAiAnswer(saved.aiAnswer);
      if (saved.gender === "Men" || saved.gender === "Women") setGender(saved.gender);
    }

    setHydrated(true);
  }, []);

  /* Save session */
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          slots: slots.map(({ input, place }) => ({ input, place })),
          cityWeather,
          question,
          aiAnswer,
          gender,
        })
      );
    } catch {
      /* page still works without session storage */
    }
  }, [hydrated, slots, cityWeather, question, aiAnswer, gender]);

  /* Load outfit photos from /api/explore (one request per climate+gender) */
  useEffect(() => {
    if (cityWeather.length === 0) return;

    const climates = new Set();
    cityWeather.forEach(({ weather }) => {
      const current = weather.current;
      const idx = weather.daily.time.indexOf(current.time.slice(0, 10));
      const rain = weather.daily.precipitation_probability_max?.[idx] ?? 0;
      climates.add(getOutfit(current.temperature_2m, rain, current.weather_code).climate);
    });

    climates.forEach((climate) => {
      const key = `${climate}|${gender}`;
      if (requested.current.has(key)) return;
      requested.current.add(key);

      setPhotos((prev) => ({ ...prev, [key]: { status: "loading", items: [] } }));

      fetchOutfitPhotos(climate, gender)
        .then((items) =>
          setPhotos((prev) => ({ ...prev, [key]: { status: "done", items } }))
        )
        .catch(() => {
          requested.current.delete(key); // allow a retry later
          setPhotos((prev) => ({ ...prev, [key]: { status: "error", items: [] } }));
        });
    });
  }, [cityWeather, gender]);

  const updateSlot = useCallback((index, input, updates = {}) => {
    setSlots((previous) =>
      previous.map((slot, i) => (i === index ? { ...slot, input, ...updates } : slot))
    );
  }, []);

  function choosePlace(index, place) {
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return;

    const duplicate = slots.some(
      (slot, i) =>
        i !== index &&
        slot.place &&
        slot.place.latitude === place.latitude &&
        slot.place.longitude === place.longitude
    );

    if (duplicate) {
      setError("You have already selected this place. Choose another one.");
      return;
    }

    updateSlot(index, placeLabel(place), {
      place,
      suggestions: [],
      searching: false,
      open: false,
    });

    setError("");
    setAiAnswer("");
    setAiError("");
  }

  function addCity() {
    if (slots.length >= MAX_CITIES) return;
    setSlots((previous) => [...previous, makeSlot()]);
    setError("");
  }

  function removeCity(index) {
    if (slots.length <= 2) return;
    setSlots((previous) => previous.filter((_, i) => i !== index));
    setCityWeather([]);
    setAiAnswer("");
    setError("");
  }

  async function compareWeather(event) {
    event.preventDefault();
    setError("");
    setAiAnswer("");
    setAiError("");

    const chosenPlaces = slots.map((slot) => slot.place);
    const missingIndex = chosenPlaces.findIndex((place) => !place);

    if (missingIndex !== -1) {
      setError(`Please select a place from the suggestions for city ${missingIndex + 1}.`);
      setSlots((previous) =>
        previous.map((slot, index) => (index === missingIndex ? { ...slot, open: true } : slot))
      );
      return;
    }

    const uniquePlaces = new Set(chosenPlaces.map((p) => `${p.latitude},${p.longitude}`));
    if (uniquePlaces.size !== chosenPlaces.length) {
      setError("Please select a different location for each city.");
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(chosenPlaces.map((p) => fetchCityWeather(p)));
      setCityWeather(results);
      setActive(0);
      requestAnimationFrame(() => sliderRef.current?.scrollTo({ left: 0 }));
    } catch (err) {
      setError(err.message || "Unable to compare the selected locations.");
    } finally {
      setLoading(false);
    }
  }

  async function askAI(event) {
    event.preventDefault();
    if (!question.trim() || cityWeather.length < 2) return;

    setAiLoading(true);
    setAiAnswer("");
    setAiError("");

    try {
      const cityContexts = cityWeather.map(({ place, label, weather }) => {
        const current = weather.current;

        const forecast = weather.daily.time.map((date, index) => ({
          date,
          maxTemperature: weather.daily.temperature_2m_max?.[index] ?? null,
          minTemperature: weather.daily.temperature_2m_min?.[index] ?? null,
          condition: WEATHER_LABELS[weather.daily.weather_code?.[index]] || "Unknown",
          rainProbability: weather.daily.precipitation_probability_max?.[index] ?? null,
        }));

        return {
          city: label,
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: weather.timezone,
          current: {
            time: current.time,
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            condition: WEATHER_LABELS[current.weather_code] || "Unknown",
          },
          forecast,
        };
      });

      const firstCity = cityContexts[0];

      const response = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityContexts.map((item) => item.city).join(" vs "),
          timezone: firstCity.timezone,
          currentTime: firstCity.current.time,
          temperature: firstCity.current.temperature,
          condition: firstCity.current.condition,
          rainChance: firstCity.forecast[0]?.rainProbability ?? 0,
          question: [
            "The user selected these locations for comparison:",
            JSON.stringify(cityContexts),
            "",
            `User question: ${question.trim()}`,
            "",
            "Answer using the weather data provided for ALL selected locations. Compare the cities when relevant. For future-date questions, use the matching date from the supplied forecasts. Do not invent weather values. Give practical clothing and footwear recommendations where relevant.",
          ].join("\n"),
          forecast: firstCity.forecast,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to get an AI answer.");

      const answer =
        data.answer || data.reply || data.message || data.response || data.recommendation;

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The AI service returned an empty answer.");
      }

      setAiAnswer(answer);
    } catch (err) {
      setAiError(err.message || "Unable to contact the AI assistant.");
    } finally {
      setAiLoading(false);
    }
  }

  /* Slider controls */
  function slideTo(index) {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    if (!card) return;
    const step = card.getBoundingClientRect().width + 20;
    el.scrollTo({ left: step * index, behavior: "smooth" });
  }

  function onSliderScroll() {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    if (!card) return;
    const step = card.getBoundingClientRect().width + 20;
    setActive(Math.max(0, Math.min(cityWeather.length - 1, Math.round(el.scrollLeft / step))));
  }

  const activeCity = cityWeather[active];

  return (
    <main className="ww-bg relative min-h-screen overflow-x-hidden px-4 py-7 text-slate-800 sm:px-8 sm:py-10">
      <style>{CSS}</style>

      {/* Ambient floating colour orbs + drifting clouds (decorative) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="ww-orb ww-orb-a" />
        <span className="ww-orb ww-orb-b" />
        <span className="ww-orb ww-orb-c" />
        <span className="ww-cloud" style={{ top: "14%", animationDuration: "55s" }}>☁️</span>
        <span className="ww-cloud" style={{ top: "46%", animationDuration: "75s", animationDelay: "-30s", fontSize: "2.4rem" }}>☁️</span>
        <span className="ww-cloud" style={{ top: "78%", animationDuration: "65s", animationDelay: "-12s", fontSize: "3.6rem" }}>☁️</span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ---------------- Header ---------------- */}
        <section className="ww-hero ww-rise-in relative mb-7 overflow-hidden rounded-[2rem] p-7 text-white shadow-2xl shadow-indigo-300/40 sm:p-10">
          <span className="ww-sunrays pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full" />
          <span className="ww-float absolute right-8 top-6 text-6xl opacity-90 sm:text-7xl">☀️</span>
          <span className="ww-float-slow absolute right-28 top-20 text-4xl opacity-80 sm:right-44">⛅</span>
          <span className="ww-float absolute bottom-6 right-12 text-3xl opacity-80" style={{ animationDelay: "-2s" }}>
            🌧️
          </span>
          <span className="ww-blob pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <span className="ww-blob pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-2xl" style={{ animationDelay: "-5s" }} />
          <Sparkles />
          <span className="ww-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" />

          <div className="relative">
            <span className="ww-badge inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur">
              <span className="ww-spin-slow inline-block">🌈</span> WeatherWear
            </span>
            <h1 className="ww-shine-text mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
              Compare the weather. Dress for every city.
            </h1>
            <p className="ww-fade-up mt-3 max-w-xl text-sm leading-6 text-indigo-50 sm:text-base" style={{ animationDelay: "250ms" }}>
              Pick up to five places, slide through their forecasts, and see outfit photos matched to
              each climate.
            </p>
          </div>
        </section>

        {/* ---------------- Step 1 ---------------- */}
        <section
          className="ww-glass ww-rise-in rounded-3xl border border-white bg-white/85 p-5 shadow-xl shadow-violet-200/50 backdrop-blur-xl sm:p-8"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="ww-step-pill">Step 1</span>
              <h2 className="mt-2 text-2xl font-black">
                Choose your locations <span className="ww-bounce-pin inline-block">📍</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Search for a city and select a result from the dropdown.
              </p>
            </div>

            {/* Slot counter: filled dots pop in */}
            <div className="flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 shadow-inner">
              {Array.from({ length: MAX_CITIES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${i < slots.length ? "ww-dot-live" : ""}`}
                  style={{
                    background: i < slots.length ? SLOT_COLORS[i] : "#ddd6fe",
                    transform: i < slots.length ? "scale(1.25)" : "scale(1)",
                    color: SLOT_COLORS[i],
                  }}
                />
              ))}
              <span className="ml-1 text-xs font-extrabold text-violet-700">
                {slots.length}/{MAX_CITIES}
              </span>
            </div>
          </div>

          <form onSubmit={compareWeather} className="mt-6">
            <div className="grid gap-5 md:grid-cols-2">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="ww-pop ww-slot rounded-2xl p-3 transition hover:bg-violet-50/60"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span
                      className="ww-ping inline-block h-3 w-3 rounded-full"
                      style={{ background: SLOT_COLORS[index % SLOT_COLORS.length], color: SLOT_COLORS[index % SLOT_COLORS.length] }}
                    />
                    Location {index + 1}
                  </label>

                  <LocationAutocomplete
                    index={index}
                    slot={slot}
                    onInputChange={updateSlot}
                    onChoose={choosePlace}
                    onRemove={removeCity}
                    canRemove={slots.length > 2}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {slots.length < MAX_CITIES && (
                <button
                  type="button"
                  onClick={addCity}
                  className="ww-add rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-100"
                >
                  + Add another city
                </button>
              )}

              {/* Gender toggle for /api/explore */}
              <div
                role="group"
                aria-label="Outfit style"
                className="relative flex rounded-2xl bg-slate-100 p-1 text-sm font-bold shadow-inner"
              >
                <span
                  className="absolute bottom-1 top-1 w-1/2 rounded-xl bg-white shadow-md transition-transform duration-500"
                  style={{
                    transform: gender === "Men" ? "translateX(100%)" : "translateX(0)",
                    transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
                  }}
                />
                {["Women", "Men"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    aria-pressed={gender === g}
                    className={`relative z-10 w-20 rounded-xl py-2 transition-colors ${
                      gender === g ? "text-violet-700" : "text-slate-500"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ww-cta ww-btn-shine rounded-2xl px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-300/50 transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "🌦️ Comparing…" : "Compare weather"}
              </button>
            </div>
          </form>

          {error && (
            <p
              role="alert"
              className="ww-pop ww-shake mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              ⚠️ {error}
            </p>
          )}
        </section>

        {/* ---------------- Loading ---------------- */}
        {loading && (
          <div className="ww-pop mt-7 rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-lg">
            <div className="ww-orbit mx-auto">
              <span className="ww-orbit-center">🌦️</span>
              <span className="ww-orbit-item" style={{ animationDelay: "0s" }}>☀️</span>
              <span className="ww-orbit-item" style={{ animationDelay: "-1s" }}>🌧️</span>
              <span className="ww-orbit-item" style={{ animationDelay: "-2s" }}>❄️</span>
            </div>
            <p className="mt-5 text-lg font-extrabold text-violet-800">Checking your cities…</p>
            <p className="mt-2 text-sm text-slate-500">Fetching the latest weather information.</p>
            <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-violet-100">
              <div className="ww-bar h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-sky-500" />
            </div>
          </div>
        )}

        {/* ---------------- Step 2: slider ---------------- */}
        {!loading && cityWeather.length > 0 && (
          <>
            <section className="mt-9">
              <div className="ww-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="ww-step-pill ww-step-pill-indigo">Step 2</span>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    Swipe through your cities <span className="ww-spin-slow inline-block">🌍</span>
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Slide sideways to compare. Each card shows outfit photos for its climate.
                  </p>
                </div>

                <div className="hidden gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => slideTo(Math.max(0, active - 1))}
                    disabled={active === 0}
                    aria-label="Previous city"
                    className="ww-arrow"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => slideTo(Math.min(cityWeather.length - 1, active + 1))}
                    disabled={active === cityWeather.length - 1}
                    aria-label="Next city"
                    className="ww-arrow"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Quick jump chips */}
              <div className="mb-4 flex flex-wrap gap-2">
                {cityWeather.map(({ place }, i) => (
                  <button
                    key={`${place.latitude}-${place.longitude}`}
                    type="button"
                    onClick={() => slideTo(i)}
                    className="ww-chip rounded-full border-2 px-4 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      borderColor: SLOT_COLORS[i % SLOT_COLORS.length],
                      background: i === active ? SLOT_COLORS[i % SLOT_COLORS.length] : "white",
                      color: i === active ? "white" : SLOT_COLORS[i % SLOT_COLORS.length],
                      transform: i === active ? "scale(1.06)" : undefined,
                    }}
                  >
                    {place.name}
                  </button>
                ))}
              </div>

              <div className="relative -mx-4 sm:-mx-8">
                <div
                  ref={sliderRef}
                  onScroll={onSliderScroll}
                  className="ww-slider flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:px-8"
                  aria-label="City weather cards"
                >
                  {cityWeather.map(({ place, weather }, i) => {
                    const current = weather.current;
                    const todayIndex = weather.daily.time.indexOf(current.time.slice(0, 10));
                    const rain = weather.daily.precipitation_probability_max?.[todayIndex] ?? 0;
                    const hi = weather.daily.temperature_2m_max?.[todayIndex];
                    const lo = weather.daily.temperature_2m_min?.[todayIndex];
                    const outfit = getOutfit(current.temperature_2m, rain, current.weather_code);
                    const photoState = photos[`${outfit.climate}|${gender}`];
                    const items =
                      photoState?.status === "done" && photoState.items.length > 0
                        ? photoState.items
                        : photoState?.status === "loading" || !photoState
                        ? null
                        : fallbackPhotos(outfit.key);

                    return (
                      <article
                        key={`${place.latitude}-${place.longitude}`}
                        data-card
                        className="ww-card w-[86%] shrink-0 snap-center overflow-hidden rounded-3xl bg-white shadow-xl sm:w-[24rem]"
                        style={{
                          animationDelay: `${i * 90}ms`,
                          boxShadow: `0 18px 40px -18px ${outfit.glow}`,
                          opacity: i === active ? 1 : 0.92,
                        }}
                      >
                        <div className="ww-weather relative overflow-hidden p-5 text-white" style={{ background: outfit.gradient }}>
                          <span className="ww-card-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-1/2" />

                          {(outfit.key === "hot" || outfit.key === "warm") && (
                            <SunGlow strong={outfit.key === "hot"} />
                          )}
                          {outfit.key === "cold" && <Snow />}

                          <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-xl font-black">{place.name}</h3>
                              <p className="mt-1 text-xs text-white/80">
                                {[place.admin1, place.country].filter(Boolean).join(", ")}
                              </p>
                            </div>
                            <span className="ww-float rounded-2xl bg-white/20 p-3 text-3xl backdrop-blur">
                              {weatherIcon(current.weather_code)}
                            </span>
                          </div>

                          <div className="relative mt-5 flex items-end justify-between">
                            <div>
                              <p className="text-6xl font-black leading-none tracking-tight drop-shadow-lg">
                                <CountUp value={current.temperature_2m} />°
                                <span className="text-2xl">C</span>
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white/90">
                                {WEATHER_LABELS[current.weather_code] || "Current weather"}
                              </p>
                              <p className="mt-1 text-xs text-white/75">
                                Feels like {Math.round(current.apparent_temperature)}°C
                              </p>
                            </div>
                            {hi != null && lo != null && (
                              <p className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold backdrop-blur">
                                ↑ {Math.round(hi)}° &nbsp; ↓ {Math.round(lo)}°
                              </p>
                            )}
                          </div>

                          {outfit.key === "rain" && (
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                              {[8, 22, 38, 54, 70, 86].map((left, d) => (
                                <span
                                  key={left}
                                  className="ww-drop"
                                  style={{ left: `${left}%`, animationDelay: `${d * 0.35}s` }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-4">
                          <Stat emoji="💧" label="Humidity" value={`${current.relative_humidity_2m}%`} tone="sky" />
                          <Stat emoji="🌧️" label="Rain" value={`${rain}%`} tone="indigo" fill={rain} />
                          <Stat emoji="💨" label="Wind" value={`${current.wind_speed_10m}`} unit="km/h" tone="amber" />
                        </div>

                        <div className="border-t border-slate-100 p-5">
                          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-extrabold text-violet-700">
                            👗 What to wear · {gender}
                          </span>

                          <h4 className="mt-4 text-lg font-black">{outfit.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{outfit.clothes}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">👟 {outfit.shoes}</p>

                          {/* Photo strip, also slidable */}
                          <div className="ww-slider -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                            {items === null
                              ? [0, 1, 2].map((s) => <div key={s} className="ww-skeleton h-40 w-28 shrink-0 rounded-2xl" />)
                              : items.map((item, p) => (
                                  <a
                                    key={`${item.image}-${p}`}
                                    href={item.link || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ww-photo group relative h-40 w-28 shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-100"
                                    style={{ animationDelay: `${p * 70}ms` }}
                                    title={item.title}
                                  >
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      loading="lazy"
                                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                    />
                                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[10px] font-semibold leading-tight text-white opacity-0 transition group-hover:opacity-100">
                                      <span className="line-clamp-2">{item.title}</span>
                                    </span>
                                  </a>
                                ))}
                          </div>

                          {photoState?.status === "error" && (
                            <p className="mt-2 text-xs text-slate-400">
                              Live photos are unavailable right now, showing a sample instead.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* edge fades hint at more content */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-violet-50 to-transparent sm:w-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-rose-50 to-transparent sm:w-10" />
              </div>

              {/* Dots */}
              <div className="mt-1 flex justify-center gap-2" role="tablist" aria-label="City slides">
                {cityWeather.map(({ place }, i) => (
                  <button
                    key={`${place.latitude}-${place.longitude}`}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Go to ${place.name}`}
                    onClick={() => slideTo(i)}
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === active ? 32 : 10,
                      background: i === active ? SLOT_COLORS[i % SLOT_COLORS.length] : "#cbd5e1",
                      transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
                    }}
                  />
                ))}
              </div>
            </section>

            {/* ---------------- Step 3: AI ---------------- */}
            <section className="ww-rise-in mt-9 overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-violet-200/60">
              <div className="ww-ai relative overflow-hidden p-6 text-white sm:p-8">
                <Sparkles />
                <span className="ww-blob pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-start gap-4">
                  <div className="ww-float ww-glow-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-3xl">
                    ✨
                  </div>
                  <div>
                    <span className="text-xs font-bold text-violet-100">Step 3</span>
                    <h2 className="mt-1 text-2xl font-black sm:text-3xl">Ask your AI stylist</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                      Compare your selected cities, plan an outfit, or ask about a date in the available
                      forecast.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <p className="text-sm font-extrabold text-slate-700">Try asking 👇</p>

                <div className="ww-slider -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
                  {[
                    "Which city is hotter?",
                    "Which city has the highest chance of rain?",
                    "What should I wear in each city today?",
                    "Compare the weather tomorrow.",
                    "Which city is better for outdoor activities?",
                  ].map((suggestion, si) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      style={{ animationDelay: `${si * 80}ms` }}
                      className="ww-chip shrink-0 rounded-full border border-violet-100 bg-gradient-to-r from-violet-50 to-sky-50 px-4 py-2.5 text-left text-sm font-semibold text-violet-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:from-violet-100 hover:to-sky-100 hover:shadow-md active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <form onSubmit={askAI} className="mt-6">
                  <label htmlFor="compare-question" className="mb-2 block text-sm font-extrabold text-slate-700">
                    Your question
                  </label>

                  <textarea
                    id="compare-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={`What should I wear in ${activeCity?.place.name || "each city"} next Friday?`}
                    maxLength={500}
                    rows={3}
                    required
                    className="ww-input w-full rounded-2xl border-2 border-violet-100 bg-violet-50/40 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="submit"
                    disabled={aiLoading || !question.trim()}
                    className="ww-ai-btn ww-btn-shine mt-4 rounded-2xl px-6 py-3.5 font-extrabold text-white shadow-lg shadow-violet-300/50 transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiLoading ? "✨ Thinking…" : "Ask AI stylist ✨"}
                  </button>
                </form>

                {aiError && (
                  <p role="alert" className="ww-pop ww-shake mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    ⚠️ {aiError}
                  </p>
                )}

                {aiLoading && (
                  <div className="ww-pop ww-pulse-bg mt-5 flex items-center gap-3 rounded-2xl bg-violet-50 p-5">
                    <span className="ww-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <p className="font-semibold text-violet-700">Your stylist is preparing a recommendation…</p>
                  </div>
                )}

                {aiAnswer && (
                  <div className="ww-answer mt-6 overflow-hidden rounded-2xl border border-violet-100">
                    <div className="bg-gradient-to-r from-violet-100 to-sky-100 px-5 py-4">
                      <h3 className="font-black text-violet-900">
                        <span className="ww-heartbeat inline-block">💜</span> Your personalized recommendation
                      </h3>
                    </div>
                    <p className="ww-fade-up whitespace-pre-wrap p-5 text-sm leading-7 text-slate-700" style={{ animationDelay: "150ms" }}>
                      {aiAnswer}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ---------------- Empty state ---------------- */}
        {!loading && cityWeather.length === 0 && (
          <section className="ww-rise-in mt-7 rounded-3xl border border-white bg-white/80 p-7 text-center shadow-sm backdrop-blur sm:p-10" style={{ animationDelay: "250ms" }}>
            <div className="ww-float ww-glow-ring mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-3xl">
              🌍
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-800">Your city comparison starts here</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Choose at least two locations above and select Compare weather to see conditions and outfit
              photos.
            </p>
          </section>
        )}

        <footer className="py-8 text-center text-xs text-slate-400">
          WeatherWear · Dress for the weather, wherever you go <span className="ww-spin-slow inline-block">🌈</span>
        </footer>
      </div>
    </main>
  );
}

/* Small stat tile */
function Stat({ emoji, label, value, unit, tone, fill }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`ww-stat relative overflow-hidden rounded-2xl p-3 text-center ${tones[tone]}`}>
      {typeof fill === "number" && (
        <span
          className="ww-fill absolute inset-x-0 bottom-0 bg-indigo-200/50"
          style={{ height: `${Math.min(100, fill)}%` }}
        />
      )}
      <span className="ww-stat-emoji relative inline-block text-xl">{emoji}</span>
      <p className="relative mt-1 text-xs text-slate-500">{label}</p>
      <p className="relative mt-1 font-black">{value}</p>
      {unit && <p className="relative text-[10px] text-slate-500">{unit}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles and keyframes                                               */
/* ------------------------------------------------------------------ */
const CSS = `
.ww-bg{background:
  radial-gradient(60rem 30rem at 10% -10%, #ede9fe 0%, transparent 60%),
  radial-gradient(50rem 30rem at 100% 10%, #e0f2fe 0%, transparent 60%),
  radial-gradient(50rem 30rem at 50% 110%, #ffe4e6 0%, transparent 60%),
  #faf5ff;}

/* ambient background */
.ww-orb{position:absolute;border-radius:9999px;filter:blur(60px);opacity:.55;will-change:transform;}
.ww-orb-a{width:26rem;height:26rem;left:-6rem;top:8%;background:#c4b5fd;animation:ww-orb-a 18s ease-in-out infinite;}
.ww-orb-b{width:22rem;height:22rem;right:-5rem;top:35%;background:#7dd3fc;animation:ww-orb-b 22s ease-in-out infinite;}
.ww-orb-c{width:24rem;height:24rem;left:30%;bottom:-8rem;background:#fda4af;animation:ww-orb-a 26s ease-in-out infinite reverse;}
.ww-cloud{position:absolute;left:-10%;font-size:3rem;opacity:.28;animation:ww-cloud 60s linear infinite;filter:blur(.5px);}

/* hero */
.ww-hero{background:linear-gradient(120deg,#6d28d9,#4f46e5,#0ea5e9,#ec4899);background-size:300% 300%;animation:ww-shift 14s ease infinite, ww-rise-in .8s cubic-bezier(.2,.8,.2,1) both;}
.ww-sunrays{background:conic-gradient(from 0deg,rgba(255,255,255,.22),transparent 10%,rgba(255,255,255,.22) 20%,transparent 30%,rgba(255,255,255,.22) 40%,transparent 50%,rgba(255,255,255,.22) 60%,transparent 70%,rgba(255,255,255,.22) 80%,transparent 90%,rgba(255,255,255,.22));-webkit-mask-image:radial-gradient(circle,#000 20%,transparent 70%);mask-image:radial-gradient(circle,#000 20%,transparent 70%);animation:ww-spin 30s linear infinite;}
.ww-sweep{background:linear-gradient(100deg,transparent,rgba(255,255,255,.22),transparent);transform:skewX(-20deg);animation:ww-sweep 6s ease-in-out infinite;}
.ww-shine-text{background:linear-gradient(90deg,#fff 0%,#fff 38%,#fde68a 50%,#fff 62%,#fff 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ww-text-shine 5s linear infinite, ww-fade-up .8s cubic-bezier(.2,.8,.2,1) .1s both;filter:drop-shadow(0 4px 14px rgba(30,27,75,.25));}
.ww-twinkle{animation:ww-twinkle 3s ease-in-out infinite;opacity:0;}
.ww-badge{animation:ww-fade-up .6s ease both;}

.ww-ai{background:linear-gradient(120deg,#c026d3,#7c3aed,#4f46e5);background-size:200% 200%;animation:ww-shift 10s ease infinite;}
.ww-cta{background:linear-gradient(120deg,#7c3aed,#4f46e5,#0ea5e9);background-size:200% 200%;animation:ww-shift 6s ease infinite, ww-glow 2.6s ease-in-out infinite;}
.ww-ai-btn{background:linear-gradient(120deg,#c026d3,#7c3aed);}

/* buttons */
.ww-btn-shine{position:relative;overflow:hidden;}
.ww-btn-shine::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:ww-btn-shine 3.2s ease-in-out infinite;pointer-events:none;}
.ww-btn-shine:disabled::after{display:none;}
.ww-add:hover{box-shadow:0 10px 22px -12px rgba(124,58,237,.6);}

/* sliders */
.ww-slider{scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.ww-slider::-webkit-scrollbar{display:none;}

/* weather card */
.ww-card{animation:ww-rise .7s cubic-bezier(.2,.8,.2,1) both;transition:transform .4s cubic-bezier(.2,.8,.2,1);}
.ww-card:hover{transform:translateY(-8px) rotate(-.4deg) scale(1.01);}
.ww-card-sweep{background:linear-gradient(100deg,transparent,rgba(255,255,255,.25),transparent);transform:skewX(-20deg);animation:ww-sweep 5.5s ease-in-out infinite;}
.ww-weather{background-size:200% 200%;animation:ww-shift 12s ease infinite;}

/* sun / snow */
.ww-sun{position:absolute;right:-2rem;top:-2rem;height:9rem;width:9rem;border-radius:9999px;background:radial-gradient(circle,rgba(255,244,180,.9) 0%,rgba(255,214,102,.45) 40%,transparent 70%);animation:ww-sun 3.5s ease-in-out infinite;}
.ww-sun-strong{height:12rem;width:12rem;animation-duration:2.2s;}
.ww-flake{position:absolute;top:-16px;color:rgba(255,255,255,.85);font-size:14px;animation:ww-flake 5s linear infinite;}

/* photos */
.ww-photo{animation:ww-pop .5s cubic-bezier(.2,.8,.2,1) both;transition:transform .3s ease,box-shadow .3s ease;}
.ww-photo:hover{transform:translateY(-4px) rotate(-1.5deg) scale(1.03);box-shadow:0 14px 26px -10px rgba(76,29,149,.55);}

/* stats */
.ww-stat{transition:transform .25s ease, box-shadow .25s ease;}
.ww-stat:hover{transform:translateY(-3px);box-shadow:0 10px 18px -10px rgba(30,64,175,.4);}
.ww-stat:hover .ww-stat-emoji{animation:ww-wiggle .6s ease;}

/* generic entrances */
.ww-pop{animation:ww-pop .4s cubic-bezier(.2,.8,.2,1) both;}
.ww-rise-in{animation:ww-rise-in .8s cubic-bezier(.2,.8,.2,1) both;}
.ww-fade-up{animation:ww-fade-up .7s cubic-bezier(.2,.8,.2,1) both;}
.ww-answer{animation:ww-pop .5s cubic-bezier(.2,.8,.2,1) both, ww-glow-soft 3s ease-in-out .5s 2;}
.ww-chip{animation:ww-pop .5s cubic-bezier(.2,.8,.2,1) both;}
.ww-suggest{animation:ww-fade-up .35s ease both;}
.ww-drop-menu{animation:ww-drop-menu .25s cubic-bezier(.2,.8,.2,1) both;transform-origin:top;}
.ww-shake{animation:ww-pop .35s both, ww-shake .5s .1s both;}

/* glass section */
.ww-glass{transition:box-shadow .4s ease, transform .4s ease;}
.ww-glass:hover{box-shadow:0 30px 60px -28px rgba(124,58,237,.45);}

/* step pills */
.ww-step-pill{display:inline-block;border-radius:9999px;background:linear-gradient(120deg,#ede9fe,#e0e7ff);padding:.25rem .75rem;font-size:.7rem;font-weight:800;color:#6d28d9;letter-spacing:.04em;animation:ww-pop .5s both;}
.ww-step-pill-indigo{background:linear-gradient(120deg,#e0e7ff,#e0f2fe);color:#4338ca;}
.ww-bounce-pin{animation:ww-bounce-pin 2.2s ease-in-out infinite;}

/* slot dots + indicators */
.ww-dot-live{animation:ww-dot-pulse 2.4s ease-out infinite;}
.ww-ping{position:relative;}
.ww-ping::after{content:"";position:absolute;inset:0;border-radius:9999px;background:currentColor;opacity:.5;animation:ww-ping 2.2s ease-out infinite;}
.ww-check{display:inline-block;animation:ww-check .5s cubic-bezier(.34,1.56,.64,1) both;}
.ww-input{transition:border-color .2s ease, box-shadow .3s ease, transform .2s ease;}
.ww-input:focus{transform:translateY(-1px);}

/* floating decor */
.ww-float{display:inline-block;animation:ww-float 4s ease-in-out infinite;}
.ww-float-slow{display:inline-block;animation:ww-float 7s ease-in-out infinite;}
.ww-blob{animation:ww-blob 10s ease-in-out infinite;}
.ww-spin-slow{animation:ww-spin 12s linear infinite;}
.ww-heartbeat{animation:ww-heartbeat 1.6s ease-in-out infinite;}
.ww-glow-ring{animation:ww-float 4s ease-in-out infinite, ww-ring 3s ease-in-out infinite;}
.ww-pin{transition:transform .3s ease;}
input:focus + .ww-pin, .ww-pin:has(+ input:focus){transform:translateY(-60%) scale(1.15);}

/* arrows */
.ww-arrow{height:2.75rem;width:2.75rem;border-radius:9999px;background:#fff;color:#6d28d9;font-size:1.5rem;font-weight:800;line-height:1;box-shadow:0 6px 16px -6px rgba(109,40,217,.45);transition:transform .2s ease,opacity .2s ease,box-shadow .2s ease;}
.ww-arrow:hover:not(:disabled){transform:scale(1.15);box-shadow:0 10px 22px -6px rgba(109,40,217,.6);}
.ww-arrow:active:not(:disabled){transform:scale(.92);}
.ww-arrow:disabled{opacity:.35;cursor:not-allowed;}

/* loaders */
.ww-skeleton{background:linear-gradient(90deg,#ede9fe 25%,#f5f3ff 50%,#ede9fe 75%);background-size:200% 100%;animation:ww-shimmer 1.2s linear infinite;}
.ww-spinner{display:block;height:1rem;width:1rem;border-radius:9999px;border:2px solid #ddd6fe;border-top-color:#7c3aed;animation:ww-spin .7s linear infinite;}
.ww-bar{animation:ww-bar 1.3s ease-in-out infinite;}
.ww-drop{position:absolute;top:-12px;width:2px;height:14px;border-radius:2px;background:rgba(255,255,255,.55);animation:ww-drop 1.4s linear infinite;}
.ww-fill{transform-origin:bottom;animation:ww-grow .9s ease both;}
.ww-dots{display:inline-flex;gap:4px;}
.ww-dots i{height:8px;width:8px;border-radius:9999px;background:#7c3aed;animation:ww-bounce 1s ease-in-out infinite;}
.ww-dots i:nth-child(2){animation-delay:.15s;}
.ww-dots i:nth-child(3){animation-delay:.3s;}
.ww-pulse-bg{animation:ww-pop .4s both, ww-pulse-bg 1.8s ease-in-out infinite;}

/* orbiting loader */
.ww-orbit{position:relative;height:6rem;width:6rem;}
.ww-orbit-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.4rem;animation:ww-float 3s ease-in-out infinite;}
.ww-orbit-item{position:absolute;left:50%;top:50%;margin:-.7rem 0 0 -.7rem;font-size:1.4rem;animation:ww-orbit 3s linear infinite;}

@keyframes ww-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes ww-rise{from{opacity:0;transform:translateX(40px) scale(.96)}to{opacity:1;transform:none}}
@keyframes ww-rise-in{from{opacity:0;transform:translateY(28px) scale(.98)}to{opacity:1;transform:none}}
@keyframes ww-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ww-pop{from{opacity:0;transform:scale(.94) translateY(6px)}to{opacity:1;transform:none}}
@keyframes ww-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(4deg)}}
@keyframes ww-blob{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,20px) scale(1.15)}}
@keyframes ww-shimmer{to{background-position:-200% 0}}
@keyframes ww-spin{to{transform:rotate(360deg)}}
@keyframes ww-bar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
@keyframes ww-drop{to{transform:translateY(220px)}}
@keyframes ww-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes ww-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-6px);opacity:1}}
@keyframes ww-orb-a{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.1)}66%{transform:translate(-30px,50px) scale(.95)}}
@keyframes ww-orb-b{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-70px,40px) scale(1.15)}}
@keyframes ww-cloud{from{transform:translateX(-10vw)}to{transform:translateX(120vw)}}
@keyframes ww-sweep{0%,60%{left:-40%}100%{left:130%}}
@keyframes ww-text-shine{0%{background-position:150% 0}100%{background-position:-100% 0}}
@keyframes ww-twinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:.95;transform:scale(1.2) rotate(90deg)}}
@keyframes ww-glow{0%,100%{box-shadow:0 10px 24px -10px rgba(79,70,229,.55)}50%{box-shadow:0 14px 34px -6px rgba(14,165,233,.75)}}
@keyframes ww-glow-soft{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)}50%{box-shadow:0 0 0 6px rgba(124,58,237,.12)}}
@keyframes ww-btn-shine{0%,55%{left:-60%}100%{left:140%}}
@keyframes ww-sun{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.25);opacity:1}}
@keyframes ww-flake{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(240px) rotate(180deg);opacity:0}}
@keyframes ww-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg) scale(1.2)}75%{transform:rotate(14deg) scale(1.2)}}
@keyframes ww-bounce-pin{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}60%{transform:translateY(0)}80%{transform:translateY(-2px)}}
@keyframes ww-dot-pulse{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes ww-ping{0%{transform:scale(1);opacity:.5}80%,100%{transform:scale(2.6);opacity:0}}
@keyframes ww-check{from{transform:scale(0) rotate(-90deg)}to{transform:scale(1) rotate(0)}}
@keyframes ww-heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(1)}45%{transform:scale(1.18)}}
@keyframes ww-ring{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.35)}50%{box-shadow:0 0 0 10px rgba(255,255,255,0)}}
@keyframes ww-drop-menu{from{opacity:0;transform:scaleY(.85) translateY(-6px)}to{opacity:1;transform:none}}
@keyframes ww-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes ww-pulse-bg{0%,100%{background-color:#f5f3ff}50%{background-color:#ede9fe}}
@keyframes ww-orbit{from{transform:rotate(0) translateX(2.8rem) rotate(0)}to{transform:rotate(360deg) translateX(2.8rem) rotate(-360deg)}}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important;}
  .ww-twinkle{opacity:.6;}
}
`;