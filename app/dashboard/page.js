
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "weatherwear-weather";
const SESSION_KEY = "weatherwear-dashboard-session";

const weatherLabels = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

function getWeatherIcon(code) {
  if ([0, 1].includes(code)) return "☀️";
  if ([2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code))
    return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

function getAdvice(temp, rain, code) {
  if (
    rain >= 50 ||
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      code
    )
  ) {
    return {
      emoji: "🌧️",
      title: "Rain-ready outfit",
      clothes:
        "Wear a water-resistant jacket and comfortable shoes.",
      activity:
        "Choose indoor plans if rain becomes heavy, and carry an umbrella when going out.",
    };
  }

  if (temp >= 32) {
    return {
      emoji: "🧢",
      title: "Beat the heat",
      clothes:
        "Choose light cotton clothes, sunglasses and a breathable hat.",
      activity:
        "Plan outdoor activities for the cooler morning or evening hours.",
    };
  }

  if (temp >= 24) {
    return {
      emoji: "👕",
      title: "Light and comfortable",
      clothes:
        "A T-shirt, light trousers and breathable shoes are suitable.",
      activity:
        "A walk, college commute, or casual outdoor plan should feel comfortable.",
    };
  }

  if (temp >= 16) {
    return {
      emoji: "🧥",
      title: "Layer up lightly",
      clothes: "Wear long sleeves with a light jacket.",
      activity:
        "A walk or sightseeing can be comfortable with a light extra layer.",
    };
  }

  return {
    emoji: "🧣",
    title: "Stay warm",
    clothes:
      "Wear a warm sweater, layered clothing and a jacket.",
    activity:
      "Choose indoor plans or a short walk with warm layers, especially early or late in the day.",
  };
}

