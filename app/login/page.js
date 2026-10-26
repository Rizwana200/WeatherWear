"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeNext(value) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

// After login the user lands on the intro screen ("/"), which then opens the
// app. Clearing "ww:seen" makes the intro play on every fresh login; "ww:next"
// remembers a protected page the user was trying to reach.
function prepareIntro(next) {
  try {
    window.sessionStorage.removeItem("ww:seen");
    if (next) window.sessionStorage.setItem("ww:next", next);
    else window.sessionStorage.removeItem("ww:next");
  } catch {
    /* storage blocked: the intro still works */
  }
}

function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "Google sign-in isn't turned on yet. Enable the Google provider in Supabase.";
  if (m.includes("fetch") || m.includes("network")) return "Can't reach the server. Check your connection.";
  return message || "Something went wrong. Please try again.";
}

function Logo({ className = "" }) {
  return (
    <svg viewBox="-10 -6 130 106" className={className} fill="none" aria-hidden="true">
      <g stroke="#FFE066" strokeWidth="6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M30 3V-4" transform={`rotate(${a} 30 37)`} />
        ))}
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
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: "🌤️", title: "Weather-smart outfits", text: "Looks picked for today's temperature and conditions." },
  { icon: "👗", title: "Your own wardrobe", text: "Upload your clothes once and mix them any way you like." },
  { icon: "🪞", title: "See it on you", text: "Preview the outfit on your own photo before you step out." },
];

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const supabase = createClient();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isSignin = mode === "signin";
  const anyBusy = busy || googleBusy;

  function switchMode(m) {
    setMode(m);
    setError("");
    setInfo("");
  }

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setError("");
    setInfo("");

    // Same as a password login: play the intro after we come back.
    prepareIntro(next);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/")}`,
        },
      });
      if (error) throw error;
      // The browser is now leaving for Google: keep the button busy.
    } catch (err) {
      setError(friendlyError(err.message));
      setGoogleBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");

    try {
      if (!isSignin) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/")}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          prepareIntro(next);
          window.location.href = "/";
          return; // keep the button busy while the page changes
        }
        setInfo("Almost there! Check your email and click the confirmation link to finish signing up.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        prepareIntro(next);
        window.location.href = "/";
        return;
      }
    } catch (err) {
      setError(friendlyError(err.message));
    }
    setBusy(false);
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-amber-200 px-4 py-10">
      {/* soft decorative glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-yellow-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[26rem] w-[26rem] rounded-full bg-white/50 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Brand panel (hidden on small screens) */}
        <section className="hidden text-white lg:block">
          <div className="flex items-center gap-3">
            <Logo className="h-14 w-16 drop-shadow-lg" />
            <span className="text-4xl font-extrabold tracking-tight drop-shadow">WeatherWear</span>
          </div>
          <p className="mt-4 max-w-md text-xl font-medium text-white/95 drop-shadow-sm">
            Dress for the weather. Feel your best.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-xl backdrop-blur">
                  {f.icon}
                </span>
                <div>
                  <p className="font-bold">{f.title}</p>
                  <p className="text-sm text-white/90">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <section className="mx-auto w-full max-w-md rounded-3xl bg-white/95 p-7 shadow-2xl shadow-sky-900/20 backdrop-blur sm:p-9">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo className="h-9 w-10" />
            <span className="text-xl font-extrabold tracking-tight text-slate-900">WeatherWear</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isSignin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSignin ? "Sign in to open your wardrobe." : "Start building outfits for every kind of weather."}
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={anyBusy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 text-[15px] font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleBusy ? <Spinner className="h-5 w-5" /> : <GoogleIcon />}
            {googleBusy ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or use email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Sign in / Sign up toggle */}
          <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold">
            {[
              ["signin", "Sign in"],
              ["signup", "Sign up"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={`rounded-lg py-2 transition ${
                  mode === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignin ? "Your password" : "At least 8 characters"}
                  autoComplete={isSignin ? "current-password" : "new-password"}
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 my-auto h-8 rounded-md px-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div aria-live="polite">
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p>}
            </div>

            <button
              disabled={anyBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy && <Spinner />}
              {busy ? (isSignin ? "Signing in…" : "Creating account…") : isSignin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Photos you add are processed by AI services to label clothes and create outfit previews.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}