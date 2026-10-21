
export async function POST(request) {
  try {
    const body = await request.json();
    const { latitude, longitude, timezone = "auto" } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Response.json(
        { error: "Please provide valid latitude and longitude." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily:
        "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
      forecast_days: "46",
      timezone:
        typeof timezone === "string" ? timezone : "auto",
    });

    const apiUrl =
      `https://seasonal-api.open-meteo.com/v1/seasonal?${params}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return Response.json(
        { error: "The long-range weather service is unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return Response.json({
      source: "Open-Meteo Seasonal Forecast",
      forecast: data,
      note:
        "Long-range forecasts are uncertain. Treat later dates as outlooks, not exact predictions.",
    });
  } catch (error) {
    console.error("Long-range forecast error:", error);

    return Response.json(
      { error: "Could not retrieve long-range weather data." },
      { status: 500 }
    );
  }
}
