
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "weatherwear-compare-session";

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
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return "🌧️";
  if ([71, 73, 75].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

function getOutfit(temp, rain, code) {
  if (rain >= 50 || (code >= 51 && code <= 99)) {
    return {
      title: "Rain-ready outfit",
      clothes: "Choose a water-resistant jacket and comfortable, quick-drying trousers.",
      shoes: "Water-resistant footwear",
      clothesImage:
        "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
      shoesImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      color: "from-sky-500 to-indigo-600",
    };
  }

  if (temp >= 32) {
    return {
      title: "Beat the heat",
      clothes: "Choose breathable cotton, lightweight trousers, and loose-fitting clothing.",
      shoes: "Breathable sneakers or sandals",
      clothesImage:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      shoesImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      color: "from-orange-400 to-rose-500",
    };
  }

  if (temp >= 24) {
    return {
      title: "Light and comfortable",
      clothes: "Wear a breathable T-shirt with comfortable jeans or lightweight trousers.",
      shoes: "Everyday sneakers",
      clothesImage:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      shoesImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      color: "from-emerald-400 to-teal-600",
    };
  }

  if (temp >= 16) {
    return {
      title: "Layer up lightly",
      clothes: "Wear long sleeves and carry a lightweight jacket.",
      shoes: "Comfortable closed shoes",
      clothesImage:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      shoesImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      color: "from-violet-400 to-purple-600",
    };
  }

  return {
    title: "Stay warm",
    clothes: "Choose a warm sweater, layered clothing, and a jacket.",
    shoes: "Closed shoes",
    clothesImage:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    shoesImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    color: "from-blue-500 to-indigo-700",
  };
}

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
    admin1:
      properties.state ||
      properties.county ||
      properties.district ||
      "",
    country: properties.country || "",
    latitude: Number(coordinates[1]),
    longitude: Number(coordinates[0]),
  };
}

function placeLabel(place) {
  if (!place) return "";

  return [place.name, place.admin1, place.country]
    .filter(Boolean)
    .join(", ");
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
  {
    name: "Hyderabad",
    admin1: "Telangana",
    country: "India",
    latitude: 17.385,
    longitude: 78.4867,
  },
  {
    name: "Bengaluru",
    admin1: "Karnataka",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
  },
];

