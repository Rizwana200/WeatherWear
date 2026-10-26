"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "weather-dashboard-session-v4";

/* ------------------------------------------------------------------ */
/* Weather data helpers                                                */
/* ------------------------------------------------------------------ */

const WEATHER = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Dense freezing drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall", 77: "Snow grains",
  80: "Rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];

function weatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if (SNOW_CODES.includes(code)) return "❄️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

function getAdvice(temperature, rainChance, code) {
  const raining = rainChance >= 50 || RAIN_CODES.includes(code);

  let title = "Comfortable everyday style";
  let clothes = "Choose comfortable clothes, breathable fabrics and footwear suited to your plans.";

  if (temperature >= 35) {
    title = "Beat the heat";
    clothes = "Choose lightweight cotton or linen, breathable tops, loose-fitting bottoms and comfortable sandals. Sunglasses and a hat can help outdoors.";
  } else if (temperature >= 28) {
    title = "Light and breathable";
    clothes = "Wear breathable cotton tops, T-shirts, lightweight shirts, dresses or airy trousers. Choose comfortable footwear for the day.";
  } else if (temperature >= 20) {
    title = "Easy everyday layers";
    clothes = "A T-shirt, shirt or lightweight top with jeans, trousers or a skirt should work well. Carry a light layer if you expect to be out late.";
  } else if (temperature >= 12) {
    title = "Layer up comfortably";
    clothes = "Try a long-sleeved top with jeans or trousers and a light jacket or sweatshirt. Closed shoes can help keep you comfortable.";
  } else {
    title = "Stay warm";
    clothes = "Choose warm layers, a sweater or jacket, full-length trousers and closed footwear. Add a scarf if needed.";
  }

  if (raining) {
    clothes += " Rain is possible, so carry an umbrella or rain jacket and choose water-resistant footwear.";
  }

  let activity = "A walk, errands or outdoor plans should be comfortable.";

  if (temperature >= 35) {
    activity = "Plan outdoor activities for cooler hours, take breaks in the shade and drink water regularly.";
  } else if (temperature >= 29) {
    activity = "Outdoor plans are best earlier or later in the day. Take water and seek shade when needed.";
  }

  if (raining) {
    activity = "Keep an umbrella handy, allow extra time for travel and consider an indoor activity if the rain becomes heavy.";
  }

  if ([95, 96, 99].includes(code)) {
    activity = "A thunderstorm is possible. Prefer indoor activities and avoid exposed outdoor areas during lightning.";
  }

  return { title, clothes, activity };
}

const CATEGORY_DOT = {
  Top: "bg-rose-400",
  Bottom: "bg-indigo-400",
  Layer: "bg-violet-500",
  Shoes: "bg-amber-500",
  Accessory: "bg-emerald-500",
  "Rain gear": "bg-sky-500",
};

function getOutfitItems(temperature, rainChance, code) {
  const raining = rainChance >= 50 || RAIN_CODES.includes(code);
  let items;

  if (temperature >= 35) {
    items = [["👕", "Cotton tee", "Top"], ["🩳", "Light shorts", "Bottom"], ["🕶️", "Sunglasses", "Accessory"], ["🧢", "Cap", "Accessory"], ["🩴", "Sandals", "Shoes"], ["💧", "Water bottle", "Accessory"]];
  } else if (temperature >= 28) {
    items = [["👕", "Breathable top", "Top"], ["👖", "Airy trousers", "Bottom"], ["🕶️", "Sunglasses", "Accessory"], ["👟", "Comfy shoes", "Shoes"]];
  } else if (temperature >= 20) {
    items = [["👕", "Tee or shirt", "Top"], ["👖", "Jeans", "Bottom"], ["🧥", "Light layer", "Layer"], ["👟", "Sneakers", "Shoes"]];
  } else if (temperature >= 12) {
    items = [["👚", "Long sleeves", "Top"], ["👖", "Trousers", "Bottom"], ["🧥", "Light jacket", "Layer"], ["👟", "Closed shoes", "Shoes"]];
  } else {
    items = [["🧥", "Warm jacket", "Layer"], ["🧶", "Sweater", "Top"], ["👖", "Full trousers", "Bottom"], ["🧣", "Scarf", "Accessory"], ["🥾", "Boots", "Shoes"]];
  }

  if (raining) items = [["☔", "Umbrella", "Rain gear"], ["🥾", "Water-resistant shoes", "Rain gear"], ...items.slice(0, 3)];
  return items;
}

function getTheme(current) {
  if (!current) return "clear";
  const code = Number(current.weather_code);
  const temp = Number(current.temperature_2m);
  if (current.is_day === 0) return "night";
  if ([95, 96, 99].includes(code)) return "storm";
  if (RAIN_CODES.includes(code)) return "rain";
  if (SNOW_CODES.includes(code)) return "snow";
  if ([45, 48].includes(code)) return "fog";
  if ([2, 3].includes(code)) return "cloudy";
  if (temp >= 33) return "hot";
  return "clear";
}

// Full-page sky gradients: deep enough for white text on every theme.
const THEME_BG = {
  clear: "linear-gradient(180deg,#0369a1,#0ea5e9 55%,#7dd3fc)",
  hot: "linear-gradient(180deg,#c2410c,#f97316 55%,#fcd34d)",
  cloudy: "linear-gradient(180deg,#334155,#64748b 55%,#94a3b8)",
  rain: "linear-gradient(180deg,#0f172a,#334155 55%,#64748b)",
  storm: "linear-gradient(180deg,#020617,#312e81 55%,#4c1d95)",
  snow: "linear-gradient(180deg,#4338ca,#6366f1 55%,#a5b4fc)",
  fog: "linear-gradient(180deg,#475569,#64748b 55%,#94a3b8)",
  night: "linear-gradient(180deg,#0f0a2e,#1e1b4b 55%,#4c1d95)",
};

