
import { NextResponse } from "next/server";

const weatherCodeDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Snowfall",
  73: "Snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

const climateSearches = {
  Hot: [
    "summer lightweight breathable cotton clothes",
    "summer cotton dresses tops shorts skirts",
    "lightweight breathable summer shirts",
  ],
  Warm: [
    "lightweight breathable everyday clothing",
    "summer casual cotton outfits",
    "lightweight cotton shirts tops dresses",
  ],
  Mild: [
    "comfortable everyday casual clothing",
    "light jackets shirts trousers outfits",
    "versatile casual outfits",
  ],
  Cool: [
    "cardigans sweaters hoodies light jackets",
    "layered autumn winter casual clothing",
    "warm tops jackets trousers",
  ],
  Cold: [
    "winter sweaters woollen coats thermal wear",
    "thick winter jackets fleece hoodies cardigans",
    "winter clothing scarves shawls warm boots",
  ],
  Rainy: [
    "raincoats waterproof jackets rain boots",
    "water resistant monsoon clothing",
    "waterproof footwear rain jackets",
  ],
};

const genderSearches = {
  Women: [
    "women's women's fashion clothing",
    "women's winter summer casual outfits",
  ],
  Men: [
    "men's men's fashion clothing",
    "men's winter summer casual outfits",
  ],
  Everyone: [
    "women's clothing fashion",
    "men's clothing fashion",
  ],
};

const climateKeywords = {
  Hot: /\b(summer|cotton|lightweight|breathable|sleeveless|shorts|tank top|linen|light dress)\b/i,
  Warm: /\b(cotton|lightweight|breathable|casual|summer|linen|shorts|t-shirt|tee|top|dress|shirt)\b/i,
  Mild: /\b(casual|comfortable|shirt|trouser|jeans|dress|cardigan|light jacket|layer)\b/i,
  Cool: /\b(sweater|hoodie|cardigan|jacket|coat|pullover|fleece|layer|warm|long sleeve)\b/i,
  Cold: /\b(winter|sweater|hoodie|cardigan|jacket|coat|thermal|wool|woollen|woolen|fleece|puffer|insulated|parka|muffler|scarf|shawl|gloves|warm boots)\b/i,
  Rainy: /\b(raincoat|rain coat|waterproof|water-resistant|water resistant|rain jacket|rain boots|monsoon|poncho|quick-dry|quick dry)\b/i,
};

const winterKeywords =
  /\b(sweater|hoodie|cardigan|pullover|thermal|wool|woollen|woolen|fleece|puffer|parka|winter coat|heavy coat|muffler)\b/i;

const summerKeywords =
  /\b(bikini|swimwear|swimsuit|beachwear|sleeveless summer dress|summer shorts)\b/i;

const rainKeywords =
  /\b(raincoat|rain coat|waterproof|water-resistant|water resistant|rain boots|poncho)\b/i;

const nonClothingKeywords =
  /\b(car|cars|bike|bikes|motorcycle|scooter|vehicle|automobile|truck|bus|tractor|engine|tyre|tyres|tire|tires|mobile phone|smartphone|laptop|television|furniture|refrigerator|washing machine|phone case|charger|headphones|earbuds|jewellery|jewelry|necklace|earrings|makeup|cosmetics|lipstick|skincare|perfume|curtain|bedsheet|bedding|cushion|kitchenware|cookware|food|snacks|grocery)\b/i;

const clothingKeywords =
  /\b(shirt|shirts|t-shirt|t-shirts|tee|tees|top|tops|dress|dresses|kurti|kurtis|kurta|kurtas|jeans|trouser|trousers|pants|leggings|jacket|jackets|coat|coats|sweater|sweaters|hoodie|hoodies|raincoat|raincoats|clothing|apparel|garment|garments|outfit|outfits|shorts|skirt|skirts|saree|sarees|sari|blouse|cardigan|suit|thermal|nightwear|sleepwear|footwear|shoes|sandals|boots|slippers|tunic|tunics|sweatshirt|vest|pajamas|pyjamas|jumpsuit|romper|palazzo|chinos|socks|scarf|scarves|shawl|shawls|gloves|caps|hats|ethnic wear|innerwear|underwear|sportswear|activewear|poncho|windbreaker|anorak|frock|gown|lehenga|salwar|blazer|pullover|muffler|parka|fleece|puffer)\b/i;

