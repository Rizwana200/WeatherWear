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

// Used when no category is selected ("All").
const climateSearches = {
  Hot: [
    "summer lightweight breathable cotton clothes",
    "summer cotton tops shirts shorts",
    "lightweight breathable summer wear",
  ],
  Warm: [
    "lightweight breathable everyday clothing",
    "summer casual cotton outfits",
    "lightweight cotton shirts tops",
  ],
  Mild: [
    "comfortable everyday casual clothing",
    "light jackets shirts trousers",
    "versatile casual outfits",
  ],
  Cool: [
    "cardigans sweaters hoodies light jackets",
    "layered casual clothing full sleeve",
    "warm tops jackets trousers",
  ],
  Cold: [
    "winter sweaters woollen coats thermal wear",
    "thick winter jackets fleece hoodies",
    "winter clothing warm boots",
  ],
  Rainy: [
    "raincoats waterproof jackets",
    "water resistant monsoon clothing",
    "waterproof footwear rain jackets",
  ],
};

// Search words for each category chip on the store page.
const categoryTerms = {
  "Tops & Tunics": "tops tunics blouses",
  Shirts: "shirts",
  "Kurtis & Kurtas": "kurtis kurtas",
  Dresses: "dresses gowns frocks",
  Sarees: "sarees cotton sarees",
  "Ethnic Wear": "ethnic wear salwar suits lehengas",
  "Jeans & Trousers": "jeans trousers pants",
  Skirts: "skirts",
  "Jackets & Coats": "jackets coats",
  "Sweaters & Hoodies": "sweaters hoodies cardigans",
  Footwear: "shoes sandals sneakers boots",
  Accessories: "bags caps scarves shawls belts",
};

const climateAdjectives = {
  Hot: "summer lightweight",
  Warm: "lightweight cotton",
  Mild: "casual comfortable",
  Cool: "light warm",
  Cold: "winter warm",
  Rainy: "waterproof rain",
};

const climateKeywords = {
  Hot: /\b(summer|cotton|lightweight|breathable|sleeveless|shorts|tank top|linen|light dress)\b/i,
  Warm: /\b(cotton|lightweight|breathable|casual|summer|linen|shorts|t-shirt|tee|top|dress|shirt)\b/i,
  Mild: /\b(casual|comfortable|shirt|trouser|jeans|dress|cardigan|light jacket|layer)\b/i,
  Cool: /\b(sweater|hoodie|cardigan|jacket|coat|pullover|fleece|layer|warm|long sleeve|full sleeve)\b/i,
  Cold: /\b(winter|sweater|hoodie|cardigan|jacket|coat|thermal|wool|woollen|woolen|fleece|puffer|insulated|parka|muffler|scarf|shawl|gloves|warm boots)\b/i,
  Rainy: /\b(raincoat|rain coat|waterproof|water-resistant|water resistant|rain jacket|rain boots|monsoon|poncho|quick-dry|quick dry|umbrella)\b/i,
};

const winterKeywords =
  /\b(sweater|hoodie|cardigan|pullover|thermal|wool|woollen|woolen|fleece|puffer|parka|winter coat|heavy coat|muffler)\b/i;

const heavyWinterKeywords =
  /\b(puffer|parka|thermal|woollen|woolen|heavy coat|winter coat|fleece|insulated)\b/i;

const summerKeywords =
  /\b(bikini|swimwear|swimsuit|beachwear|sleeveless|tank top|crop top|shorts|sundress|sun dress)\b/i;

const rainKeywords =
  /\b(raincoat|rain coat|waterproof|water-resistant|water resistant|rain boots|poncho|umbrella)\b/i;

const nonClothingKeywords =
  /\b(car|cars|bike|bikes|motorcycle|scooter|vehicle|automobile|truck|bus|tractor|engine|tyre|tyres|tire|tires|mobile phone|smartphone|laptop|television|furniture|refrigerator|washing machine|phone case|charger|headphones|earbuds|jewellery|jewelry|necklace|earrings|makeup|cosmetics|lipstick|skincare|perfume|curtain|bedsheet|bedding|cushion|kitchenware|cookware|food|snacks|grocery)\b/i;