// Fixed values (no Math.random) so server and client render the same HTML.
const RAIN_DROPS = Array.from({ length: 28 }, (_, i) => ({ left: (i * 37 + 5) % 100, delay: ((i * 0.37) % 2).toFixed(2), dur: (0.7 + (i % 4) * 0.15).toFixed(2) }));
const SNOW_FLAKES = Array.from({ length: 22 }, (_, i) => ({ left: (i * 23 + 9) % 100, delay: ((i * 0.55) % 5).toFixed(1), dur: (6 + (i % 5) * 1.3).toFixed(1), size: 10 + (i % 4) * 5 }));
const STARS = Array.from({ length: 34 }, (_, i) => ({ left: (i * 41 + 3) % 100, top: (i * 17 + 7) % 70, delay: ((i * 0.3) % 3).toFixed(1), size: 2 + (i % 3) }));

function formatDay(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

function formatShortDay(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function placeLabel(place) {
  if (!place) return "";
  return [place.name, place.admin1, place.country]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");
}

function validPlace(place) {
  return (
    place &&
    typeof place.name === "string" &&
    place.name.trim().length > 0 &&
    Number.isFinite(Number(place.latitude)) &&
    Number.isFinite(Number(place.longitude)) &&
    Number(place.latitude) >= -90 &&
    Number(place.latitude) <= 90 &&
    Number(place.longitude) >= -180 &&
    Number(place.longitude) <= 180
  );
}

function normalizePlace(feature) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const name = properties.name || properties.city || properties.town || properties.village || properties.locality;
  if (!name) return null;

  return {
    name,
    admin1: properties.state || properties.county || properties.district || properties.region || "",
    country: properties.country || "",
    latitude: Number(coordinates[1]),
    longitude: Number(coordinates[0]),
  };
}

function normalizeReversePlace(data, latitude, longitude) {
  const address = data?.address || {};

  const name =
    address.village || address.hamlet || address.town || address.city || address.municipality ||
    address.suburb || address.neighbourhood || address.locality || address.city_district ||
    address.county || address.state_district;

  if (!name) return null;

  return {
    name,
    admin1: address.state || address.region || "",
    country: address.country || "",
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

function getOutfitClimate(current, rainChance = 0) {
  if (!current) return "Moderate";

  const temperature = Number(current.temperature_2m);
  const code = Number(current.weather_code);

  if (rainChance >= 50 || RAIN_CODES.includes(code)) return "Rainy";
  if (temperature >= 32) return "Hot";
  if (temperature <= 18) return "Cold";
  if ([1, 2, 3, 45, 48].includes(code)) return "Cloudy";

  return "Moderate";
}

/* ------------------------------------------------------------------ */
/* Small hooks and components                                          */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    let frame;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return Math.round(value);
}

function useTypewriter(text) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text) {
      setShown("");
      return undefined;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text]);

  return shown;
}

