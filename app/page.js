
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;
    let redirectTimer;

    const loadingTimer = setInterval(() => {
      value += 1;
      setProgress(value);

      if (value >= 100) {
        clearInterval(loadingTimer);

        redirectTimer = setTimeout(() => {
          router.replace("/dashboard");
        }, 250);
      }
    }, 28);

    return () => {
      clearInterval(loadingTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-200 via-white to-indigo-200 px-4 text-center">
      {/* Soft background clouds */}
      <div className="cloud cloud-left" />
      <div className="cloud cloud-right" />

      {/* Decorative bottom waves */}
      <div className="wave wave-blue" />
      <div className="wave wave-purple" />

      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        {/* Weather logo */}
        <div className="logo-icon mb-4">
          <svg
            viewBox="0 0 120 100"
            className="h-28 w-32"
            fill="none"
            aria-hidden="true"
          >
            <g stroke="#FFBC32" strokeWidth="6" strokeLinecap="round">
              <path d="M30 14V5 M10 24L4 17 M50 24L57 17 M7 43L0 41" />
            </g>
            <circle cx="30" cy="37" r="22" fill="#FFC83D" />
            <path
              d="M34 75H87C101 75 108 66 108 55C108 44 99 35 87 35C84 22 74 15 62 17C49 18 42 27 40 39C26 39 17 47 17 58C17 68 24 75 34 75Z"
              fill="white"
              stroke="#48A5F5"
              strokeWidth="6"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* App name */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="text-blue-900">Weather</span>
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Wear
          </span>
        </h1>

        <p className="mt-4 text-base text-slate-600 sm:text-2xl">
          Dress for the weather. Feel your best.
        </p>

        {/* Weather and clothing icons */}
        <div className="mt-10 flex items-center justify-center gap-7 sm:gap-12">
          <span className="weather-icon sun-icon" aria-label="Sunny">
            ☀️
          </span>
          <span className="weather-icon rain-icon" aria-label="Rainy">
            🌧️
          </span>
          <span className="weather-icon shirt-icon" aria-label="Clothing">
            👕
          </span>
          <span className="weather-icon wind-icon" aria-label="Windy">
            🌬️
          </span>
        </div>

        {/* Functional loading indicator */}
        <div
          className="mt-16 w-full max-w-sm px-3"
          role="status"
          aria-live="polite"
          aria-label={`Loading WeatherWear: ${progress}%`}
        >
          <p className="mb-5 text-lg font-medium text-slate-500">
            {progress < 100 ? "Loading..." : "Ready!"}
          </p>

          <div
            className="h-4 w-full overflow-hidden rounded-full bg-indigo-100/90 shadow-inner"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        .cloud {
          position: absolute;
          width: 220px;
          height: 85px;
          border-radius: 100px 100px 25px 25px;
          background: rgba(255, 255, 255, 0.42);
          filter: blur(2px);
          animation: drift 12s ease-in-out infinite alternate;
        }

        .cloud::before,
        .cloud::after {
          content: "";
          position: absolute;
          bottom: 15px;
          border-radius: 50%;
          background: inherit;
        }

        .cloud::before {
          left: 35px;
          width: 100px;
          height: 100px;
        }

        .cloud::after {
          right: 25px;
          width: 75px;
          height: 75px;
        }

        .cloud-left {
          left: -95px;
          top: 23%;
        }

        .cloud-right {
          right: -105px;
          top: 55%;
          animation-delay: -5s;
        }

        .wave {
          position: absolute;
          bottom: -115px;
          width: 130%;
          height: 230px;
          border-radius: 50% 50% 0 0;
          pointer-events: none;
        }

        .wave-blue {
          left: -15%;
          background: rgba(147, 197, 253, 0.3);
          transform: rotate(-4deg);
        }

        .wave-purple {
          right: -40%;
          bottom: -145px;
          background: rgba(196, 181, 253, 0.28);
          transform: rotate(8deg);
        }

        .weather-icon {
          display: inline-block;
          font-size: 2rem;
          animation: float 2s ease-in-out infinite;
        }

        .rain-icon {
          animation-delay: 0.25s;
        }

        .shirt-icon {
          animation-delay: 0.5s;
        }

        .wind-icon {
          animation-delay: 0.75s;
        }

        .logo-icon {
          animation: appear 0.8s ease-out both;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes drift {
          from {
            transform: translateX(-10px);
          }
          to {
            transform: translateX(20px);
          }
        }

        @keyframes appear {
          from {
            opacity: 0;
            transform: scale(0.75);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-icon,
          .cloud,
          .logo-icon {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