const clothingKeywords =
  /\b(shirt|shirts|t-shirt|t-shirts|tee|tees|top|tops|dress|dresses|kurti|kurtis|kurta|kurtas|jeans|trouser|trousers|pants|leggings|jacket|jackets|coat|coats|sweater|sweaters|hoodie|hoodies|raincoat|raincoats|clothing|apparel|garment|garments|outfit|outfits|shorts|skirt|skirts|saree|sarees|sari|blouse|cardigan|suit|thermal|nightwear|sleepwear|footwear|shoes|sandals|boots|slippers|sneakers|tunic|tunics|sweatshirt|vest|pajamas|pyjamas|jumpsuit|romper|palazzo|chinos|socks|scarf|scarves|shawl|shawls|gloves|caps|hats|ethnic wear|innerwear|underwear|sportswear|activewear|poncho|windbreaker|anorak|frock|gown|lehenga|salwar|blazer|pullover|muffler|parka|fleece|puffer)\b/i;

// Only allowed through when the shopper opens the Accessories category
// (or searches for something by name).
const accessoryKeywords =
  /\b(bag|bags|backpack|backpacks|handbag|handbags|belt|belts|cap|caps|hat|hats|scarf|scarves|shawl|shawls|muffler|gloves|socks|umbrella|umbrellas|sunglasses|wallet|wallets|stole|stoles|dupatta|dupattas)\b/i;

// Meesho names footwear in many ways, so accept all of them.
const footwearKeywords =
  /\b(shoe|shoes|sandal|sandals|sneaker|sneakers|slipper|slippers|footwear|boot|boots|loafer|loafers|chappal|chappals|flip flop|flip flops|flipflop|flipflops|floater|floaters|mojari|mojaris|jutti|juttis|clog|clogs|slides|sliders|crocs|moccasin|moccasins|oxford|derby|espadrille|espadrilles|heels|wedges|flats|ballerina|ballerinas|bellies)\b/;

// Footwear search words per climate (better than "shoes winter warm").
const footwearByClimate = {
  Hot: ["sandals", "slippers", "sneakers"],
  Warm: ["sandals", "casual shoes", "sneakers"],
  Mild: ["casual shoes", "sneakers", "loafers"],
  Cool: ["sneakers", "casual shoes", "boots"],
  Cold: ["boots", "shoes", "sneakers"],
  Rainy: ["rain boots", "waterproof shoes", "sports shoes"],
};

// Items sold for women only: hidden when "Men" is selected.
const womenOnlyItems =
  /\b(dress|dresses|gown|gowns|frock|frocks|saree|sarees|sari|saris|kurti|kurtis|lehenga|lehengas|salwar|anarkali|churidar|blouse|blouses|skirt|skirts|leggings|palazzo|jumpsuit|romper|dupatta|tunic|tunics|crop top|bra|bras|heels|bangles|maternity)\b/i;

const categoryRules = {
  "Tops & Tunics":
    /\b(top|tops|tunic|tunics|blouse|blouses|tee|tees|t-shirt|t-shirts)\b/,
  Shirts: /\b(shirt|shirts)\b/,
  "Kurtis & Kurtas": /\b(kurti|kurtis|kurta|kurtas)\b/,
  Dresses: /\b(dress|dresses|gown|gowns|frock|frocks|maxi)\b/,
  Sarees: /\b(saree|sarees|sari|saris)\b/,
  "Ethnic Wear": /\b(ethnic|salwar|lehenga|anarkali|churidar|suit set)\b/,
  "Jeans & Trousers": /\b(jeans|trouser|trousers|pants|leggings|joggers)\b/,
  Skirts: /\b(skirt|skirts)\b/,
  "Jackets & Coats":
    /\b(jacket|jackets|coat|coats|raincoat|raincoats|blazer|blazers|windcheater)\b/,
  "Sweaters & Hoodies":
    /\b(sweater|sweaters|hoodie|hoodies|cardigan|cardigans|pullover|sweatshirt|sweatshirts)\b/,
  Footwear: footwearKeywords,
  Accessories:
    /\b(bag|bags|scarf|scarves|shawl|shawls|belt|belts|cap|caps|hat|hats|accessory|accessories|muffler|gloves|socks|umbrella|stole)\b/,
};

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
  if (text.includes("snow")) return { description, category: "snow" };
  if (text.includes("rain") || text.includes("drizzle")) {
    return {
      description,
      category: text.includes("drizzle") ? "drizzle" : "rain",
    };
  }
  if (text.includes("fog")) return { description, category: "fog" };
  if (text.includes("cloud") || text.includes("overcast")) {
    return { description, category: "cloudy" };
  }
  return { description: description || "Unknown", category: "clear" };
}

