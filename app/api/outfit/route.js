
export async function POST(request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "DeepSeek API key is missing. Check your .env.local file." },
        { status: 503 }
      );
    }

    const body = await request.json();

    const {
      city,
      timezone,
      currentTime,
      temperature,
      condition,
      rainChance,
      question,
      forecast,
      historicalWeather,
    } = body;

    if (typeof question !== "string" || !question.trim()) {
      return Response.json(
        { error: "Please provide a question." },
        { status: 400 }
      );
    }

    function asNumber(value) {
      return typeof value === "number" && Number.isFinite(value)
        ? value
        : null;
    }

    function normalizeForecastDay(day) {
      return {
        date: String(day?.date ?? day?.time ?? ""),
        weekday: String(day?.weekday ?? ""),
        maxTemperature: asNumber(
          day?.maxTemperature ?? day?.high ?? day?.temperatureMax
        ),
        minTemperature: asNumber(
          day?.minTemperature ?? day?.low ?? day?.temperatureMin
        ),
        condition: String(day?.condition ?? "Unknown"),
        rainProbability: asNumber(
          day?.rainProbability ?? day?.rainChance ?? day?.precipitationProbability
        ),
      };
    }

    // Support comparison data sent directly by the frontend.
    let suppliedLocations =
      body.comparisonLocations ??
      body.locations ??
      (Array.isArray(forecast) &&
      forecast.some(
        (item) =>
          item &&
          typeof item === "object" &&
          (typeof item.location === "string" ||
            typeof item.city === "string") &&
          item.current &&
          Array.isArray(item.forecast)
      )
        ? forecast
        : null);

    // Backward compatibility: the existing Compare page embeds its
    // cityContexts JSON inside the question string.
    let actualQuestion = question.trim();

    if (!Array.isArray(suppliedLocations)) {
      const marker =
        "The user selected these locations for comparison:";

      const markerIndex = actualQuestion.indexOf(marker);

      if (markerIndex !== -1) {
        const jsonStart = actualQuestion.indexOf("[", markerIndex);
        const userQuestionMarker = "\n\nUser question:";
        const userQuestionIndex = actualQuestion.indexOf(
          userQuestionMarker,
          jsonStart
        );

        if (jsonStart !== -1 && userQuestionIndex !== -1) {
          try {
            const embeddedJson = actualQuestion
              .slice(jsonStart, userQuestionIndex)
              .trim();

            const parsed = JSON.parse(embeddedJson);

            if (Array.isArray(parsed)) {
              suppliedLocations = parsed;
              actualQuestion = actualQuestion
                .slice(userQuestionIndex + userQuestionMarker.length)
                .split("\n\nInstructions:")[0]
                .trim();
            }
          } catch (error) {
            console.warn(
              "Could not parse embedded comparison data:",
              error instanceof Error ? error.message : "Invalid JSON"
            );
          }
        }
      }
    }

    const isComparison =
      Array.isArray(suppliedLocations) &&
      suppliedLocations.some(
        (place) =>
          place &&
          typeof place === "object" &&
          (typeof place.location === "string" ||
            typeof place.city === "string") &&
          place.current &&
          typeof place.current === "object" &&
          Array.isArray(place.forecast)
      );

    const comparisonLocations = isComparison
      ? suppliedLocations
          .filter(
            (place) =>
              place &&
              typeof place === "object" &&
              (typeof place.location === "string" ||
                typeof place.city === "string") &&
              place.current &&
              typeof place.current === "object" &&
              Array.isArray(place.forecast)
          )
          .slice(0, 5)
          .map((place) => {
            const current = place.current;

            return {
              location: String(
                place.location ?? place.city ?? "Unknown location"
              ).slice(0, 150),

              timezone: String(place.timezone ?? "Unknown").slice(0, 100),

              current: {
                temperature: asNumber(
                  current.temperature ?? current.temperature_2m
                ),
                feelsLike: asNumber(
                  current.feelsLike ?? current.apparent_temperature
                ),
                humidity: asNumber(
                  current.humidity ?? current.relative_humidity_2m
                ),
                windSpeed: asNumber(
                  current.windSpeed ?? current.wind_speed_10m
                ),
                precipitation: asNumber(
                  current.precipitation ?? current.precipitation_mm
                ),
                condition: String(
                  current.condition ?? place.condition ?? "Unknown"
                ).slice(0, 100),
                time: String(current.time ?? current.currentTime ?? ""),
              },

              forecast: place.forecast
                .slice(0, 16)
                .map(normalizeForecastDay),
            };
          })
      : [];

    if (isComparison && comparisonLocations.length < 2) {
      return Response.json(
        {
          error:
            "Please select at least two locations with valid weather data.",
        },
        { status: 400 }
      );
    }

    if (
      !isComparison &&
      (typeof temperature !== "number" ||
        !Number.isFinite(temperature) ||
        typeof rainChance !== "number" ||
        !Number.isFinite(rainChance) ||
        typeof condition !== "string")
    ) {
      return Response.json(
        { error: "Please provide valid weather details and a question." },
        { status: 400 }
      );
    }

    const dailyForecast =
      !isComparison && Array.isArray(forecast)
        ? forecast.slice(0, 16).map(normalizeForecastDay)
        : [];

    // Keep historical observations separate from forecasts.
    let historicalRecord = null;

    if (
      historicalWeather &&
      typeof historicalWeather === "object" &&
      !Array.isArray(historicalWeather)
    ) {
      const allowedTypes = [
        "station_observation",
        "historical_reanalysis",
      ];

      if (allowedTypes.includes(historicalWeather.dataType)) {
        historicalRecord = {
          source: String(historicalWeather.source ?? "Unknown").slice(0, 150),
          dataType: historicalWeather.dataType,
          date: String(historicalWeather.date ?? ""),
          timezone: String(
            historicalWeather.timezone ?? timezone ?? "Unknown"
          ),
          temperatureMax: asNumber(historicalWeather.temperatureMax),
          temperatureMin: asNumber(historicalWeather.temperatureMin),
          precipitationMm: asNumber(historicalWeather.precipitationMm),
          weatherCode: asNumber(historicalWeather.weatherCode),
          verifiedStationObservation:
            historicalWeather.dataType === "station_observation" &&
            historicalWeather.verifiedStationObservation === true,
          note: String(historicalWeather.note ?? "").slice(0, 500),
        };
      }
    }

    const weatherContext = isComparison
      ? {
          mode: "multi_location_comparison",
          locations: comparisonLocations,
        }
      : {
          mode: "single_location",
          city: String(city || "Unknown").slice(0, 150),
          timezone: String(timezone || "Unknown").slice(0, 100),
          currentLocalDateTime: String(currentTime || "Unknown"),
          currentConditions: {
            temperatureCelsius: temperature,
            condition: condition.slice(0, 100),
            rainProbability: rainChance,
          },
          futureForecast: dailyForecast,
          historicalWeather: historicalRecord,
        };

    const systemPrompt = `
You are WeatherWear's personal weather comparison and outfit assistant.

Answer the user's actual question using ONLY the supplied weather data.
Never invent temperatures, weather conditions, forecast dates, or probabilities.
A missing value is unknown, not zero. Clearly identify unavailable information.
Be friendly, practical, and concise.

MULTI-LOCATION COMPARISON

When mode is "multi_location_comparison":

1. Compare EVERY location in the locations array when relevant to the question.
2. Each location has its own current conditions, timezone, and forecast.
   Never mix data between locations.
3. For current weather, use that location's current object.
4. For future weather, use that location's forecast and match the requested
   date to the explicit date field. Never assume matching array positions
   represent the same date.
5. When comparing temperatures, rain, wind, or humidity, mention the
   actual values and units when available.
6. Do not claim a location is missing when its data is present.
7. Do not invent a forecast for a date absent from a location's forecast.
8. If only some locations have data for the requested date, explain which
   locations have data and which do not.
9. For outfit comparisons, give practical advice for EACH relevant location.
10. Recommend layers for cooler conditions, breathable clothes for warmer
    conditions, and rain protection when the supplied data supports it.
11. Never imply that a missing rain probability means no rain.
12. Do not make unsupported claims about comfort, weather, or safety.

SINGLE-LOCATION QUESTIONS

Use currentConditions for current weather and futureForecast for future dates.
Match the requested date explicitly. Do not treat a daily high as the current
temperature. Do not use a forecast as proof of past weather.

HISTORICAL QUESTIONS

Use historicalWeather only for its supplied date.
Distinguish station observations from historical reanalysis.
Never invent historical measurements or present a forecast as an observation.

OUTFIT ADVICE

Give clear, useful clothing and footwear recommendations based on the relevant
weather data. For rain-related questions, answer the umbrella question first.
If the data is insufficient, state what is missing.

DATE HANDLING

Use explicit forecast dates and the supplied timezone.
Do not invent today's date or assume forecasts cover dates not supplied.

FORMAT

For comparisons, use short headings or a compact bullet list for each location
when helpful, followed by a direct comparison or recommendation.
Avoid repeating the entire forecast when only a brief answer is needed.
`.trim();

    const userMessage = `
Weather data (JSON):
${JSON.stringify(weatherContext, null, 2)}

User question:
${actualQuestion.slice(0, 1500)}

${
  isComparison
    ? "Compare all relevant selected locations. Use their individual weather data and matching forecast dates."
    : "Answer for the requested location and date using the supplied weather data."
}
`.trim();

    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 1200,
          temperature: 0.2,
        }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();

      console.error(
        "DeepSeek API error:",
        response.status,
        errorDetails.slice(0, 500)
      );

      return Response.json(
        {
          error:
            response.status === 401
              ? "DeepSeek rejected the API key. Check DEEPSEEK_API_KEY."
              : response.status === 429
                ? "DeepSeek rate limit reached. Please try again later."
                : "DeepSeek could not answer right now. Please try again.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return Response.json(
        { error: "The AI did not return an answer. Please try again." },
        { status: 502 }
      );
    }

    return Response.json({ answer });
  } catch (error) {
    console.error("Outfit assistant error:", error);

    return Response.json(
      { error: "Unable to process your request right now." },
      { status: 500 }
    );
  }
}