function formatWeekday(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizePhotonPlace(feature) {
  const properties = feature?.properties || {};
  const coords = feature?.geometry?.coordinates;

  if (
    !Array.isArray(coords) ||
    coords.length < 2 ||
    !Number.isFinite(Number(coords[0])) ||
    !Number.isFinite(Number(coords[1]))
  ) {
    return null;
  }

  const name =
    properties.village ||
    properties.town ||
    properties.city ||
    properties.locality ||
    properties.name ||
    properties.county ||
    properties.state ||
    properties.country;

  if (!name) return null;

  return {
    name,
    admin1:
      properties.state ||
      properties.county ||
      properties.district ||
      "",
    country: properties.country || "",
    latitude: Number(coords[1]),
    longitude: Number(coords[0]),
    source: "Photon",
  };
}

function placeLabel(place) {
  return (
    [place?.name, place?.admin1, place?.country]
      .filter(Boolean)
      .join(", ") || "Your current location"
  );
}

function validCoordinates(place) {
  return (
    Number.isFinite(Number(place?.latitude)) &&
    Number.isFinite(Number(place?.longitude)) &&
    Number(place.latitude) >= -90 &&
    Number(place.latitude) <= 90 &&
    Number(place.longitude) >= -180 &&
    Number(place.longitude) <= 180
  );
}

const outfitImages = {
  rain: [
    {
      src: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=700&q=85",
      alt: "Rainy weather outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=85",
      alt: "Jacket outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=85",
      alt: "Casual layered outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
      alt: "Casual fashion inspiration",
    },
  ],
  hot: [
    {
      src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=85",
      alt: "Light summer outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
      alt: "Summer fashion inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=85",
      alt: "Lightweight clothing inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
      alt: "Everyday summer outfit inspiration",
    },
  ],
  mild: [
    {
      src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
      alt: "Casual everyday outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
      alt: "Casual fashion inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=85",
      alt: "Everyday clothing inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=700&q=85",
      alt: "Seasonal outfit inspiration",
    },
  ],
  cold: [
    {
      src: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=85",
      alt: "Cold weather jacket outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=700&q=85",
      alt: "Layered outfit inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=85",
      alt: "Warm clothing inspiration",
    },
    {
      src: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=700&q=85",
      alt: "Cold season fashion inspiration",
    },
  ],
};

function getOutfitCategory(current, rainChance) {
  if (!current) return "mild";

  const code = current.weather_code;
  const temp = current.temperature_2m;

  if (
    rainChance >= 50 ||
    [
      51, 53, 55, 56, 57, 61, 63, 65, 66, 67,
      80, 81, 82, 95, 96, 99,
    ].includes(code)
  ) {
    return "rain";
  }

  if (temp >= 32) return "hot";
  if (temp < 16) return "cold";

  return "mild";
}

export default function Dashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [location, setLocation] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [showOutfitIdeas, setShowOutfitIdeas] = useState(false);

  const initialLocationStarted = useRef(false);

  const loadWeatherForPlace = useCallback(async (place) => {
    if (!validCoordinates(place)) {
      setError(
        "I couldn't identify that location. Please choose a suggestion or try another search."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setAiAnswer("");

    try {
      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
        forecast_days: "16",
        timezone: "auto",
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`
      );

      if (!response.ok) {
        throw new Error(
          "Weather data is temporarily unavailable. Please try again."
        );
      }

      const data = await response.json();

      if (!data.current || !data.daily?.time?.length) {
        throw new Error("Incomplete weather data received.");
      }

      const savedPlace = {
        ...place,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        searchText: placeLabel(place),
      };

      const label = placeLabel(savedPlace);

      const savedState = {
        place: savedPlace,
        weather: data,
        location: label,
        coordinates: {
          latitude: savedPlace.latitude,
          longitude: savedPlace.longitude,
        },
        savedAt: Date.now(),
      };

      setLocation(label);
      setCity(label);
      setCoordinates(savedState.coordinates);
      setSelectedPlace(savedPlace);
      setWeather(data);
      setSearchOpen(false);
      setShowSuggestions(false);
      setSuggestions([]);

      // Shared with other pages, including Store.
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      } catch {
        // The current page can still display weather without localStorage.
      }

      // Used to restore the same selected location when navigating
      // between Dashboard and Store in the same browser tab.
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(savedState));
      } catch {
        // The dashboard can still work without sessionStorage.
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreSessionWeather = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;

      const saved = JSON.parse(raw);

      if (
        !saved?.weather?.current ||
        !saved?.weather?.daily?.time?.length ||
        !validCoordinates(saved.place)
      ) {
        return false;
      }

      setWeather(saved.weather);
      setLocation(saved.location || placeLabel(saved.place));
      setCity(saved.location || placeLabel(saved.place));
      setSelectedPlace(saved.place);
      setCoordinates(saved.coordinates || {
        latitude: Number(saved.place.latitude),
        longitude: Number(saved.place.longitude),
      });
      setError("");
      setLoading(false);

      return true;
    } catch {
      return false;
    }
  }, []);

  const searchWeather = useCallback(
    async (event) => {
      event?.preventDefault();

      const query = city.trim();

      if (!query) {
        setError("Please enter a city, town, or area.");
        return;
      }

      setLoading(true);
      setError("");
      setShowSuggestions(false);

      try {
        let place =
          selectedPlace?.searchText?.toLowerCase() === query.toLowerCase()
            ? selectedPlace
            : null;

        if (!place) {
          const params = new URLSearchParams({
            name: query,
            count: "10",
            language: "en",
            format: "json",
          });

          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?${params}`
          );

          if (!response.ok) {
            throw new Error("Location search failed. Please try again.");
          }

          const results = (await response.json()).results || [];

          const exact = results.find(
            (item) => item.name?.toLowerCase() === query.toLowerCase()
          );

          const candidate = exact || results[0];

          if (candidate) {
            place = {
              name: candidate.name,
              admin1: candidate.admin1 || candidate.admin2 || "",
              country: candidate.country || "",
              latitude: candidate.latitude,
              longitude: candidate.longitude,
            };
          } else {
            const photonParams = new URLSearchParams({
              q: query,
              limit: "8",
              lang: "en",
            });

            const photonResponse = await fetch(
              `https://photon.komoot.io/api/?${photonParams}`
            );

            if (photonResponse.ok) {
              const photonData = await photonResponse.json();

              const places = (photonData.features || [])
                .map(normalizePhotonPlace)
                .filter(Boolean);

              place =
                places.find(
                  (item) => item.name.toLowerCase() === query.toLowerCase()
                ) || places[0];
            }
          }
        }

        if (!place || !validCoordinates(place)) {
          throw new Error(
            `No matching location found for "${query}". Try selecting a suggestion.`
          );
        }

        await loadWeatherForPlace(place);
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    [city, selectedPlace, loadWeatherForPlace]
  );

  useEffect(() => {
    const query = city.trim();

    if (
      !searchOpen ||
      query.length < 2 ||
      selectedPlace?.searchText?.toLowerCase() === query.toLowerCase()
    ) {
      setSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearchingPlaces(true);

      try {
        const params = new URLSearchParams({
          q: query,
          limit: "8",
          lang: "en",
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params}`
        );

        if (!response.ok) {
          throw new Error("Location suggestions unavailable");
        }

        const results = (await response.json()).features || [];
        const places = results.map(normalizePhotonPlace).filter(Boolean);

        if (!cancelled) {
          setSuggestions(places);
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearchingPlaces(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city, selectedPlace, searchOpen]);

  function choosePlace(place) {
    setSelectedPlace({
      ...place,
      searchText: placeLabel(place),
    });

    setCity(placeLabel(place));
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");

    loadWeatherForPlace(place);
  }

  async function reverseGeocode(latitude, longitude) {
    let place = {
      name: "My current location",
      admin1: "",
      country: "",
      latitude,
      longitude,
    };

    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        limit: "10",
        lang: "en",
      });

      const response = await fetch(
        `https://photon.komoot.io/reverse?${params}`
      );

      if (response.ok) {
        const features = (await response.json()).features || [];

        const settlement = ["village", "town", "city", "locality"]
          .map((field) =>
            features.find((feature) => feature.properties?.[field])
          )
          .find(Boolean);

        const preferred =
          settlement ||
          features.find((feature) => {
            const type = String(
              feature.properties?.type || ""
            ).toLowerCase();

            return ![
              "house",
              "street",
              "district",
              "postcode",
            ].includes(type);
          }) ||
          features[0];

        const nearby = preferred
          ? normalizePhotonPlace(preferred)
          : null;

        if (nearby) {
          place = {
            ...nearby,
            latitude,
            longitude,
          };
        }
      }
    } catch {
      // GPS coordinates remain usable if reverse geocoding fails.
    }

    return place;
  }

  function useMyLocation() {
    setError("");

    if (!navigator.geolocation) {
      setLoading(false);
      setError(
        "Your browser does not support location access. Please search for your area instead."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const place = await reverseGeocode(latitude, longitude);

          await loadWeatherForPlace(place);
        } catch {
          setLoading(false);
          setError(
            "Unable to load your current location. Please try again or use Find a city."
          );
        }
      },
      (geoError) => {
        setLoading(false);

        if (geoError.code === 1) {
          setError(
            "Location permission was denied. Allow location access in your browser, or use Find a city."
          );
        } else if (geoError.code === 3) {
          setError(
            "Location lookup timed out. Please try Use my location again or use Find a city."
          );
        } else {
          setError(
            "Your location is unavailable. Please try again or use Find a city."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // A hard refresh should request GPS again.
  // A client-side return from Store should restore the selected city.
  useEffect(() => {
    if (initialLocationStarted.current) return;
    initialLocationStarted.current = true;

    let navigationType = "navigate";

    try {
      navigationType =
        performance.getEntriesByType("navigation")[0]?.type || "navigate";
    } catch {
      // Use the session state when the navigation type is unavailable.
    }

    if (navigationType !== "reload" && restoreSessionWeather()) {
      return;
    }

    useMyLocation();

    // Run once when the dashboard mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreSessionWeather]);

  const current = weather?.current;
  const todayDate = current?.time?.slice(0, 10);
  const todayIndex = weather?.daily?.time?.indexOf(todayDate) ?? -1;

  const todayRain =
    todayIndex >= 0
      ? weather?.daily?.precipitation_probability_max?.[todayIndex] ?? 0
      : 0;

  const todayPrecipitation =
    todayIndex >= 0
      ? weather?.daily?.precipitation_sum?.[todayIndex] ??
        current?.precipitation ??
        0
      : current?.precipitation ?? 0;

  const advice = current
    ? getAdvice(
        current.temperature_2m,
        todayRain,
        current.weather_code
      )
    : null;

  const visibleDays =
    weather?.daily?.time
      ?.filter((day) => day >= (todayDate ?? ""))
      .slice(0, 3) ?? [];

  async function askAI(event) {
    event.preventDefault();

    if (!weather?.current || !question.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      const dailyForecast = weather.daily.time.map((date, index) => ({
        date,
        weekday: formatWeekday(date),
        maxTemperature:
          weather.daily.temperature_2m_max?.[index] ?? null,
        minTemperature:
          weather.daily.temperature_2m_min?.[index] ?? null,
        condition:
          weatherLabels[weather.daily.weather_code?.[index]] ?? "Unknown",
        weatherCode: weather.daily.weather_code?.[index] ?? null,
        rainProbability:
          weather.daily.precipitation_probability_max?.[index] ?? null,
        precipitationMm:
          weather.daily.precipitation_sum?.[index] ?? null,
      }));

      const currentDate = weather.current.time.slice(0, 10);
      const [year, month, day] = currentDate.split("-").map(Number);

      const yesterday = new Date(
        Date.UTC(year, month - 1, day - 1)
      )
        .toISOString()
        .slice(0, 10);

      let historicalWeather = null;

      if (/\byesterday\b/i.test(question) && coordinates) {
        try {
          const params = new URLSearchParams({
            latitude: String(coordinates.latitude),
            longitude: String(coordinates.longitude),
            date: yesterday,
          });

          const response = await fetch(`/api/history?${params}`);

          if (response.ok) {
            historicalWeather = await response.json();
          }
        } catch (historyError) {
          console.error("Historical weather error:", historyError);
        }
      }

      const response = await fetch("/api/outfit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: location,
          timezone: weather.timezone,
          currentTime: weather.current.time,
          temperature: weather.current.temperature_2m,
          condition:
            weatherLabels[weather.current.weather_code] || "Unknown",
          rainChance: todayRain,
          precipitationMm: todayPrecipitation,
          question: question.trim(),
          forecast: dailyForecast,
          historicalWeather,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an AI answer.");
      }

      if (!data.answer) {
        throw new Error("The AI service returned an empty answer.");
      }

      setAiAnswer(data.answer);
    } catch (err) {
      setAiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function exploreOutfit() {
    setShowOutfitIdeas(true);
  }

  function openForecast(index) {
    setSelectedForecast(index);
  }

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedForecast(null);
        setShowOutfitIdeas(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const outfitCategory = getOutfitCategory(current, todayRain);
  const currentOutfitImages = outfitImages[outfitCategory];

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-100 via-sky-50 to-pink-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-7">
        {searchOpen && (
          <form
            onSubmit={searchWeather}
            className="relative z-20 mb-6 rounded-2xl border border-violet-200 bg-white/95 p-3 shadow-lg shadow-violet-100"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-xl">📍</span>

                <input
                  id="location-search"
                  value={city}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setSelectedPlace(null);
                    setError("");
                    setShowSuggestions(true);
                  }}
                  placeholder="Search any city or location worldwide"
                  aria-label="Search location"
                  autoComplete="off"
                  className="w-full min-w-0 py-3 outline-none"
                />

                {searchingPlaces && (
                  <span className="text-xs text-slate-400">
                    Searching…
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {loading ? "Checking…" : "Update weather →"}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-3 right-3 top-full mt-2 max-h-72 overflow-y-auto rounded-2xl border border-violet-100 bg-white p-2 shadow-xl">
                {suggestions.map((place, index) => (
                  <button
                    key={`${place.latitude}-${place.longitude}-${index}`}
                    type="button"
                    onClick={() => choosePlace(place)}
                    className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-violet-50"
                  >
                    <span>📍</span>
                    <span>
                      <span className="block font-semibold">
                        {place.name}
                      </span>
                      <span className="block text-sm text-slate-500">
                        {[place.admin1, place.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions &&
              city.trim().length >= 2 &&
              !searchingPlaces &&
              suggestions.length === 0 && (
                <p className="px-4 pt-3 text-sm text-slate-500">
                  No suggestions found. You can still submit the location.
                </p>
              )}
          </form>
        )}

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm"
          >
            {error}
          </p>
        )}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-200 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-100">
                Weather meets wardrobe
              </p>

              <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
                Feel ready for whatever the sky brings.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100">
                Your local forecast, outfit ideas and AI stylist — together
                in one simple dashboard.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((open) => !open);
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  <span>⌕</span>
                  {searchOpen ? "Close city search" : "Find a city"}
                </button>

                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-4 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25 disabled:opacity-60"
                >
                  <span>◎</span>
                  {loading ? "Getting location…" : "Use my location"}
                </button>
              </div>
            </div>

            <div className="self-start rounded-2xl border border-white/20 bg-white/15 p-5 text-center shadow-lg backdrop-blur-md sm:self-auto">
              <span className="text-5xl">
                {current ? getWeatherIcon(current.weather_code) : "🌤️"}
              </span>

              <p className="mt-2 max-w-56 text-sm font-semibold">
                {loading
                  ? "Checking weather…"
                  : location || "Waiting for your location"}
              </p>
            </div>
          </div>
        </section>

        {loading && !weather && (
          <div
            role="status"
            className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-violet-50 p-10 text-center shadow-sm"
          >
            <span className="animate-pulse text-4xl">🌦️</span>
            <p className="mt-3 font-semibold text-slate-600">
              Finding your weather…
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Your dashboard will be ready in a moment.
            </p>
          </div>
        )}

        {weather && current && advice && (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-700">
                  Live conditions
                </p>
                <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                  {location}
                </h2>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm">
                Updated from Open-Meteo
              </p>
            </div>

            <div className="grid items-stretch gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <article className="rounded-3xl border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-cyan-100 p-5 shadow-lg shadow-sky-100 transition duration-300 hover:shadow-xl sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-800">
                    Current conditions
                  </p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    ● Live
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <span className="text-5xl sm:text-6xl">
                    {getWeatherIcon(current.weather_code)}
                  </span>
                  <div>
                    <p className="text-5xl font-extrabold tracking-tight text-slate-900">
                      {Math.round(current.temperature_2m)}°
                      <span className="text-2xl text-slate-400">C</span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {weatherLabels[current.weather_code] || "Current weather"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Feels like {Math.round(current.apparent_temperature)}°C
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-sky-200 pt-4 sm:grid-cols-4 sm:gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-3">
                    <span>💧</span>
                    <p className="mt-1 text-xs text-slate-600">Humidity</p>
                    <p className="mt-1 text-sm font-bold sm:text-base">
                      {current.relative_humidity_2m}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 p-3">
                    <span>🌧️</span>
                    <p className="mt-1 text-xs text-slate-600">Rain chance</p>
                    <p className="mt-1 text-sm font-bold sm:text-base">
                      {todayRain}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 p-3">
                    <span>💦</span>
                    <p className="mt-1 text-xs text-slate-600">
                      Precipitation
                    </p>
                    <p className="mt-1 text-sm font-bold sm:text-base">
                      {Number(todayPrecipitation).toFixed(1)} mm
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 p-3">
                    <span>💨</span>
                    <p className="mt-1 text-xs text-slate-600">Wind</p>
                    <p className="mt-1 text-sm font-bold sm:text-base">
                      {current.wind_speed_10m}
                      <span className="text-xs font-medium"> km/h</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-sky-200 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      Next 3 days
                    </h3>
                    <span className="text-xs text-slate-500">
                      Tap a day for details
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {visibleDays.map((date) => {
                      const index = weather.daily.time.indexOf(date);
                      const max = weather.daily.temperature_2m_max[index];
                      const min = weather.daily.temperature_2m_min[index];
                      const code = weather.daily.weather_code[index];
                      const rain =
                        weather.daily.precipitation_probability_max?.[index];
                      const precipitation =
                        weather.daily.precipitation_sum?.[index];

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => openForecast(index)}
                          aria-label={`View forecast for ${formatWeekday(date)}`}
                          className="w-full min-w-0 rounded-xl border border-sky-100 bg-white/80 px-2 py-3 text-center transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400"
                        >
                          <p className="truncate text-xs font-bold text-slate-600 sm:text-sm">
                            {formatWeekday(date)}
                          </p>
                          <p className="my-2 text-2xl">
                            {getWeatherIcon(code)}
                          </p>
                          <p className="text-sm font-extrabold">
                            {Math.round(max)}°
                            <span className="ml-1 font-medium text-slate-400">
                              {Math.round(min)}°
                            </span>
                          </p>
                          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
                            🌧 {rain ?? "—"}
                            {rain != null ? "%" : ""}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            💦{" "}
                            {precipitation != null
                              ? `${Number(precipitation).toFixed(1)} mm`
                              : "—"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-white via-fuchsia-50 to-pink-100 p-5 shadow-lg shadow-pink-100 transition duration-300 hover:shadow-xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
                    Today's outfit
                  </p>
                  <span className="text-3xl">{advice.emoji}</span>
                </div>

                <h2 className="mt-3 text-2xl font-extrabold">
                  {advice.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Outfit suggestions based on the weather in {location}.
                </p>

                <div className="mt-5 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-100 to-rose-100 p-4">
                  <p className="font-bold">👚 What to wear</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {advice.clothes}
                  </p>
                </div>

                <div className="mt-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-100 to-teal-100 p-4">
                  <p className="font-bold">🌿 Activity</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {advice.activity}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4">
                  <p className="text-sm font-bold text-slate-800">
                    Today's weather summary
                  </p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Temperature</span>
                    <span className="font-semibold">
                      {Math.round(current.temperature_2m)}°C
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Conditions</span>
                    <span className="font-semibold">
                      {weatherLabels[current.weather_code] || "Unknown"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Chance of rain</span>
                    <span className="font-semibold">{todayRain}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Precipitation</span>
                    <span className="font-semibold">
                      {Number(todayPrecipitation).toFixed(1)} mm
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  General recommendations based on current weather.
                </p>

                <button
                  type="button"
                  onClick={exploreOutfit}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:from-fuchsia-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                >
                  Explore outfit ideas <span aria-hidden="true">→</span>
                </button>
              </article>
            </div>

            {selectedForecast !== null && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                onClick={() => setSelectedForecast(null)}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="forecast-dialog-title"
                  className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-6 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedForecast(null)}
                    aria-label="Close forecast details"
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700 transition hover:bg-violet-200"
                  >
                    ×
                  </button>

                  {(() => {
                    const date = weather.daily.time[selectedForecast];
                    const max =
                      weather.daily.temperature_2m_max[selectedForecast];
                    const min =
                      weather.daily.temperature_2m_min[selectedForecast];
                    const code =
                      weather.daily.weather_code[selectedForecast];
                    const rain =
                      weather.daily.precipitation_probability_max?.[
                        selectedForecast
                      ] ?? 0;
                    const precipitation =
                      weather.daily.precipitation_sum?.[selectedForecast] ?? 0;
                    const dayAdvice = getAdvice(max, rain, code);

                    return (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
                          Daily forecast details
                        </p>
                        <h2
                          id="forecast-dialog-title"
                          className="mt-2 pr-10 text-2xl font-extrabold text-slate-900"
                        >
                          {formatWeekday(date)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(date)} · {location}
                        </p>

                        <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-violet-200">
                          <div className="flex items-center gap-4">
                            <span className="text-5xl">
                              {getWeatherIcon(code)}
                            </span>
                            <div>
                              <p className="text-4xl font-extrabold">
                                {Math.round(max)}°
                              </p>
                              <p className="mt-1 text-sm text-indigo-100">
                                High {Math.round(max)}° · Low{" "}
                                {Math.round(min)}°C
                              </p>
                              <p className="mt-1 text-sm font-medium">
                                {weatherLabels[code] || "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-sky-100 p-4">
                            <p className="text-xs text-slate-500">
                              🌧 Rain probability
                            </p>
                            <p className="mt-2 text-xl font-bold">{rain}%</p>
                          </div>
                          <div className="rounded-xl bg-teal-100 p-4">
                            <p className="text-xs text-slate-500">
                              💦 Precipitation
                            </p>
                            <p className="mt-2 text-xl font-bold">
                              {Number(precipitation).toFixed(1)} mm
                            </p>
                          </div>
                          <div className="col-span-2 rounded-xl bg-amber-100 p-4">
                            <p className="text-xs text-slate-500">
                              🌡 Temperature range
                            </p>
                            <p className="mt-2 text-xl font-bold">
                              {Math.round(min)}°–{Math.round(max)}°C
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-violet-100 bg-white/80 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                            Outfit suggestion
                          </p>
                          <h3 className="mt-2 text-lg font-extrabold">
                            <span className="mr-2">{dayAdvice.emoji}</span>
                            {dayAdvice.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {dayAdvice.clothes}
                          </p>
                          <div className="mt-3 rounded-xl bg-emerald-100 p-3">
                            <p className="text-sm font-semibold text-emerald-800">
                              Activity
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {dayAdvice.activity}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedForecast(null)}
                          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700"
                        >
                          Close details
                        </button>
                      </>
                    );
                  })()}
                </section>
              </div>
            )}

            <section
              id="ai-assistant"
              className="mt-7 scroll-mt-24 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-pink-50 shadow-lg shadow-violet-100"
            >
              <div className="bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600 p-5 text-white sm:p-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl shadow-inner">
                    ✦
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-100">
                      Your personal stylist
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                      Ask your AI assistant
                    </h2>
                    <p className="mt-1 text-sm text-violet-100">
                      Get outfit and weather advice for your plans.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Try asking
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "What should I wear today?",
                    "Should I carry an umbrella?",
                    "What about tomorrow?",
                    "What is the weather the day after tomorrow?",
                    "What should I wear next Monday?",
                    "What was the weather yesterday?",
                    "Suggest footwear for today's climate",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="rounded-full border border-violet-200 bg-gradient-to-r from-violet-100 to-pink-100 px-3 py-2 text-left text-xs text-violet-800 transition hover:-translate-y-0.5 hover:from-violet-200 hover:to-pink-200 sm:text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <form onSubmit={askAI} className="mt-5">
                  <label
                    htmlFor="ai-question"
                    className="mb-2 block text-sm font-bold"
                  >
                    What would you like to know?
                  </label>

                  <textarea
                    id="ai-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="For example: What should I wear to college next Friday?"
                    maxLength={500}
                    required
                    rows={3}
                    className="w-full rounded-xl border border-violet-200 bg-white p-4 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      Uses the current weather and available forecast.
                    </p>
                    <button
                      type="submit"
                      disabled={aiLoading || !question.trim()}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {aiLoading ? "Thinking…" : "Ask AI ✨"}
                    </button>
                  </div>
                </form>

                {aiError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  >
                    {aiError}
                  </p>
                )}

                {aiAnswer && (
                  <div className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-100 to-pink-100 p-5">
                    <h3 className="font-bold text-violet-950">
                      Your recommendation
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {aiAnswer}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      AI suggestions are general guidance. Use your own
                      judgment.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {!weather && !loading && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-sky-50 to-violet-100 p-8 text-center shadow-md">
            <p className="text-4xl">🌦️</p>
            <h2 className="mt-3 text-xl font-bold">
              Weather is ready when you are
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Allow location access or search for a location to see its
              weather.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5"
              >
                Find a city
              </button>
              <button
                type="button"
                onClick={useMyLocation}
                className="rounded-xl border border-violet-200 bg-white px-5 py-3 font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Use my location
              </button>
            </div>
          </div>
        )}
      </div>

      {showOutfitIdeas && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => setShowOutfitIdeas(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Weather-based outfit ideas"
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-pink-50 p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowOutfitIdeas(false)}
              aria-label="Close outfit ideas"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700 transition hover:bg-violet-200"
            >
              ×
            </button>

            <div className="mb-5 pr-12">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-700">
                WeatherWear
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                Outfit inspiration
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {location} ·{" "}
                {current ? getWeatherIcon(current.weather_code) : "🌤️"}{" "}
                {current ? `${Math.round(current.temperature_2m)}°C` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {currentOutfitImages.map((outfit, index) => (
                <div
                  key={`${outfitCategory}-${index}`}
                  className="overflow-hidden rounded-2xl border border-white bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <img
                    src={outfit.src}
                    alt={outfit.alt}
                    loading="lazy"
                    className="h-52 w-full object-cover transition duration-500 hover:scale-105 sm:h-72"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