// When the shopper typed a search, footwear and accessories count as outfits
// too (they asked for them by name). Non-clothing items are still removed.
function isClothingProduct(product, category, searching = false) {
  const text = getText(product);

  if (nonClothingKeywords.test(text)) return false;
  if (clothingKeywords.test(text)) return true;

  if (
    (category === "Footwear" || searching) &&
    footwearKeywords.test(text)
  ) {
    return true;
  }

  return (
    (category === "Accessories" || searching) && accessoryKeywords.test(text)
  );
}

function matchesCategory(product, category) {
  if (!category || category === "All") return true;
  const rule = categoryRules[category];
  return rule ? rule.test(getText(product)) : true;
}

function matchesGender(product, gender) {
  if (gender === "Everyone") return true;

  const declaredGender = String(
    product.gender || product.targetGender || ""
  ).toLowerCase();

  if (declaredGender) {
    const isMen = /^(men|male|boy|boys)$/.test(declaredGender);
    const isWomen = /^(women|woman|female|girl|girls)$/.test(declaredGender);

    if (gender === "Women" && isMen) return false;
    if (gender === "Men" && isWomen) return false;
  }

  const text = getText(product);

  const explicitlyMen = /\b(men's|mens|men|male|boys|boy's|menswear)\b/i.test(
    text
  );
  const explicitlyWomen =
    /\b(women's|womens|women|woman|ladies|lady|female|girls|girl's|womenswear)\b/i.test(
      text
    );

  if (gender === "Women" && explicitlyMen && !explicitlyWomen) return false;
  if (gender === "Men" && explicitlyWomen && !explicitlyMen) return false;

  // Many listings have no gender word at all. For men, drop items that are
  // sold for women (dresses, sarees, kurtis, skirts, ...).
  if (gender === "Men" && !explicitlyMen && womenOnlyItems.test(text)) {
    return false;
  }

  return true;
}

function isWrongForClimate(product, climate, conditionCategory) {
  const text = getText(product);

  if (["Hot", "Warm"].includes(climate) && winterKeywords.test(text)) {
    return true;
  }

  if (climate === "Mild" && heavyWinterKeywords.test(text)) return true;

  if (
    climate === "Cold" &&
    /\b(sandal|sandals|flip flop|flip flops|flipflop|flipflops|slipper|slippers|chappal|chappals|floater|floaters|slides|sliders)\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (climate === "Hot" && /\b(boot|boots)\b/i.test(text)) return true;

  if (
    ["Cool", "Cold"].includes(climate) &&
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
  let score = 0;

  if (climateKeywords[climate]?.test(text)) score += 5;
  if (climate === "Cold" && winterKeywords.test(text)) score += 10;
  if (climate === "Rainy" && rainKeywords.test(text)) score += 10;
  if (["Hot", "Warm"].includes(climate) && winterKeywords.test(text)) {
    score -= 20;
  }

  return score;
}

function extractProducts(result) {
  if (Array.isArray(result.products?.results)) return result.products.results;
  if (Array.isArray(result.data?.results)) return result.data.results;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.results)) return result.results;
  return [];
}

