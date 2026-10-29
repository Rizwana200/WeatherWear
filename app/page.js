"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const APP_ROUTE = "/dashboard"; // where users land after the intro

// Fixed values (no Math.random) so server and client render identical HTML.
// Add 4 photos of a real person wearing the outfit to public/outfits/:
// sunny.jpg, rainy.jpg, windy.jpg, chilly.jpg
// Portrait or landscape both work (like the editorial example): the card crops around the person.
// `pos` moves the crop (x% y%) so the face and outfit stay in frame.
const WEATHER = [
  { icon: "☀️", name: "Sunny", temp: 32, tip: "Light tee, shorts and a sun hat", img: "/outfits/sunny.jpg", pos: "50% 25%" },
  { icon: "🌧️", name: "Rainy", temp: 18, tip: "Raincoat, boots and an umbrella", img: "/outfits/rainy.jpg", pos: "50% 25%" },
  { icon: "🌬️", name: "Windy", temp: 22, tip: "Light jacket and a warm scarf", img: "/outfits/windy.jpg", pos: "50% 25%" },
  { icon: "❄️", name: "Chilly", temp: 6, tip: "Puffer coat, beanie and mittens", img: "/outfits/chilly.jpg", pos: "50% 25%" },
];

const RAIN = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 31 + 7) % 100,
  delay: ((i * 0.41) % 2).toFixed(2),
  duration: (0.8 + (i % 4) * 0.15).toFixed(2),
}));

const SNOW = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 23 + 11) % 100,
  delay: ((i * 0.6) % 5).toFixed(1),
  duration: (5 + (i % 5) * 1.2).toFixed(1),
  size: 10 + (i % 4) * 5,
}));

const WIND = [
  { top: 20, delay: 0, width: 170 },
  { top: 36, delay: 0.9, width: 110 },
  { top: 55, delay: 1.7, width: 200 },
  { top: 72, delay: 0.5, width: 130 },
];

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
const HOLD_AT = 80; // loading waits here until the real weather arrives
const FINAL_AT = 85; // then the photo settles on today's outfit

// Maps Open-Meteo values to one of the four looks above (0 sunny, 1 rainy, 2 windy, 3 chilly).
function classify(code, temp, wind) {
  const rain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (rain) return 1;
  if (snow || temp <= 10) return 3;
  if (wind >= 25) return 2;
  return 0;
}

function safeStorage(action, key, value) {
  try {
    if (action === "get") return window.sessionStorage.getItem(key);
    window.sessionStorage.setItem(key, value);
  } catch {
    return null;
  }
}