function ImageTile({ item, gender, index }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="ww-pop relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm" style={{ "--i": index }}>
      {!loaded && <div className="ww-skeleton absolute inset-0" />}
      <img
        src={item.image}
        alt={item.alt || `${gender} weather-appropriate outfit`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`aspect-[3/4] w-full object-cover transition duration-700 hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {item.photographer && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
        >
          {item.photographer}
        </a>
      )}
    </div>
  );
}

function SkyBackground({ theme, current }) {
  const code = Number(current?.weather_code);
  const raining = RAIN_CODES.includes(code);
  const snowing = SNOW_CODES.includes(code);
  const sunny = theme === "clear" || theme === "hot";
  const night = theme === "night";
  const storm = theme === "storm";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {Object.entries(THEME_BG).map(([key, bg]) => (
        <div key={key} className="absolute inset-0" style={{ background: bg, opacity: key === theme ? 1 : 0, transition: "opacity 1.4s ease" }} />
      ))}

      <div className="ww-fx" style={{ opacity: sunny ? 1 : 0 }}>
        <div className="ww-sunburst" />
      </div>

      <div className="ww-fx" style={{ opacity: night ? 1 : 0 }}>
        <div className="ww-moon" />
        {STARS.map((s, i) => (
          <span key={i} className="ww-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>

      <div className="ww-fx" style={{ opacity: theme === "hot" || night ? 0.3 : 0.85 }}>
        <div className="ww-bgcloud" style={{ top: "14%", animationDuration: "70s", animationDelay: "-10s" }} />
        <div className="ww-bgcloud" style={{ top: "36%", animationDuration: "95s", animationDelay: "-45s", scale: "1.4" }} />
        <div className="ww-bgcloud" style={{ top: "62%", animationDuration: "80s", animationDelay: "-30s", scale: "0.8" }} />
      </div>

      <div className="ww-fx" style={{ opacity: raining || storm ? 1 : 0 }}>
        {RAIN_DROPS.map((d, i) => (
          <span key={i} className="ww-drop" style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
        ))}
      </div>

      <div className="ww-fx" style={{ opacity: snowing ? 1 : 0 }}>
        {SNOW_FLAKES.map((f, i) => (
          <span key={i} className="ww-flake" style={{ left: `${f.left}%`, fontSize: f.size, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>❄</span>
        ))}
      </div>

      {storm && <div className="ww-flash" />}
    </div>
  );
}

function ExploreButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-900 px-6 py-4 text-left text-white shadow-lg shadow-slate-900/25 ring-1 ring-slate-900 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 hover:ring-indigo-700 active:translate-y-0 active:scale-[0.99]"
    >
      <span className="leading-tight">
        <span className="block text-base font-bold">Explore outfit ideas</span>
        <span className="mt-0.5 block text-xs font-medium text-white/65">Browse looks matched to today's weather</span>
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 transition duration-300 group-hover:translate-x-1">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedForecast, setSelectedForecast] = useState(null);

  const [showOutfitIdeas, setShowOutfitIdeas] = useState(false);
  const [selectedGender, setSelectedGender] = useState("Women");
  const [outfitRecommendations, setOutfitRecommendations] = useState([]);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [outfitError, setOutfitError] = useState("");

  // Outfit photos inside the 5-day forecast popup (separate from the main section).
  const [modalGender, setModalGender] = useState("Women");
  const [modalOutfits, setModalOutfits] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const requestVersion = useRef(0);
  const initialLocationStarted = useRef(false);
  const autocompleteVersion = useRef(0);
  const searchBoxRef = useRef(null);
  const outfitRequest = useRef(0);
  const modalRequest = useRef(0);

  /* ---------- Session helpers ---------- */

  const readSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  };

  const writeSession = (patch) => {
    try {
      const saved = readSession() || {};
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...saved, ...patch, updatedAt: Date.now() }));
    } catch {
      // Weather remains available in component state.
    }
  };

  /* ---------- Weather loading ---------- */

  const loadWeatherForPlace = useCallback(async (place, existingRequestId) => {
    if (!validPlace(place)) {
      setError("Please select a valid location.");
      setLoading(false);
      return;
    }

    const requestId = existingRequestId ?? ++requestVersion.current;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        latitude: String(Number(place.latitude)),
        longitude: String(Number(place.longitude)),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
        forecast_days: "16",
        timezone: "auto",
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });

      if (!response.ok) throw new Error("Unable to fetch weather for this location.");

      const data = await response.json();

      if (!data.current || !Array.isArray(data.daily?.time) || data.daily.time.length === 0) {
        throw new Error("Weather data is unavailable for this location.");
      }

      if (requestId !== requestVersion.current) return;

      const savedPlace = {
        name: place.name,
        admin1: place.admin1 || "",
        country: place.country || "",
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        ...(place.searchText ? { searchText: place.searchText } : {}),
      };

      const label = placeLabel(savedPlace);

      setWeather(data);
      setSelectedPlace(savedPlace);
      setLocation(label);
      setCity(label);
      setCoordinates({ latitude: savedPlace.latitude, longitude: savedPlace.longitude });
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedForecast(null);
      setAiAnswer("");
      setAiError("");

      writeSession({
        place: savedPlace,
        weather: data,
        location: label,
        coordinates: { latitude: savedPlace.latitude, longitude: savedPlace.longitude },
      });
    } catch (err) {
      if (requestId === requestVersion.current) setError(err.message || "Unable to load weather.");
    } finally {
      if (requestId === requestVersion.current) setLoading(false);
    }
  }, []);

  const getLiveLocation = useCallback(() => {
    const requestId = ++requestVersion.current;

    setLoading(true);
    setError("");
    setShowSuggestions(false);
    setSuggestions([]);

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection. Search for your city instead.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (requestId !== requestVersion.current) return;

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const gpsPlace = { name: "Your location", admin1: "", country: "", latitude, longitude };

        await loadWeatherForPlace(gpsPlace, requestId);

        if (requestId !== requestVersion.current) return;

        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            zoom: "14",
            addressdetails: "1",
          });

          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { cache: "no-store" });

          if (!response.ok) throw new Error("Unable to resolve the location name.");

          const data = await response.json();

          if (requestId !== requestVersion.current) return;

          const resolvedPlace = normalizeReversePlace(data, latitude, longitude);
          if (!resolvedPlace) return;

          const label = placeLabel(resolvedPlace);

          setSelectedPlace(resolvedPlace);
          setLocation(label);
          setCity(label);
          setCoordinates({ latitude, longitude });

          const saved = readSession();
          if (saved?.weather) {
            writeSession({ place: resolvedPlace, location: label, coordinates: { latitude, longitude } });
          }
        } catch (err) {
          console.warn("Reverse-geocoding error:", err);
        }
      },
      (geoError) => {
        if (requestId !== requestVersion.current) return;

        let message = "Unable to detect your location. Search for a city instead.";

        if (geoError.code === 1) {
          message = "Location permission was denied. Allow location access in your browser or search for a city.";
        } else if (geoError.code === 2) {
          message = "Your location is currently unavailable. Check your device location settings or search for a city.";
        } else if (geoError.code === 3) {
          message = "Location detection timed out. Try again or search for a city.";
        }

        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          // Ignore unavailable storage.
        }

        setWeather(null);
        setSelectedPlace(null);
        setLocation("");
        setCity("");
        setCoordinates(null);
        setError(message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [loadWeatherForPlace]);

  /*
   * Location behaviour:
   *  - Moving to another page and coming back (client-side navigation) restores the
   *    exact location and weather the person last chose, until they change it.
   *  - A fresh visit (new tab/window) or a full browser reload starts with live GPS.
   */
  useEffect(() => {
    if (initialLocationStarted.current) return;
    initialLocationStarted.current = true;

    let isReload = false;

    try {
      const navigation = performance.getEntriesByType("navigation")[0];
      isReload = navigation?.type === "reload";
    } catch {
      // If navigation information is unavailable, use the saved session.
    }

    if (isReload) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // Ignore unavailable storage.
      }
      getLiveLocation();
      return;
    }

    const saved = readSession();

    const hasValidSession =
      saved?.place &&
      saved?.weather?.current &&
      Array.isArray(saved?.weather?.daily?.time) &&
      saved.weather.daily.time.length > 0 &&
      validPlace(saved.place);

    if (hasValidSession) {
      const label = saved.location || placeLabel(saved.place);

      setWeather(saved.weather);
      setSelectedPlace(saved.place);
      setLocation(label);
      setCity(label);
      setCoordinates(
        saved.coordinates || { latitude: Number(saved.place.latitude), longitude: Number(saved.place.longitude) }
      );
      if (saved.gender === "Men" || saved.gender === "Women") setSelectedGender(saved.gender);
      setLoading(false);
      setError("");
      return;
    }

    getLiveLocation();
  }, [getLiveLocation]);

  /* ---------- Autocomplete ---------- */

  useEffect(() => {
    const query = city.trim();
    const version = ++autocompleteVersion.current;

    if (!showSuggestions || query.length < 2) {
      setSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    if (selectedPlace?.searchText?.toLowerCase() === query.toLowerCase()) {
      setSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPlaces(true);

      try {
        const params = new URLSearchParams({ q: query, limit: "8", lang: "en" });
        const response = await fetch(`https://photon.komoot.io/api/?${params}`);

        if (!response.ok) throw new Error("Location suggestions are unavailable.");

        const data = await response.json();
        const places = (data.features || []).map(normalizePlace).filter(validPlace);

        if (version === autocompleteVersion.current) setSuggestions(places);
      } catch {
        if (version === autocompleteVersion.current) setSuggestions([]);
      } finally {
        if (version === autocompleteVersion.current) setSearchingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [city, showSuggestions, selectedPlace]);

  // Close the suggestion list when clicking elsewhere.
  useEffect(() => {
    function onPointerDown(event) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function searchWeather(event) {
    event.preventDefault();

    const query = city.trim();

    if (!query) {
      setError("Enter a city, town or area.");
      return;
    }

    const requestId = ++requestVersion.current;

    setLoading(true);
    setError("");
    setShowSuggestions(false);

    try {
      let place = null;

      if (selectedPlace?.searchText?.toLowerCase() === query.toLowerCase()) {
        place = selectedPlace;
      }

      if (!place) {
        const params = new URLSearchParams({ name: query, count: "10", language: "en", format: "json" });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);

        if (!response.ok) throw new Error("Location search failed.");

        const data = await response.json();
        const results = data.results || [];

        const candidate = results.find((item) => item.name?.toLowerCase() === query.toLowerCase()) || results[0];

        if (candidate) {
          place = {
            name: candidate.name,
            admin1: candidate.admin1 || candidate.admin2 || "",
            country: candidate.country || "",
            latitude: candidate.latitude,
            longitude: candidate.longitude,
          };
        } else {
          const photonParams = new URLSearchParams({ q: query, limit: "8", lang: "en" });
          const photonResponse = await fetch(`https://photon.komoot.io/api/?${photonParams}`);

          if (photonResponse.ok) {
            const photonData = await photonResponse.json();
            const places = (photonData.features || []).map(normalizePlace).filter(validPlace);
            place = places.find((item) => item.name.toLowerCase() === query.toLowerCase()) || places[0];
          }
        }
      }

      if (requestId !== requestVersion.current) return;

      if (!place || !validPlace(place)) {
        throw new Error(`No matching location found for "${query}". Try selecting a suggestion.`);
      }

      await loadWeatherForPlace(place, requestId);
    } catch (err) {
      if (requestId === requestVersion.current) {
        setError(err.message || "Unable to find that location.");
        setLoading(false);
      }
    }
  }

  function choosePlace(place) {
    ++requestVersion.current;

    const chosenPlace = { ...place, searchText: placeLabel(place) };

    setSelectedPlace(chosenPlace);
    setCity(placeLabel(chosenPlace));
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");

    loadWeatherForPlace(chosenPlace);
  }

  /* ---------- Derived values ---------- */

  const current = weather?.current;
  const todayDate = current?.time?.slice(0, 10);
  const todayIndex = weather?.daily?.time?.indexOf(todayDate) ?? -1;

  const todayRain = todayIndex >= 0 ? weather?.daily?.precipitation_probability_max?.[todayIndex] ?? 0 : 0;
  const todayHigh = todayIndex >= 0 ? weather?.daily?.temperature_2m_max?.[todayIndex] : null;
  const todayLow = todayIndex >= 0 ? weather?.daily?.temperature_2m_min?.[todayIndex] : null;

  const precipitation =
    todayIndex >= 0
      ? weather?.daily?.precipitation_sum?.[todayIndex] ?? current?.precipitation ?? 0
      : current?.precipitation ?? 0;

  const advice = current ? getAdvice(current.temperature_2m, todayRain, current.weather_code) : null;
  const outfitItems = current ? getOutfitItems(current.temperature_2m, todayRain, current.weather_code) : [];
  const theme = getTheme(current);
  const outfitClimate = getOutfitClimate(current, todayRain);

  const visibleDays = weather?.daily?.time?.filter((date) => date >= (todayDate || "")).slice(0, 5) || [];

  const hour = current?.time ? Number(current.time.slice(11, 13)) : null;
  const greeting = hour === null ? "Hello" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const animatedTemp = useCountUp(current ? Math.round(current.temperature_2m) : NaN);
  const typedAnswer = useTypewriter(aiAnswer);

  /* ---------- Outfit ideas + AI ---------- */

  async function fetchOutfitIdeas(gender = selectedGender) {
    if (!current) {
      setOutfitError("Weather data is not available yet.");
      return;
    }

    const outfitId = ++outfitRequest.current;

    setOutfitLoading(true);
    setOutfitError("");
    setOutfitRecommendations([]);
    setSelectedGender(gender);
    writeSession({ gender });

    try {
      const params = new URLSearchParams({ climate: outfitClimate, gender });
      // Real-person outfit photos (Unsplash) from the new /api/explore route.
      const response = await fetch(`/api/explore?${params}`, { method: "GET", cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to load outfit photos.");

      const products = Array.isArray(data.products)
        ? data.products.filter((product) => typeof product.image === "string" && product.image.trim().length > 0)
        : [];

      const uniqueProducts = Array.from(new Map(products.map((product) => [product.image, product])).values());

      if (uniqueProducts.length === 0) {
        throw new Error(`No outfit photos were found for ${gender.toLowerCase()}. Please try again.`);
      }

      if (outfitId === outfitRequest.current) setOutfitRecommendations(uniqueProducts);
    } catch (err) {
      if (outfitId === outfitRequest.current) setOutfitError(err.message || "Unable to load outfit recommendations.");
    } finally {
      if (outfitId === outfitRequest.current) setOutfitLoading(false);
    }
  }

  // Recommendations load by themselves as soon as the weather is known (and when the climate changes).
  const hasWeather = Boolean(weather?.current);
  useEffect(() => {
    if (!hasWeather) return;
    fetchOutfitIdeas(selectedGender);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWeather, outfitClimate]);

  function openOutfitIdeas() {
    setShowOutfitIdeas(true);
    if (outfitRecommendations.length === 0 && !outfitLoading) fetchOutfitIdeas(selectedGender);
  }

  async function askAI(event) {
    event.preventDefault();

    if (!weather?.current || !question.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      const forecast = weather.daily.time.map((date, index) => ({
        date,
        weekday: formatDay(date),
        maxTemperature: weather.daily.temperature_2m_max?.[index] ?? null,
        minTemperature: weather.daily.temperature_2m_min?.[index] ?? null,
        condition: WEATHER[weather.daily.weather_code?.[index]] || "Unknown",
        weatherCode: weather.daily.weather_code?.[index] ?? null,
        rainProbability: weather.daily.precipitation_probability_max?.[index] ?? null,
        precipitationMm: weather.daily.precipitation_sum?.[index] ?? null,
      }));

      let historicalWeather = null;

      if (/\byesterday\b/i.test(question) && coordinates) {
        try {
          const [year, month, day] = current.time.slice(0, 10).split("-").map(Number);
          const yesterday = new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);

          const params = new URLSearchParams({
            latitude: String(coordinates.latitude),
            longitude: String(coordinates.longitude),
            date: yesterday,
          });

          const historyResponse = await fetch(`/api/history?${params}`);
          if (historyResponse.ok) historicalWeather = await historyResponse.json();
        } catch {
          // Historical weather is optional.
        }
      }

      const response = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: location,
          timezone: weather.timezone,
          currentTime: current.time,
          temperature: current.temperature_2m,
          condition: WEATHER[current.weather_code] || "Unknown",
          rainChance: todayRain,
          precipitationMm: precipitation,
          question: question.trim(),
          forecast,
          historicalWeather,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to get an AI answer.");
      if (!data.answer) throw new Error("The AI service returned an empty answer.");

      setAiAnswer(data.answer);
    } catch (err) {
      setAiError(err.message || "Unable to contact the AI assistant.");
    } finally {
      setAiLoading(false);
    }
  }

  // Load outfit photos for the day opened in the forecast popup.
  useEffect(() => {
    if (selectedForecast === null || !weather) return;

    const max = weather.daily.temperature_2m_max[selectedForecast];
    const code = weather.daily.weather_code[selectedForecast];
    const rain = weather.daily.precipitation_probability_max?.[selectedForecast] ?? 0;
    const climate = getOutfitClimate({ temperature_2m: max, weather_code: code }, rain);
    const id = ++modalRequest.current;

    setModalLoading(true);
    setModalError("");
    setModalOutfits([]);

    (async () => {
      try {
        const params = new URLSearchParams({ climate, gender: modalGender });
        const response = await fetch(`/api/explore?${params}`, { method: "GET", cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load outfit photos.");

        const products = Array.isArray(data.products)
          ? data.products.filter((p) => typeof p.image === "string" && p.image.trim().length > 0)
          : [];
        const unique = Array.from(new Map(products.map((p) => [p.image, p])).values());
        if (unique.length === 0) throw new Error("No outfit photos found. Please try again.");

        if (id === modalRequest.current) setModalOutfits(unique);
      } catch (err) {
        if (id === modalRequest.current) setModalError(err.message || "Unable to load outfit photos.");
      } finally {
        if (id === modalRequest.current) setModalLoading(false);
      }
    })();
  }, [selectedForecast, modalGender, weather]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedForecast(null);
        setShowOutfitIdeas(false);
        setShowSuggestions(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const primaryBtn =
    "rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:opacity-60";

  /* ---------- Render ---------- */

  return (
    <main className="relative min-h-screen text-slate-800">
      <SkyBackground theme={theme} current={current} />


      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Location search (part of the page, not a second menu) */}
        <div className="relative z-30 mb-6 flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/80 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:flex-row sm:items-center">
          <form onSubmit={searchWeather} ref={searchBoxRef} className="relative min-w-0 flex-1">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="text-slate-400">🔍</span>
              <input
                value={city}
                onFocus={() => setShowSuggestions(true)}
                onChange={(event) => {
                  ++requestVersion.current;
                  setCity(event.target.value);
                  setSelectedPlace(null);
                  setError("");
                  setShowSuggestions(true);
                }}
                placeholder="Search any city, town or area"
                aria-label="Search location"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              {searchingPlaces && <span className="ww-blink text-xs text-indigo-600">Searching…</span>}
              <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
                Go
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="ww-pop absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {suggestions.map((place, index) => (
                  <button
                    key={`${place.latitude}-${place.longitude}-${index}`}
                    type="button"
                    onClick={() => choosePlace(place)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="mt-0.5">📍</span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{place.name}</span>
                      <span className="block text-xs text-slate-500">{[place.admin1, place.country].filter(Boolean).join(", ")}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={getLiveLocation}
            disabled={loading}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-60"
          >
            {loading ? <span className="ww-blink">Locating…</span> : "📍 Use live location"}
          </button>
        </div>

        {error && (
          <div role="alert" className="ww-pop mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <span>⚠️ {error}</span>
            {!loading && !weather && (
              <button type="button" onClick={getLiveLocation} className="font-bold underline">
                Try live location again
              </button>
            )}
          </div>
        )}

        {loading && !weather && (
          <div className="ww-pop space-y-5">
            <div className="rounded-3xl bg-slate-900 p-8 text-center text-white shadow-xl">
              <div className="ww-float text-5xl">🌤️</div>
              <p className="mt-4 text-lg font-bold">Getting your weather…</p>
              <p className="mt-1 text-sm text-white/70">Waiting for location permission or weather data.</p>
              <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/20">
                <div className="ww-indeterminate h-full w-1/3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" />
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="ww-skeleton h-64 rounded-3xl lg:col-span-2" />
              <div className="ww-skeleton h-64 rounded-3xl" />
            </div>
          </div>
        )}

        {weather && current && advice && (
          <div>
            {/* 1. Weather */}
            <section
              className="ww-reveal px-1 pb-6 pt-2 text-white sm:pt-6"
              style={{ "--i": 0, textShadow: "0 2px 18px rgba(15,23,42,0.35)" }}
            >
              <p className="text-sm font-semibold text-white/85">{greeting}</p>
              <h1 className="mt-1 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">{location}</h1>

              <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
                <p className="text-8xl font-black leading-none tabular-nums sm:text-[8rem]">
                  {animatedTemp}
                  <span className="align-top text-3xl font-bold text-white/70 sm:text-4xl">°C</span>
                </p>
                <div className="pb-2">
                  <p className="flex items-center gap-2 text-xl font-bold">
                    <span className="ww-float text-3xl">{weatherIcon(current.weather_code)}</span>
                    {WEATHER[current.weather_code] || "Current weather"}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Feels like {Math.round(current.apparent_temperature)}°C
                    {todayHigh != null && todayLow != null && ` · High ${Math.round(todayHigh)}° / Low ${Math.round(todayLow)}°`}
                    {` · Humidity ${current.relative_humidity_2m}% · Wind ${current.wind_speed_10m} km/h · Rain ${todayRain}%`}
                    {` · Precipitation ${Number(precipitation).toFixed(1)} mm`}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Forecast strip */}
            <div
              className="ww-reveal mb-8 grid grid-cols-5 divide-x divide-white/25 overflow-hidden rounded-2xl border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-xl"
              style={{ "--i": 1 }}
            >
              {visibleDays.map((date, order) => {
                const index = weather.daily.time.indexOf(date);
                const max = weather.daily.temperature_2m_max[index];
                const min = weather.daily.temperature_2m_min[index];
                const code = weather.daily.weather_code[index];
                const rain = weather.daily.precipitation_probability_max?.[index];

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setModalGender(selectedGender);
                      setSelectedForecast(index);
                    }}
                    className="group px-2 py-4 text-center transition hover:bg-white/15"
                  >
                    <span className="block text-xs font-bold uppercase tracking-wider text-white/80">{order === 0 ? "Today" : formatShortDay(date)}</span>
                    <span className="my-1.5 block text-3xl transition group-hover:scale-110">{weatherIcon(code)}</span>
                    <span className="block text-sm font-bold">{Math.round(max)}°<span className="ml-1 font-medium text-white/60">{Math.round(min)}°</span></span>
                    <span className="mt-0.5 block text-[11px] font-medium text-sky-100">{rain != null ? `${rain}% rain` : ""}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Outfit recommendations: photos are the content */}
            <section id="styling-guide" className="ww-reveal scroll-mt-24 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-8" style={{ "--i": 2 }}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Picked for {Math.round(current.temperature_2m)}°C · {WEATHER[current.weather_code] || "today"}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{advice.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{advice.clothes}</p>
                </div>

                <div className="inline-flex shrink-0 rounded-full bg-slate-100 p-1">
                  {["Women", "Men"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={outfitLoading}
                      onClick={() => fetchOutfitIdeas(g)}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:cursor-wait ${
                        selectedGender === g ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Think: {outfitItems.map(([, label]) => label.toLowerCase()).join(" · ")}
              </p>

              <div className="mt-6">
                {outfitLoading && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="ww-skeleton aspect-[3/4] rounded-2xl" />
                    ))}
                  </div>
                )}

                {!outfitLoading && outfitError && (
                  <div role="alert" className="ww-pop rounded-2xl bg-red-50 p-5 text-sm text-red-700">
                    <p>{outfitError}</p>
                    <button type="button" onClick={() => fetchOutfitIdeas(selectedGender)} className={`${primaryBtn} mt-3`}>
                      Try again
                    </button>
                  </div>
                )}

                {!outfitLoading && !outfitError && outfitRecommendations.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                    {outfitRecommendations.slice(0, 4).map((item, index) => (
                      <ImageTile key={`${selectedGender}-${item.id || item.image}-${index}`} item={item} gender={selectedGender} index={index} />
                    ))}
                  </div>
                )}
              </div>

              <ExploreButton onClick={openOutfitIdeas} />
            </section>

            {/* 4. Ask */}
            <section className="ww-reveal mt-8 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-8" style={{ "--i": 3 }}>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Ask about your outfit</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">Not sure what to wear?</h2>
              <p className="mt-1 text-sm text-slate-500">Ask anything about today or the days ahead and get an answer based on your forecast.</p>

              <form onSubmit={askAI} className="mt-5">
                <label htmlFor="ai-question" className="sr-only">What would you like to know?</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-4 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
                  <input
                    id="ai-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="For example: What should I wear to college tomorrow?"
                    maxLength={500}
                    required
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !question.trim()}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {aiLoading ? "Thinking…" : "Ask"}
                  </button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {["What should I wear today?", "Should I carry an umbrella?", "What about tomorrow?"].map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setQuestion(text)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {aiLoading && (
                <div className="ww-pop mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="ww-typing h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="ww-typing h-2 w-2 rounded-full bg-indigo-500" style={{ animationDelay: "0.15s" }} />
                  <span className="ww-typing h-2 w-2 rounded-full bg-indigo-500" style={{ animationDelay: "0.3s" }} />
                </div>
              )}

              {aiError && (
                <div role="alert" className="ww-pop mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {aiError}
                </div>
              )}

              {aiAnswer && (
                <div className="ww-pop mt-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 ring-1 ring-indigo-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Your answer</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {typedAnswer}
                    {typedAnswer.length < aiAnswer.length && <span className="ww-caret">|</span>}
                  </p>
                </div>
              )}
            </section>

            <footer className="pb-4 pt-6 text-center text-xs text-white/70">
              Weather data by Open-Meteo · Photos from Unsplash
            </footer>
          </div>
        )}
      </div>

      {/* Forecast modal */}
      {selectedForecast !== null && weather && (
        <div className="ww-fade fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setSelectedForecast(null)}>
          <section
            role="dialog"
            aria-modal="true"
            className="ww-pop relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedForecast(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
              aria-label="Close forecast"
            >
              ×
            </button>

            {(() => {
              const date = weather.daily.time[selectedForecast];
              const max = weather.daily.temperature_2m_max[selectedForecast];
              const min = weather.daily.temperature_2m_min[selectedForecast];
              const code = weather.daily.weather_code[selectedForecast];
              const rain = weather.daily.precipitation_probability_max?.[selectedForecast] ?? 0;
              const amount = weather.daily.precipitation_sum?.[selectedForecast] ?? 0;
              const dayAdvice = getAdvice(max, rain, code);
              const dayItems = getOutfitItems(max, rain, code);

              return (
                <>
                  <h2 className="pr-10 text-2xl font-extrabold text-slate-900">{formatDay(date)}</h2>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(date)} · {location}</p>

                  <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-5 text-white">
                    <span className="ww-float absolute right-4 top-3 text-6xl">{weatherIcon(code)}</span>
                    <p className="text-5xl font-black">{Math.round(max)}°</p>
                    <p className="mt-1 text-sm text-white/80">High {Math.round(max)}° · Low {Math.round(min)}°C</p>
                    <p className="mt-1 font-semibold">{WEATHER[code] || "Unknown"}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 p-3 text-center">
                      <p className="text-2xl">🌧️</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{Math.round(rain)}%</p>
                      <p className="text-xs font-semibold text-slate-500">Rain chance</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3 text-center">
                      <p className="text-2xl">💦</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{Number(amount).toFixed(1)}<span className="ml-0.5 text-xs text-slate-500">mm</span></p>
                      <p className="text-xs font-semibold text-slate-500">Precipitation</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-bold text-slate-900">{dayAdvice.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dayItems.map(([icon, label], i) => (
                        <span key={`${label}-${i}`} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <span>{icon}</span>{label}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">🌿 {dayAdvice.activity}</p>
                  </div>

                  {/* Outfit photos for this day */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Outfit ideas</h3>
                      <div className="inline-flex rounded-full bg-slate-100 p-1">
                        {["Women", "Men"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            disabled={modalLoading}
                            onClick={() => setModalGender(g)}
                            className={`rounded-full px-4 py-1.5 text-xs font-bold transition disabled:cursor-wait ${
                              modalGender === g ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      {modalLoading && (
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="ww-skeleton aspect-[3/4] rounded-2xl" />
                          ))}
                        </div>
                      )}

                      {!modalLoading && modalError && (
                        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{modalError}</div>
                      )}

                      {!modalLoading && !modalError && modalOutfits.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {modalOutfits.slice(0, 4).map((item, index) => (
                            <ImageTile key={`modal-${modalGender}-${item.id || item.image}-${index}`} item={item} gender={modalGender} index={index} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <button type="button" onClick={() => setSelectedForecast(null)} className={`${primaryBtn} mt-5 w-full`}>
              Close
            </button>
          </section>
        </div>
      )}

      {/* Outfit ideas modal */}
      {showOutfitIdeas && (
        <div className="ww-fade fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setShowOutfitIdeas(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Weather-based outfit recommendations"
            className="ww-pop relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowOutfitIdeas(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
            >
              ×
            </button>

            <h2 className="pr-10 text-2xl font-extrabold text-slate-900">What should you wear? ✨</h2>

            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800">
              {current ? `${weatherIcon(current.weather_code)} ${Math.round(current.temperature_2m)}°C · ${WEATHER[current.weather_code] || "Current weather"}` : "Weather-based outfit recommendations"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {outfitItems.map(([icon, label], i) => (
                <span key={`${label}-${i}`} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  <span className="text-lg">{icon}</span>{label}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[["Women", "👗"], ["Men", "👔"]].map(([g, emoji]) => (
                <button
                  key={g}
                  type="button"
                  disabled={outfitLoading}
                  onClick={() => fetchOutfitIdeas(g)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                    selectedGender === g
                      ? "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {emoji} {g}
                </button>
              ))}
            </div>

            {outfitLoading && (
              <div className="mt-5">
                <p className="ww-blink mb-3 text-center text-sm font-medium text-indigo-700">
                  Finding {selectedGender.toLowerCase()}'s outfits for {outfitClimate.toLowerCase()} weather…
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="ww-skeleton aspect-[3/4] rounded-2xl" />
                  ))}
                </div>
              </div>
            )}

            {!outfitLoading && outfitError && (
              <div role="alert" className="ww-pop mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{outfitError}</p>
                <button type="button" onClick={() => fetchOutfitIdeas(selectedGender)} className={`${primaryBtn} mt-3`}>
                  Try again
                </button>
              </div>
            )}

            {!outfitLoading && !outfitError && outfitRecommendations.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {outfitRecommendations.map((item, index) => (
                  <ImageTile key={`${selectedGender}-${item.id || item.image}-${index}`} item={item} gender={selectedGender} index={index} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <style jsx global>{`
        .ww-reveal { opacity: 0; animation: ww-rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: calc(var(--i, 0) * 90ms); }
        .ww-pop { opacity: 0; animation: ww-pop 0.4s cubic-bezier(0.2, 1.2, 0.4, 1) both; animation-delay: calc(var(--i, 0) * 60ms); }
        .ww-fade { animation: ww-fade 0.25s ease both; }

        .ww-float { display: inline-block; animation: ww-float 3.2s ease-in-out infinite; }
        .ww-spin { animation: ww-spin 3s linear infinite; }
        .ww-live-dot { animation: ww-live 1.6s ease-in-out infinite; }
        .ww-blink { animation: ww-blink 1.4s ease-in-out infinite; }
        .ww-indeterminate { animation: ww-indet 1.4s ease-in-out infinite; }
        .ww-typing { animation: ww-typing 1s ease-in-out infinite; }
        .ww-caret { animation: ww-blink 0.8s steps(2) infinite; color: #4f46e5; }

        .ww-lift { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease; }
        .ww-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(30, 41, 59, 0.2); }

        .ww-fx { position: absolute; inset: 0; overflow: hidden; transition: opacity 1.2s ease; }
        .ww-sunburst { position: absolute; top: -260px; right: -260px; width: 640px; height: 640px; border-radius: 50%; background: repeating-conic-gradient(rgba(255,255,255,0.4) 0 8deg, transparent 8deg 24deg); -webkit-mask: radial-gradient(circle, #000 12%, transparent 68%); mask: radial-gradient(circle, #000 12%, transparent 68%); animation: ww-spin 50s linear infinite; }
        .ww-sunburst::after { content: ""; position: absolute; inset: 40%; border-radius: 50%; background: #fde047; box-shadow: 0 0 90px 45px rgba(253, 224, 71, 0.7); }
        .ww-moon { position: absolute; top: 8%; right: 12%; width: 84px; height: 84px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff, #e0e7ff 60%, #c7d2fe); box-shadow: 0 0 60px 20px rgba(199, 210, 254, 0.5); animation: ww-float 6s ease-in-out infinite; }
        .ww-star { position: absolute; border-radius: 50%; background: #fff; animation: ww-twinkle 2.6s ease-in-out infinite; }
        .ww-bgcloud { position: absolute; left: 0; width: 220px; height: 64px; border-radius: 64px; background: rgba(255,255,255,0.7); filter: drop-shadow(0 10px 14px rgba(30,58,138,0.15)); animation: ww-cross linear infinite; }
        .ww-bgcloud::before, .ww-bgcloud::after { content: ""; position: absolute; border-radius: 50%; background: inherit; }
        .ww-bgcloud::before { width: 90px; height: 90px; left: 30px; top: -44px; }
        .ww-bgcloud::after { width: 66px; height: 66px; right: 32px; top: -30px; }
        .ww-drop { position: absolute; top: -40px; width: 2px; height: 22px; border-radius: 2px; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.8)); animation: ww-fall linear infinite; }
        .ww-flake { position: absolute; top: -30px; color: #fff; opacity: 0.9; animation: ww-snow linear infinite; }
        .ww-flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: ww-flash 7s linear infinite; }

        .ww-skeleton { background: linear-gradient(100deg, #e2e8f0 30%, #f1f5f9 50%, #e2e8f0 70%); background-size: 250% 100%; animation: ww-shimmer 1.4s linear infinite; }

        @keyframes ww-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes ww-pop { from { opacity: 0; transform: scale(0.94) translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes ww-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ww-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ww-spin { to { transform: rotate(360deg); } }
        @keyframes ww-live { 0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } }
        @keyframes ww-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes ww-indet { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes ww-typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
        @keyframes ww-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes ww-cross { from { transform: translateX(-300px); } to { transform: translateX(calc(100vw + 100px)); } }
        @keyframes ww-fall { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes ww-snow { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 0.9; } 50% { transform: translate(24px, 55vh) rotate(180deg); } 100% { transform: translate(-16px, 110vh) rotate(360deg); opacity: 0; } }
        @keyframes ww-flash { 0%, 90%, 100% { opacity: 0; } 91% { opacity: 0.55; } 92% { opacity: 0; } 94% { opacity: 0.4; } 95% { opacity: 0; } }
        @keyframes ww-shimmer { from { background-position: 150% 0; } to { background-position: -100% 0; } }

        @media (prefers-reduced-motion: reduce) {
          .ww-reveal, .ww-pop, .ww-fade { animation: none; opacity: 1; }
          .ww-float, .ww-spin, .ww-live-dot, .ww-blink, .ww-indeterminate, .ww-typing, .ww-caret, .ww-skeleton, .ww-sunburst, .ww-moon, .ww-star, .ww-bgcloud, .ww-drop, .ww-flake, .ww-flash { animation: none; }
        }
      `}</style>
    </main>
  );
}