function getText(product) {
  return [
    product.title,
    product.name,
    product.category_name,
    product.category,
    product.description,
    product.product_type,
  ]
    .map((value) => String(value || ""))
    .join(" ")
    .toLowerCase();
}

function getConditionCategory(condition, weatherCode) {
  const code =
    weatherCode !== null &&
    weatherCode !== undefined &&
    String(weatherCode).trim() !== ""
      ? Number(weatherCode)
      : null;

  const description =
    code !== null && weatherCodeDescriptions[code]
      ? weatherCodeDescriptions[code]
      : String(condition || "Clear sky").trim();

  const text = description.toLowerCase();

  if (text.includes("thunderstorm") || text.includes("hail")) {
    return { description, category: "storm" };
  }

  if (text.includes("snow")) {
    return { description, category: "snow" };
  }

  if (text.includes("rain") || text.includes("drizzle")) {
    return {
      description,
      category: text.includes("drizzle") ? "drizzle" : "rain",
    };
  }

  if (text.includes("fog")) {
    return { description, category: "fog" };
  }

  if (text.includes("cloud") || text.includes("overcast")) {
    return { description, category: "cloudy" };
  }

  return { description: description || "Unknown", category: "clear" };
}

function isClothingProduct(product) {
  const text = getText(product);

  if (nonClothingKeywords.test(text)) return false;

  return clothingKeywords.test(text);
}

function matchesGender(product, gender) {
  if (gender === "Everyone") return true;

  const declaredGender = String(
    product.gender || product.targetGender || ""
  ).toLowerCase();

  if (declaredGender) {
    const isMen = /^(men|male|boy|boys)$/.test(declaredGender);
    const isWomen = /^(women|woman|female|girl|girls)$/.test(
      declaredGender
    );

    if (gender === "Women" && isMen) return false;
    if (gender === "Men" && isWomen) return false;
  }

  const text = getText(product);

  const explicitlyMen =
    /\b(men's|mens|men|male|boys|boy's|menswear)\b/i.test(text);

  const explicitlyWomen =
    /\b(women's|womens|women|woman|ladies|lady|female|girls|girl's|womenswear)\b/i.test(
      text
    );

  if (gender === "Women" && explicitlyMen && !explicitlyWomen) {
    return false;
  }

  if (gender === "Men" && explicitlyWomen && !explicitlyMen) {
    return false;
  }

  return true;
}