function formatProduct(product) {
  const url = product.url || product.product_url;
  const title = product.title || product.name;

  if (typeof url !== "string" || typeof title !== "string") return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const imageCandidates = [product.image, product.image_url, ...images];

  const image = imageCandidates.find(
    (candidate) =>
      typeof candidate === "string" && /^https?:\/\//i.test(candidate.trim())
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

// Whatever the shopper typed goes straight to Meesho, once as typed and once
// with a weather word added so the best weather matches float to the top.
function buildSearchQueries({ climate, gender, search }) {
  const prefix = `${gender} `;
  const adjective = climateAdjectives[climate];

  return [
    ...new Set(
      [`${prefix}${search}`, `${prefix}${search} ${adjective}`].map((query) =>
        query.trim()
      )
    ),
  ];
}

// One gender at a time ("Women" or "Men"), so every query is clearly gendered.
function buildQueries({ climate, gender, category, conditionCategory }) {
  const prefix = `${gender} `;
  const terms = categoryTerms[category];

  let queries;

  if (category === "Footwear") {
    queries = [
      ...footwearByClimate[climate].map((item) => `${prefix}${item}`),
      `${prefix}footwear`,
    ];
  } else if (terms) {
    const firstTerm = terms.split(" ")[0];
    const adjective = climateAdjectives[climate];

    queries = [
      `${prefix}${firstTerm} ${adjective}`,
      `${prefix}${terms}`,
      `${prefix}${firstTerm}`,
    ];

    if (climate === "Rainy") {
      queries.push(`${prefix}${firstTerm} waterproof`);
    }
  } else {
    queries = [
      `${prefix}${climateSearches[climate][0]}`,
      `${prefix}${climateSearches[climate][1]}`,
      `${prefix}${climateSearches[climate][2]}`,
    ];

    if (conditionCategory === "rain" || conditionCategory === "drizzle") {
      queries.push(`${prefix}raincoat waterproof rain jacket`);
    }
    if (conditionCategory === "snow") {
      queries.push(`${prefix}winter coat thermal wool sweater`);
    }
  }

  return [...new Set(queries.map((query) => query.trim()))].slice(0, 4);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const climate = searchParams.get("climate") || "Warm";
    const gender = searchParams.get("gender") || "Everyone";
    const category = searchParams.get("category") || "All";
    const condition = searchParams.get("condition") || "";
    const weatherCode = searchParams.get("weatherCode");

    // What the shopper typed in the search box (cleaned and length-limited).
    const search = (searchParams.get("search") || "")
      .replace(/[^\p{L}\p{N}\s'&-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const searching = search.length > 0;

    const validClimates = ["Hot", "Warm", "Mild", "Cool", "Cold", "Rainy"];
    const validGenders = ["Women", "Men", "Everyone"];

    if (!validClimates.includes(climate)) {
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

    if (category !== "All" && !categoryTerms[category]) {
      return NextResponse.json(
        { error: "Invalid category selection.", products: [] },
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

    const genders = gender === "Everyone" ? ["Women", "Men"] : [gender];

    const tasks = genders.flatMap((g) =>
      (searching
        ? buildSearchQueries({ climate, gender: g, search })
        : buildQueries({
            climate,
            gender: g,
            category,
            conditionCategory: weather.category,
          })
      ).map((query) => ({ query, gender: g }))
    );

    const results = await Promise.allSettled(
      tasks.map(async (task) => {
        const response = await fetch("https://api.reefapi.com/meesho/v1/search", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: task.query, limit: 20 }),
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result || result.ok === false) {
          throw new Error(
            result?.error ||
              result?.message ||
              `ReefAPI request failed with HTTP ${response.status}`
          );
        }

        return extractProducts(result).map((raw) => ({
          raw,
          gender: task.gender,
        }));
      })
    );

    const successful = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    const failed = results.filter((result) => result.status === "rejected");

    if (successful.length === 0) {
      const failureMessage = failed[0]?.reason?.message;
      console.error("ReefAPI searches failed:", failureMessage);

      return NextResponse.json(
        {
          error: failureMessage || "ReefAPI returned no products.",
          query: tasks.map((task) => task.query),
          climate,
          gender,
          category,
          products: [],
          searchesFailed: failed.length,
        },
        { status: 502 }
      );
    }

    const uniqueProducts = new Map();

    const counters = {
      fromReef: successful.length,
      notClothing: 0,
      wrongCategory: 0,
      wrongGender: 0,
      wrongClimate: 0,
      noImageOrDuplicate: 0,
      kept: 0,
    };

    for (const { raw, gender: searchedGender } of successful) {
      if (!isClothingProduct(raw, category, searching)) {
        counters.notClothing++;
        continue;
      }
      // A typed search looks across every category.
      if (!searching && !matchesCategory(raw, category)) {
        counters.wrongCategory++;
        continue;
      }
      if (!matchesGender(raw, searchedGender)) {
        counters.wrongGender++;
        continue;
      }
      // If someone searches "sweater" on a hot day, still show sweaters.
      if (!searching && isWrongForClimate(raw, climate, weather.category)) {
        counters.wrongClimate++;
        continue;
      }

      const product = formatProduct(raw);
      if (!product || uniqueProducts.has(product.url)) {
        counters.noImageOrDuplicate++;
        continue;
      }
      counters.kept++;

      uniqueProducts.set(product.url, {
        ...product,
        gender: searchedGender,
        weatherScore: getWeatherScore(raw, climate),
      });
    }

    const products = [...uniqueProducts.values()]
      .sort((a, b) => b.weatherScore - a.weatherScore)
      .slice(0, 40)
      .map(({ weatherScore, ...product }) => product);

    return NextResponse.json({
      query: tasks.map((task) => task.query),
      climate,
      gender,
      category,
      search,
      debug: counters,
      condition: weather.description,
      weatherCategory: weather.category,
      products,
      source: "reef",
      searchesCompleted: results.length - failed.length,
      searchesFailed: failed.length,
      notice:
        products.length === 0
          ? searching
            ? "Nothing on Meesho matched that search as an outfit. Try different words."
            : "No products matched the clothing, gender and weather filters. Try another selection."
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