function Word({ text, className, startDelay = 0 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="letter"
          style={{ animationDelay: `${startDelay + i * 0.06}s` }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const mainRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [real, setReal] = useState(null); // { idx, temp } once today's weather is known
  const settledRef = useRef(false); // true when the weather request has finished (or failed)
  const redirectRef = useRef(null);

  const goToApp = () => {
    safeStorage("set", "ww:seen", "1");
    setLeaving(true);
    redirectRef.current = setTimeout(() => router.replace(APP_ROUTE), 600);
  };

  // 1) Get today's real weather while the intro plays. Fails quietly.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const giveUp = setTimeout(() => {
      settledRef.current = true;
    }, 5000);

    const finish = () => {
      settledRef.current = true;
    };

    if (!("geolocation" in navigator)) {
      finish();
      return () => clearTimeout(giveUp);
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}` +
            "&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto";
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error("weather request failed");
          const { current } = await res.json();
          const temp = Math.round(current.temperature_2m);
          const idx = classify(current.weather_code, temp, current.wind_speed_10m);
          if (!cancelled) {
            setReal({ idx, temp });
            safeStorage("set", "ww:weather", JSON.stringify({ idx, temp, at: Date.now() }));
          }
        } catch {
          /* keep the generic intro */
        } finally {
          finish();
        }
      },
      finish,
      { timeout: 4500, maximumAge: 600000 }
    );

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(giveUp);
    };
  }, []);

  // 2) Loading animation. If the intro was already seen this session, skip to the app.
  useEffect(() => {
    if (safeStorage("get", "ww:seen")) {
      router.replace(APP_ROUTE);
      return undefined;
    }

    let value = 0;
    const loadingTimer = setInterval(() => {
      if (value >= HOLD_AT && !settledRef.current) return; // wait for the weather
      value += 1;
      setProgress(value);
      if (value >= 100) {
        clearInterval(loadingTimer);
        goToApp();
      }
    }, 45);

    return () => {
      clearInterval(loadingTimer);
      clearTimeout(redirectRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Light mouse / touch tilt: updates CSS variables only.
  const handleMove = (e) => {
    const el = mainRef.current;
    if (!el) return;
    el.style.setProperty("--mx", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
    el.style.setProperty("--my", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
  };

  const settling = progress >= FINAL_AT;
  const finalIdx = real ? real.idx : 0;
  const w = settling ? finalIdx : Math.min(Math.floor(progress / 20), 3);
  const cur = WEATHER[w];
  const showTemp = settling && real;
  const tip = !settling
    ? cur.tip
    : real
    ? `Today: ${cur.tip.charAt(0).toLowerCase()}${cur.tip.slice(1)}`
    : "Let’s find today’s outfit";
  const statusText =
    progress >= 100
      ? "Ready!"
      : progress >= HOLD_AT && !settledRef.current
      ? "Getting your local weather…"
      : "Checking today’s weather…";

  return (
    <main
      ref={mainRef}
      onPointerMove={handleMove}
      data-w={w}
      className={`scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-center ${
        leaving ? "leaving" : ""
      }`}
    >
      <button type="button" className="skip" onClick={goToApp}>
        Skip
      </button>

      {/* Sky for each weather, cross-fading */}
      <div className="bg bg0" />
      <div className="bg bg1" />
      <div className="bg bg2" />
      <div className="bg bg3" />
      <div className="shade" />

      {/* Weather effects */}
      <div className="fx fx-sun" aria-hidden="true">
        <div className="sunburst" />
      </div>
      <div className="fx fx-rain" aria-hidden="true">
        {RAIN.map((d, i) => (
          <span key={i} className="drop" style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s` }} />
        ))}
      </div>
      <div className="fx fx-wind" aria-hidden="true">
        {WIND.map((s, i) => (
          <span key={i} className="streak" style={{ top: `${s.top}%`, width: `${s.width}px`, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <div className="fx fx-snow" aria-hidden="true">
        {SNOW.map((f, i) => (
          <span key={i} className="flake" style={{ left: `${f.left}%`, fontSize: `${f.size}px`, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s` }}>
            ❄
          </span>
        ))}
      </div>

      <section className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Brand */}
        <svg viewBox="-10 -6 130 106" className="mark" fill="none" aria-hidden="true">
          <g className="rays" stroke="#FFE066" strokeWidth="6" strokeLinecap="round">
            {RAYS.map((a) => (
              <path key={a} d="M30 3V-4" transform={`rotate(${a} 30 37)`} />
            ))}
          </g>
          <circle cx="30" cy="37" r="22" fill="#FFC83D" />
          <g className="mark-cloud">
            <path
              d="M34 75H87C101 75 108 66 108 55C108 44 99 35 87 35C84 22 74 15 62 17C49 18 42 27 40 39C26 39 17 47 17 58C17 68 24 75 34 75Z"
              fill="white"
              stroke="#48A5F5"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-6xl">
          <Word text="WeatherWear" className="wordmark" />
        </h1>
        <p className="tagline mt-2 text-sm font-medium text-white sm:text-xl">
          Dress for the weather. Feel your best.
        </p>

        {/* Weather chip: names only while previewing, real temperature once known */}
        <div key={`chip-${w}-${settling}`} className="chip mt-5">
          <span className="chip-icon">{cur.icon}</span>
          {showTemp && <span className="chip-temp">{real.temp}°C</span>}
          <span className="chip-name">{settling && !real ? "Your day" : cur.name}</span>
        </div>

        {/* Stage: a real person wearing the outfit (replaces the cartoon figure) */}
        <div className="stage mt-3">
          <div className="halo" />
          <div className="card">
            {WEATHER.map((o, i) => (
              <div key={o.name} className={`look ${w === i ? "on" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.img}
                  alt={`${o.name} weather outfit`}
                  className="photo"
                  style={{ objectPosition: o.pos }}
                  loading={i === 0 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ))}
            <div className="card-shade" />
          </div>
          <div className="floor" />
        </div>

        {/* Outfit suggestion for this weather */}
        <p key={`tip-${w}`} className="tip mt-4 text-base font-semibold text-white sm:text-xl">
          {tip}
        </p>

        {/* Loading bar */}
        <div
          className="mt-5 w-full max-w-xs px-3"
          role="status"
          aria-live="polite"
          aria-label={`Loading WeatherWear: ${progress}%`}
        >
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-white/35"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="fill relative h-full overflow-hidden rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }}>
              <span className="shine" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold tabular-nums text-white/90">
            {statusText}
          </p>
          <p className="privacy mt-1 text-xs text-white/80">
            Your location is only used to check the weather.
          </p>
        </div>
      </section>

      <style jsx>{`
        .scene { --mx: 0; --my: 0; background: #7dd3fc; transition: opacity 0.6s ease, transform 0.6s ease; }
        .scene.leaving { opacity: 0; transform: scale(1.04); }

        /* ---------- Skies ---------- */
        .bg { position: absolute; inset: 0; opacity: 0; transition: opacity 1.1s ease; }
        .bg0 { background: linear-gradient(180deg, #38bdf8, #7dd3fc 50%, #fcd34d); }
        .bg1 { background: linear-gradient(180deg, #334155, #64748b 50%, #94a3b8); }
        .bg2 { background: linear-gradient(180deg, #14b8a6, #67e8f9 55%, #bae6fd); }
        .bg3 { background: linear-gradient(180deg, #4f46e5, #a5b4fc 55%, #e0e7ff); }
        .scene[data-w="0"] .bg0, .scene[data-w="1"] .bg1, .scene[data-w="2"] .bg2, .scene[data-w="3"] .bg3 { opacity: 1; }
        .shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(15, 23, 42, 0) 45%, rgba(15, 23, 42, 0.38)); }

        /* ---------- Effects ---------- */
        .fx { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0; transition: opacity 0.9s ease; }
        .scene[data-w="0"] .fx-sun, .scene[data-w="1"] .fx-rain, .scene[data-w="2"] .fx-wind, .scene[data-w="3"] .fx-snow { opacity: 1; }

        .sunburst {
          position: absolute; top: -220px; right: -220px; width: 560px; height: 560px; border-radius: 50%;
          background: repeating-conic-gradient(rgba(255, 255, 255, 0.45) 0 8deg, transparent 8deg 24deg);
          -webkit-mask: radial-gradient(circle, #000 12%, transparent 68%);
          mask: radial-gradient(circle, #000 12%, transparent 68%);
          animation: spin 40s linear infinite;
        }
        .sunburst::after { content: ""; position: absolute; inset: 40%; border-radius: 50%; background: #fde047; box-shadow: 0 0 80px 40px rgba(253, 224, 71, 0.75); }

        .drop { position: absolute; top: -40px; width: 2px; height: 22px; border-radius: 2px; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.85)); animation: fall linear infinite; }
        .streak { position: absolute; left: -240px; height: 3px; border-radius: 3px; background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0)); animation: blow 3s ease-in-out infinite; }
        .flake { position: absolute; top: -30px; color: #fff; opacity: 0.9; animation: snow linear infinite; }

        /* ---------- Title (global: these elements live in <Word/>) ---------- */
        :global(.letter) { display: inline-block; opacity: 0; animation: pop 0.7s cubic-bezier(0.2, 1.5, 0.4, 1) forwards; }
        :global(.wordmark) { color: #fff; text-shadow: 0 4px 18px rgba(15, 23, 42, 0.4); }
        .mark { width: 4.5rem; height: 4rem; overflow: visible; filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.3)); animation: appear 0.9s cubic-bezier(0.2, 1.4, 0.4, 1) both; }
        .rays { animation: spin 16s linear infinite; }
        .mark-cloud { animation: nudge 3.5s ease-in-out infinite alternate; }
        .tagline { opacity: 0; text-shadow: 0 2px 10px rgba(15, 23, 42, 0.35); animation: rise 0.8s ease-out 1.1s forwards; }

        /* ---------- Weather chip ---------- */
        .chip {
          display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.4rem 1rem 0.4rem 0.6rem; border-radius: 999px;
          background: rgba(255, 255, 255, 0.28); border: 1px solid rgba(255, 255, 255, 0.6); backdrop-filter: blur(8px);
          color: #fff; font-weight: 700; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
          animation: chip-in 0.6s cubic-bezier(0.2, 1.5, 0.4, 1) both;
        }
        .chip-icon { font-size: 1.5rem; animation: float 2s ease-in-out infinite; }
        .chip-temp { font-size: 1.25rem; font-variant-numeric: tabular-nums; }
        .chip-name { opacity: 0.95; }

        /* ---------- Stage + real-person photo card ---------- */
        .stage { position: relative; display: flex; justify-content: center; transform: translate3d(calc(var(--mx) * 10px), calc(var(--my) * 6px), 0); transition: transform 0.3s ease-out; }
        .halo { position: absolute; top: 4%; width: 15rem; height: 15rem; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 70%); animation: breathe 4s ease-in-out infinite; }
        .floor { position: absolute; bottom: -4px; width: 7rem; height: 0.9rem; border-radius: 50%; background: rgba(15, 23, 42, 0.28); filter: blur(4px); animation: shadow 2.6s ease-in-out infinite; }

        .card {
          position: relative; height: 17rem; width: 13rem; border-radius: 1.25rem; overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.85);
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.12));
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.4);
          animation: appear 0.9s cubic-bezier(0.2, 1.4, 0.4, 1) 0.3s both;
        }
        .look { position: absolute; inset: 0; opacity: 0; transform: scale(1.05); transition: opacity 0.7s ease, transform 1s ease; }
        .look.on { opacity: 1; transform: scale(1); }
        .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .card-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(15, 23, 42, 0) 60%, rgba(15, 23, 42, 0.28)); }

        .skip {
          position: absolute; top: max(1rem, env(safe-area-inset-top)); right: 1rem; z-index: 20;
          padding: 0.45rem 0.95rem; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.22); backdrop-filter: blur(8px); color: #fff; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: background 0.2s ease, transform 0.2s ease;
        }
        .skip:hover { background: rgba(255, 255, 255, 0.38); transform: translateY(-1px); }
        .skip:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
        .privacy { text-shadow: 0 1px 6px rgba(15, 23, 42, 0.4); }

        .tip { min-height: 1.75rem; text-shadow: 0 2px 10px rgba(15, 23, 42, 0.4); animation: rise 0.5s ease-out both; }

        /* ---------- Progress ---------- */
        .fill { background: linear-gradient(90deg, #fde047, #fb923c, #f472b6); }
        .shine { position: absolute; inset: 0; width: 50px; background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0)); animation: shine 1.3s linear infinite; }

        /* ---------- Keyframes ---------- */
        @keyframes nudge { from { transform: translateX(-3px); } to { transform: translateX(5px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fall { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes blow { 0% { transform: translateX(0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateX(125vw); opacity: 0; } }
        @keyframes snow { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 0.9; } 50% { transform: translate(24px, 55vh) rotate(180deg); } 100% { transform: translate(-16px, 110vh) rotate(360deg); opacity: 0; } }
        @keyframes pop { 0% { opacity: 0; transform: translateY(32px) scale(0.6) rotate(-8deg); } 100% { opacity: 1; transform: none; } }
        @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes chip-in { from { opacity: 0; transform: translateY(-10px) scale(0.85); } to { opacity: 1; transform: none; } }
        @keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes appear { from { opacity: 0; transform: translateY(30px) scale(0.85); } to { opacity: 1; transform: none; } }
        @keyframes shadow { 0%, 100% { transform: scaleX(1); opacity: 0.8; } 50% { transform: scaleX(0.88); opacity: 0.55; } }
        @keyframes shine { from { transform: translateX(-60px); } to { transform: translateX(340px); } }

        @media (prefers-reduced-motion: reduce) {
          .mark, .rays, .mark-cloud, .sunburst, .drop, .streak, .flake, .halo, .card, .floor, .chip, .chip-icon, .shine, .tip { animation: none; }
          :global(.letter), .tagline { animation: none; opacity: 1; }
          .stage { transform: none; }
        }
      `}</style>
    </main>
  );
}