function LocationAutocomplete({
  index,
  slot,
  onInputChange,
  onChoose,
  onRemove,
  canRemove,
}) {
  useEffect(() => {
    const query = slot.input.trim();

    if (!slot.open || query.length < 2 || slot.place) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      onInputChange(index, query, { searching: true });

      try {
        const params = new URLSearchParams({
          q: query,
          limit: "10",
          lang: "en",
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Location search failed.");
        }

        const data = await response.json();
        const results = (data.features || [])
          .map(normalizePhotonPlace)
          .filter(Boolean);

        if (!cancelled) {
          onInputChange(index, query, {
            suggestions: results,
            searching: false,
          });
        }
      } catch (error) {
        if (error.name !== "AbortError" && !cancelled) {
          onInputChange(index, query, {
            suggestions: [],
            searching: false,
          });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [index, slot.input, slot.open, slot.place, onInputChange]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            📍
          </span>

          <input
            type="text"
            value={slot.input}
            autoComplete="off"
            placeholder={`Search city ${index + 1}...`}
            aria-label={`Search city ${index + 1}`}
            aria-expanded={slot.open && !slot.place}
            onFocus={() =>
              onInputChange(index, slot.input, { open: true })
            }
            onChange={(event) =>
              onInputChange(index, event.target.value, {
                place: null,
                suggestions: [],
                searching: false,
                open: true,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onInputChange(index, slot.input, { open: false });
              }

              if (
                event.key === "Enter" &&
                slot.open &&
                slot.suggestions.length > 0
              ) {
                event.preventDefault();
                onChoose(index, slot.suggestions[0]);
              }
            }}
            className="w-full rounded-2xl border border-violet-100 bg-white/90 py-3.5 pl-11 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />

          {slot.searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-violet-600">
              Searching…
            </span>
          )}

          {slot.open && !slot.place && slot.input.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-violet-100 bg-white p-2 shadow-2xl">
              {slot.searching ? (
                <p className="px-3 py-3 text-sm text-slate-500">
                  Finding matching places…
                </p>
              ) : slot.suggestions.length > 0 ? (
                slot.suggestions.map((place, suggestionIndex) => (
                  <button
                    key={`${place.latitude}-${place.longitude}-${suggestionIndex}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChoose(index, place)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-violet-50"
                  >
                    <span>📍</span>
                    <span>
                      <span className="block font-semibold text-slate-800">
                        {place.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[place.admin1, place.country]
                          .filter(Boolean)
                          .join(", ")}
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
            className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-rose-500 transition hover:bg-rose-100"
          >
            ✕
          </button>
        )}
      </div>

      {slot.place && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate font-medium text-emerald-700">
            ✓ {placeLabel(slot.place)}
          </span>
          <button
            type="button"
            onClick={() =>
              onInputChange(index, slot.input, {
                place: null,
                suggestions: [],
                open: true,
              })
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

async function fetchCityWeather(place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "16",
    timezone: "auto",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather could not be loaded for ${place.name}.`);
  }

  const data = await response.json();

  if (!data.current || !data.daily?.time?.length) {
    throw new Error(`Incomplete weather data for ${place.name}.`);
  }

  return {
    place,
    label: placeLabel(place),
    weather: data,
  };
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

export default function ComparePage() {
  const [slots, setSlots] = useState(() =>
    initialPlaces.map((place) => makeSlot(place))
  );
  const [cityWeather, setCityWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Restore the comparison when returning to this page or refreshing.
  useEffect(() => {
    const saved = readSession();

    if (saved) {
      if (Array.isArray(saved.slots) && saved.slots.length >= 2) {
        setSlots(
          saved.slots.slice(0, 5).map((slot) => ({
            ...makeSlot(slot.place || null),
            input: slot.input || "",
          }))
        );
      }

      if (Array.isArray(saved.cityWeather)) {
        setCityWeather(saved.cityWeather);
      }

      if (typeof saved.question === "string") {
        setQuestion(saved.question);
      }

      if (typeof saved.aiAnswer === "string") {
        setAiAnswer(saved.aiAnswer);
      }
    }

    setHydrated(true);
  }, []);

  // Save the useful comparison state without saving temporary loading/errors.
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
        })
      );
    } catch {
      // The page continues to work if session storage is unavailable.
    }
  }, [hydrated, slots, cityWeather, question, aiAnswer]);

  const updateSlot = useCallback((index, input, updates = {}) => {
    setSlots((previous) =>
      previous.map((slot, i) =>
        i === index ? { ...slot, input, ...updates } : slot
      )
    );
  }, []);

  function choosePlace(index, place) {
    if (
      !place ||
      !Number.isFinite(place.latitude) ||
      !Number.isFinite(place.longitude)
    ) {
      return;
    }

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
    if (slots.length >= 5) return;
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
      setError(
        `Please select a place from the suggestions for city ${missingIndex + 1}.`
      );
      setSlots((previous) =>
        previous.map((slot, index) =>
          index === missingIndex ? { ...slot, open: true } : slot
        )
      );
      return;
    }

    const uniquePlaces = new Set(
      chosenPlaces.map(
        (place) => `${place.latitude},${place.longitude}`
      )
    );

    if (uniquePlaces.size !== chosenPlaces.length) {
      setError("Please select a different location for each city.");
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        chosenPlaces.map((place) => fetchCityWeather(place))
      );
      setCityWeather(results);
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
          maxTemperature:
            weather.daily.temperature_2m_max?.[index] ?? null,
          minTemperature:
            weather.daily.temperature_2m_min?.[index] ?? null,
          condition:
            WEATHER_LABELS[weather.daily.weather_code?.[index]] || "Unknown",
          rainProbability:
            weather.daily.precipitation_probability_max?.[index] ?? null,
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
            condition:
              WEATHER_LABELS[current.weather_code] || "Unknown",
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

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an AI answer.");
      }

      const answer =
        data.answer ||
        data.reply ||
        data.message ||
        data.response ||
        data.recommendation;

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-rose-50 px-4 py-7 text-slate-800 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Colorful page header */}
        <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-500 p-7 text-white shadow-xl shadow-indigo-200 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
              🌈 WeatherWear
            </span>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Compare the weather
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-50 sm:text-base">
              Compare temperatures, rain, and wind across cities, then discover
              what to wear for each destination.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-3 py-2">
                ☀️ Live conditions
              </span>
              <span className="rounded-full bg-white/15 px-3 py-2">
                👕 Outfit ideas
              </span>
              <span className="rounded-full bg-white/15 px-3 py-2">
                ✨ AI stylist
              </span>
            </div>
          </div>
        </section>

        {/* City selector */}
        <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-lg shadow-violet-100/70 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-violet-600">
                Step 1
              </span>
              <h2 className="mt-1 text-2xl font-black">
                Choose your locations 📍
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Search for a city and select a result from the dropdown.
              </p>
            </div>

            <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-extrabold text-violet-700">
              {slots.length} / 5 cities
            </span>
          </div>

          <form onSubmit={compareWeather} className="mt-6">
            <div className="grid gap-5 md:grid-cols-2">
              {slots.map((slot, index) => (
                <div key={index}>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
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

            <div className="mt-6 flex flex-wrap gap-3">
              {slots.length < 5 && (
                <button
                  type="button"
                  onClick={addCity}
                  className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-100"
                >
                  + Add another city
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "🌦️ Comparing…" : "Compare weather →"}
              </button>
            </div>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              ⚠️ {error}
            </p>
          )}
        </section>

        {loading && (
          <div className="mt-7 rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-lg">
            <div className="text-5xl">🌦️</div>
            <p className="mt-4 text-lg font-extrabold text-violet-800">
              Checking your cities…
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Fetching the latest weather information.
            </p>
            <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-violet-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-sky-500" />
            </div>
          </div>
        )}

        {!loading && cityWeather.length > 0 && (
          <>
            {/* Comparison results */}
            <section className="mt-9">
              <div className="mb-5">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
                  Step 2 · Live comparison
                </span>
                <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                  Weather in each location 🌍
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Compare current conditions and personalized outfit ideas.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {cityWeather.map(({ place, weather }) => {
                  const current = weather.current;
                  const today = current.time.slice(0, 10);
                  const todayIndex = weather.daily.time.indexOf(today);
                  const rain =
                    weather.daily.precipitation_probability_max?.[
                      todayIndex
                    ] ?? 0;

                  const outfit = getOutfit(
                    current.temperature_2m,
                    rain,
                    current.weather_code
                  );

                  return (
                    <article
                      key={`${place.latitude}-${place.longitude}`}
                      className="group overflow-hidden rounded-3xl border border-white bg-white shadow-lg shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div
                        className={`bg-gradient-to-br ${outfit.color} p-5 text-white`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black">
                              {place.name}
                            </h3>
                            <p className="mt-1 text-xs text-white/80">
                              {[place.admin1, place.country]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>

                          <span className="rounded-2xl bg-white/20 p-3 text-3xl">
                            {weatherIcon(current.weather_code)}
                          </span>
                        </div>

                        <div className="mt-6">
                          <p className="text-5xl font-black tracking-tight">
                            {Math.round(current.temperature_2m)}°
                            <span className="text-2xl">C</span>
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white/90">
                            {WEATHER_LABELS[current.weather_code] ||
                              "Current weather"}
                          </p>
                          <p className="mt-1 text-xs text-white/75">
                            Feels like{" "}
                            {Math.round(current.apparent_temperature)}°C
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-4">
                        <div className="rounded-2xl bg-sky-50 p-3 text-center">
                          <span className="text-xl">💧</span>
                          <p className="mt-1 text-xs text-slate-500">
                            Humidity
                          </p>
                          <p className="mt-1 font-black text-sky-700">
                            {current.relative_humidity_2m}%
                          </p>
                        </div>

                        <div className="rounded-2xl bg-indigo-50 p-3 text-center">
                          <span className="text-xl">🌧️</span>
                          <p className="mt-1 text-xs text-slate-500">Rain</p>
                          <p className="mt-1 font-black text-indigo-700">
                            {rain}%
                          </p>
                        </div>

                        <div className="rounded-2xl bg-amber-50 p-3 text-center">
                          <span className="text-xl">💨</span>
                          <p className="mt-1 text-xs text-slate-500">Wind</p>
                          <p className="mt-1 font-black text-amber-700">
                            {current.wind_speed_10m}
                          </p>
                          <p className="text-[10px] text-slate-500">km/h</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 p-5">
                        <span className="rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
                          👗 Outfit recommendation
                        </span>

                        <h4 className="mt-4 text-lg font-black">
                          {outfit.title}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {outfit.clothes}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="overflow-hidden rounded-2xl bg-rose-50">
                            <img
                              src={outfit.clothesImage}
                              alt="Suggested clothing"
                              className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <p className="p-2.5 text-xs font-bold text-slate-700">
                              👕 Clothing
                            </p>
                          </div>

                          <div className="overflow-hidden rounded-2xl bg-sky-50">
                            <img
                              src={outfit.shoesImage}
                              alt="Suggested footwear"
                              className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <p className="p-2.5 text-xs font-bold text-slate-700">
                              👟 {outfit.shoes}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* AI stylist */}
            <section className="mt-9 overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-violet-100/70">
              <div className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 p-6 text-white sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl">
                    ✨
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-100">
                      Step 3 · Personalized advice
                    </span>
                    <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                      Ask your AI stylist
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                      Compare your selected cities, plan an outfit, or ask
                      about a date in the available forecast.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <p className="text-sm font-extrabold text-slate-700">
                  Try asking 👇
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Which city is hotter?",
                    "Which city has the highest chance of rain?",
                    "What should I wear in each city today?",
                    "Compare the weather tomorrow.",
                    "Which city is better for outdoor activities?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="rounded-full border border-violet-100 bg-gradient-to-r from-violet-50 to-sky-50 px-4 py-2.5 text-left text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:from-violet-100 hover:to-sky-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <form onSubmit={askAI} className="mt-6">
                  <label
                    htmlFor="compare-question"
                    className="mb-2 block text-sm font-extrabold text-slate-700"
                  >
                    Your question
                  </label>

                  <textarea
                    id="compare-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="What should I wear in Hyderabad and Bengaluru next Friday?"
                    maxLength={500}
                    rows={3}
                    required
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="submit"
                    disabled={aiLoading || !question.trim()}
                    className="mt-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3.5 font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:from-fuchsia-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiLoading ? "✨ Thinking…" : "Ask AI stylist ✨"}
                  </button>
                </form>

                {aiError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
                  >
                    ⚠️ {aiError}
                  </p>
                )}

                {aiLoading && (
                  <div className="mt-5 rounded-2xl bg-violet-50 p-5">
                    <p className="animate-pulse font-semibold text-violet-700">
                      ✨ Your stylist is preparing a recommendation…
                    </p>
                  </div>
                )}

                {aiAnswer && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-violet-100">
                    <div className="bg-gradient-to-r from-violet-100 to-sky-100 px-5 py-4">
                      <h3 className="font-black text-violet-900">
                        💜 Your personalized recommendation
                      </h3>
                    </div>
                    <p className="whitespace-pre-wrap p-5 text-sm leading-7 text-slate-700">
                      {aiAnswer}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {!loading && cityWeather.length === 0 && (
          <section className="mt-7 rounded-3xl border border-white bg-white/80 p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-3xl">
              🌍
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-800">
              Your city comparison starts here
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Choose at least two locations above and select Compare weather
              to see their weather conditions and outfit recommendations.
            </p>
          </section>
        )}

        <footer className="py-8 text-center text-xs text-slate-400">
          WeatherWear · Dress for the weather, wherever you go 🌈
        </footer>
      </div>
    </main>
  );
}
