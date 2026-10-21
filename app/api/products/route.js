
import { NextResponse } from "next/server";

const weatherSearches = {
  Hot: "women cotton summer tops",
  Warm: "women casual cotton tops",
  Mild: "women casual shirts trousers",
  Cool: "women hoodies jeans",
  Cold: "women sweaters winter jackets",
  Rainy: "women raincoats waterproof shoes",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const climate = searchParams.get("climate") || "Warm";
    const query =
      searchParams.get("q")?.trim() ||
      weatherSearches[climate] ||
      weatherSearches.Warm;

    const apiKey = process.env.REEF_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Add REEF_API_KEY to .env.local" },
        { status: 500 }
      );
    }

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

    const result = await response.json();

    if (!response.ok || result.ok === false) {
      return NextResponse.json(
        { error: result.error || "Meesho search failed" },
        { status: response.ok ? 502 : response.status }
      );
    }

    // Support the different response structures.
    const products = Array.isArray(result.products?.results)
      ? result.products.results
      : Array.isArray(result.data?.results)
        ? result.data.results
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.results)
            ? result.results
            : [];

    // Return consistent fields for the Store page.
    const formattedProducts = products
      .filter((product) => product.url && product.title)
      .map((product) => ({
        id: product.product_id || product.catalog_id,
        title: product.title,
        image:
          product.image ||
          product.images?.[0] ||
          "",
        price: product.price ?? null,
        currency: product.currency || "INR",
        rating: product.rating ?? null,
        ratingCount: product.rating_count ?? 0,
        category: product.category_name || "Clothing",
        url: product.url,
      }));

    return NextResponse.json({
      query,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Meesho API error:", error);

    return NextResponse.json(
      { error: "Could not fetch products. Try again." },
      { status: 500 }
    );
  }
}
