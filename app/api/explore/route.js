import { NextResponse } from "next/server";

// Add UNSPLASH_ACCESS_KEY to .env.local
// Get it at https://unsplash.com/developers (New Application -> Access Key)
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Search phrases chosen so results show real people wearing the outfit.
const QUERIES = {
  Women: {
    Hot: ["woman summer outfit street style", "woman sundress walking city", "woman linen outfit summer"],
    Cold: ["woman winter coat outfit street style", "woman sweater scarf outfit outdoors", "woman warm jacket boots street"],
    Rainy: ["woman raincoat umbrella street", "woman rainy day outfit walking", "woman trench coat rain city"],
    Cloudy: ["woman casual outfit autumn street style", "woman light jacket jeans outfit", "woman everyday outfit walking city"],
    Moderate: ["woman casual street style outfit", "woman jeans top outfit walking", "woman everyday fashion outdoors"],
  },
  Men: {
    Hot: ["man summer outfit street style", "man linen shirt shorts outdoors", "man t-shirt summer fashion city"],
    Cold: ["man winter jacket outfit street style", "man wool coat scarf outdoors", "man warm sweater boots street"],
    Rainy: ["man raincoat umbrella street", "man rainy day outfit walking", "man jacket rain city"],
    Cloudy: ["man casual outfit autumn street style", "man light jacket jeans outfit", "man everyday outfit walking city"],
    Moderate: ["man casual street style outfit", "man shirt jeans outfit walking", "man everyday fashion outdoors"],
  },
};

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const climate = searchParams.get("climate") || "Moderate";
  const gender = searchParams.get("gender") === "Men" ? "Men" : "Women";

  if (!UNSPLASH_KEY) {
    return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY is missing in .env.local" }, { status: 500 });
  }

  const queries = QUERIES[gender][climate] || QUERIES[gender].Moderate;

  // One search per request keeps us inside Unsplash's free demo limit (50/hour).
  // Responses are cached for an hour, so repeat visits cost nothing.
  const query = queries[Math.floor(Math.random() * queries.length)];

  try {
    const params = new URLSearchParams({
      query,
      per_page: "20",
      orientation: "portrait",
      content_filter: "high",
    });

    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, "Accept-Version": "v1" },
      next: { revalidate: 3600 },
    });

    if (res.status === 403 || res.status === 429) {
      return NextResponse.json({ error: "Photo limit reached for this hour. Please try again later." }, { status: 429 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "Unable to load outfit photos." }, { status: 502 });
    }

    const data = await res.json();

    const products = shuffle(data.results || [])
      .filter((p) => p?.urls?.regular)
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        image: p.urls.regular,
        alt: p.alt_description || `${gender} outfit`,
        photographer: p.user?.name || "Unsplash",
        url: `${p.links?.html || "https://unsplash.com"}?utm_source=weather_outfit_app&utm_medium=referral`,
      }));

    if (products.length === 0) {
      return NextResponse.json({ error: "No outfit photos found. Please try again." }, { status: 404 });
    }

    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: "Unable to load outfit photos." }, { status: 500 });
  }
}
