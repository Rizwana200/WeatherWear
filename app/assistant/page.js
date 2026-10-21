
"use client";

import { useState } from "react";
import Link from "next/link";

function getCondition(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Mainly clear or partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Rain";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Variable conditions";
}

function getCity(question) {
  const match = question.match(
    /\b(?:in|for|at)\s+([a-zA-Z][a-zA-Z .'-]*?)(?=\s+(?:today|tomorrow|tonight|next|this|in \d|on \d)|[?!,.]|$)/i
  );

  return match?.[1]?.trim() || "Hyderabad";
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendQuestion(event) {
    event.preventDefault();

    const text = question.trim();
    if (!text || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: text },
    ]);
    setQuestion("");
    setLoading(true);

    try {
      const city = getCity(text);

      // Find the requested city.
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Could not search for the city.");
      }

      const geoData = await geoResponse.json();
      const place = geoData.results?.[0];

      if (!place) {
        throw new Error(
          `I couldn't find "${city}". Please check the spelling or include a nearby city.`
        );
      }

      const { latitude, longitude, name, country, timezone } = place;

      const asksForLongRange =
        /\b(next month|next \d+ days|next few weeks|30 days|month ahead|long.range|next year|next season|in \d+ months|in \d+ years)\b/i.test(
          text
        );

      const asksAboutNextYear =
        /\b(next year|in \d+ years|next season)\b/i.test(text);

      // Always retrieve the regular forecast first.
      const weatherParams = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily:
          "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code",
        forecast_days: "7",
        timezone: timezone || "auto",
      });

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?${weatherParams}`
      );

      if (!weatherResponse.ok) {
        throw new Error("Could not retrieve the weather forecast.");
      }

      const weather = await weatherResponse.json();
      const current = weather.current;

      let weatherContext = `
Location: ${name}, ${country}
Timezone: ${timezone || "local"}
Current temperature: ${current.temperature_2m}°C
Feels like: ${current.apparent_temperature}°C
Current conditions: ${getCondition(current.weather_code)}
Relative humidity: ${current.relative_humidity_2m}%
Wind speed: ${current.wind_speed_10m} km/h

Available daily forecast:
${weather.daily.time
  .map(
    (date, index) =>
      `${date}: ${getCondition(weather.daily.weather_code[index])}, ` +
      `high ${weather.daily.temperature_2m_max[index]}°C, ` +
      `low ${weather.daily.temperature_2m_min[index]}°C, ` +
      `precipitation chance ${weather.daily.precipitation_probability_max[index] ?? "unavailable"}%`
  )
  .join("\n")}
`;

      if (asksForLongRange && !asksAboutNextYear) {
        const longResponse = await fetch("/api/long-range", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude,
            longitude,
            timezone: timezone || "auto",
          }),
        });

        const longData = await longResponse.json();

        if (longResponse.ok && longData.forecast?.daily) {
          const daily = longData.forecast.daily;

          weatherContext += `

LONG-RANGE OUTLOOK DATA FROM OPEN-METEO:
${(daily.time || [])
  .slice(0, 35)
  .map(
    (date, index) =>
      `${date}: average temperature ${daily.temperature_2m_mean?.[index] ?? "unavailable"}°C, ` +
      `high ${daily.temperature_2m_max?.[index] ?? "unavailable"}°C, ` +
      `low ${daily.temperature_2m_min?.[index] ?? "unavailable"}°C, ` +
      `precipitation ${daily.precipitation_sum?.[index] ?? "unavailable"} mm, ` +
      `weather ${daily.weather_code?.[index] == null ? "unavailable" : getCondition(daily.weather_code[index])}`
  )
  .join("\n")}

Important: This is long-range model output. Explain its uncertainty and do not present it as a guaranteed prediction.`;
        } else {
          weatherContext +=
            "\nThe long-range weather service did not return usable data. Do not invent a monthly forecast.";
        }
      }

      if (asksAboutNextYear) {
        weatherContext += `

IMPORTANT FOR THIS QUESTION:
The supplied daily forecast covers only the next several days.
Do not pretend that it predicts weather next year.
Explain that reliable day-by-day forecasts are not available this far ahead.
Discuss typical seasonal conditions only as general climate guidance, and clearly label them as typical patterns rather than a forecast.`;
      }

      const response = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: `${name}, ${country}`,
          temperature: current.temperature_2m,
          condition: getCondition(current.weather_code),
          rainChance:
            weather.daily.precipitation_probability_max?.[0] ?? 0,
          question: `${text}

Use the following retrieved weather information to answer. Do not invent measurements.

${weatherContext}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The AI service returned an error.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer || "I couldn't generate an answer.",
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error.message ||
            "Connection failed. Please check your internet connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "What should I wear today in Hyderabad?",
    "Will it rain tomorrow in Manopadu?",
    "Suggest outfits for the next month in Hyderabad",
    "What is the usual weather in Manopadu next year?",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 px-4 py-6 text-slate-800 sm:px-8">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="text-xl font-black">
          <span className="text-sky-600">Weather</span>Wear
        </Link>

        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition hover:bg-sky-50"
        >
          ← Dashboard
        </Link>
      </header>

      <section className="mx-auto mt-10 flex max-w-3xl flex-col">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-4xl shadow-sm">
            🤖
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            Your AI Weather Assistant
          </h1>
          <p className="mt-3 text-slate-500">
            Ask about weather, outfits, rain, travel, and future planning.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuestion(suggestion)}
              className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-8 min-h-72 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {messages.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-4xl">🌤️</p>
              <p className="mt-3 font-medium">
                Your conversation starts here.
              </p>
              <p className="mt-1 text-sm">
                Try asking about a city and a date.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[95%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 sm:max-w-[90%] ${
                message.role === "user"
                  ? "ml-auto bg-sky-500 text-white"
                  : "border border-slate-100 bg-slate-50 text-slate-700"
              }`}
            >
              {message.content}
            </div>
          ))}

          {loading && (
            <p className="animate-pulse text-sm text-sky-600">
              Checking weather and preparing your answer...
            </p>
          )}
        </div>

        <form onSubmit={sendQuestion} className="mt-4 flex gap-3">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about a city, date, or outfit..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-2xl bg-sky-500 px-6 font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-500">
          Long-range outlooks are uncertain. AI recommendations are not
          guaranteed weather predictions.
        </p>
      </section>
    </main>
  );
}