function isWrongForClimate(product, climate, conditionCategory) {
  const text = getText(product);

  if (
    ["Hot", "Warm"].includes(climate) &&
    winterKeywords.test(text)
  ) {
    return true;
  }

  if (
    climate === "Cold" &&
    summerKeywords.test(text) &&
    !winterKeywords.test(text)
  ) {
    return true;
  }

  if (
    climate === "Rainy" &&
    /\b(suede shoes|suede boots|canvas shoes)\b/i.test(text)
  ) {
    return true;
  }

  if (
    ["storm", "snow", "rain", "drizzle"].includes(conditionCategory) &&
    climate !== "Cold" &&
    /\b(sandals|flip-flops|slippers)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

function getWeatherScore(product, climate) {
  const text = getText(product);
  const keywords = climateKeywords[climate];

  let score = 0;

  if (keywords?.test(text)) score += 5;

  if (climate === "Cold" && winterKeywords.test(text)) {
    score += 10;
  }

  if (climate === "Rainy" && rainKeywords.test(text)) {
    score += 10;
  }

  if (["Hot", "Warm"].includes(climate) && winterKeywords.test(text)) {
    score -= 20;
  }

  return score;
}

function extractProducts(result) {
  if (Array.isArray(result.products?.results)) {
    return result.products.results;
  }

  if (Array.isArray(result.data?.results)) {
    return result.data.results;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];
}

function formatProduct(product) {
  const url = product.url || product.product_url;
  const title = product.title || product.name;

  if (typeof url !== "string" || typeof title !== "string") {
    return null;
  }

  const images = Array.isArray(product.images) ? product.images : [];

  const imageCandidates = [
    product.image,
    product.image_url,
    ...images,
  ];

  const image = imageCandidates.find(
    (candidate) =>
      typeof candidate === "string" &&
      /^https?:\/\//i.test(candidate.trim())
  );

  if (!image || !/^https?:\/\//i.test(url)) return null;

  return {
    id: String(product.product_id || product.catalog_id || url),
    title: title.trim(),
    image: image.trim(),
    price: product.price ?? null,
    currency: product.currency || "INR",
    rating: product.rating ?? null,
    ratingCount: product.rating_count ?? product.ratingCount ?? 0,
    category:
      product.category_name ||
      product.category ||
      product.product_type ||
      "Clothing",
    url,
  };
}

function buildQueries({ climate, gender, conditionCategory }) {
  const genderPrefix = gender === "Everyone" ? "" : `${gender} `;

  const queries = [
    `${genderPrefix}${climateSearches[climate][0]}`,
    `${genderPrefix}${climateSearches[climate][1]}`,
  ];

  if (conditionCategory === "rain" || conditionCategory === "drizzle") {
    queries.push(`${genderPrefix}raincoat waterproof rain jacket footwear`);
  }

  if (conditionCategory === "snow") {
    queries.push(`${genderPrefix}winter coat thermal wool sweater boots`);
  }

  if (climate === "Cold") {
    queries.push(`${genderPrefix}winter sweater thermal jacket wool coat`);
  }

  return [...new Set(queries.map((query) => query.trim()))].slice(0, 4);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedClimate = searchParams.get("climate") || "Warm";
    const gender = searchParams.get("gender") || "Women";
    const condition = searchParams.get("condition") || "";
    const weatherCode = searchParams.get("weatherCode");

    const validClimates = [
      "Hot",
      "Warm",
      "Mild",
      "Cool",
      "Cold",
      "Rainy",
    ];

    const validGenders = ["Women", "Men", "Everyone"];

    if (!validClimates.includes(requestedClimate)) {
      return NextResponse.json(
        { error: "Invalid climate selection.", products: [] },
        { status: 400 }
      );
    }

    if (!validGenders.includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender selection.", products: [] },
        { status: 400 }
      );
    }

    const apiKey = process.env.REEF_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "REEF_API_KEY is missing. Add it to .env.local.",
          products: [],
        },
        { status: 500 }
      );
    }

    const weather = getConditionCategory(condition, weatherCode);

    // Keep Cold when the temperature-based climate is Cold.
    // Rain/snow conditions should not accidentally turn winter into summer.
    const climate = requestedClimate;

    const queries = buildQueries({
      climate,
      gender,
      conditionCategory: weather.category,
    });

    const results = await Promise.allSettled(
      queries.map(async (query) => {
        const response = await fetch(
          "https://api.reefapi.com/meesho/v1/search",
          {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 20,
            }),
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || !result || result.ok === false) {
          throw new Error(
            result?.error ||
              result?.message ||
              `ReefAPI request failed with HTTP ${response.status}`
          );
        }

        return extractProducts(result);
      })
    );

    const successfulResults = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const failedResults = results.filter(
      (result) => result.status === "rejected"
    );

    if (successfulResults.length === 0) {
      const failureMessage = failedResults[0]?.reason?.message;

      console.error("ReefAPI searches failed:", failureMessage);

      return NextResponse.json(
        {
          error: failureMessage || "ReefAPI returned no products.",
          query: queries,
          climate,
          gender,
          products: [],
          searchesFailed: failedResults.length,
        },
        { status: 502 }
      );
    }

    const uniqueProducts = new Map();

    for (const rawProduct of successfulResults) {
      if (!isClothingProduct(rawProduct)) continue;
      if (!matchesGender(rawProduct, gender)) continue;

      if (isWrongForClimate(rawProduct, climate, weather.category)) {
        continue;
      }

      const product = formatProduct(rawProduct);

      if (!product) continue;

      const existing = uniqueProducts.get(product.url);

      if (!existing) {
        uniqueProducts.set(product.url, {
          ...product,
          weatherScore: getWeatherScore(rawProduct, climate),
        });
      }
    }

    const products = [...uniqueProducts.values()]
      .sort((a, b) => b.weatherScore - a.weatherScore)
      .slice(0, 40)
      .map(({ weatherScore, ...product }) => product);

    return NextResponse.json({
      query: queries,
      climate,
      gender,
      condition: weather.description,
      weatherCategory: weather.category,
      products,
      source: "reef",
      searchesCompleted: results.filter(
        (result) => result.status === "fulfilled"
      ).length,
      searchesFailed: failedResults.length,
      notice:
        products.length === 0
          ? "No products matched the clothing, gender and weather filters. Try another selection."
          : null,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not fetch products from ReefAPI.",
        products: [],
      },
      { status: 500 }
    );
  }
}
