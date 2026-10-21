
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));
    const date = searchParams.get("date");

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return Response.json(
        { error: "Please provide valid coordinates and a date (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // Request historical reanalysis data, not a future forecast.
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date: date,
      end_date: date,
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
      timezone: "auto",
    });

    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?${params}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.error("Historical weather API status:", response.status);

      return Response.json(
        { error: "Historical weather data is temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.daily?.time?.length) {
      return Response.json(
        { error: "No historical weather data was returned for this date." },
        { status: 404 }
      );
    }

    return Response.json({
      source: "Open-Meteo Historical Weather API",
      dataType: "historical_reanalysis",
      verifiedStationObservation: false,
      timezone: data.timezone,
      date: data.daily.time[0],
      temperatureMax: data.daily.temperature_2m_max?.[0] ?? null,
      temperatureMin: data.daily.temperature_2m_min?.[0] ?? null,
      precipitationMm: data.daily.precipitation_sum?.[0] ?? null,
      weatherCode: data.daily.weather_code?.[0] ?? null,
      note:
        "Historical reanalysis combines observations and model estimates. These values are not verified measurements from a specific weather station.",
    });
  } catch (error) {
    console.error("Historical weather route error:", error);

    return Response.json(
      { error: "Unable to retrieve historical weather right now." },
      { status: 500 }
    );
  }
}
