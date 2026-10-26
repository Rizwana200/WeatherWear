import { NextResponse } from "next/server";

// Body: { items: [{ id, label, category, warmth }], weather: { temp, condition }, occasion }
// Returns: { outfits: [{ name, itemIds, tip }] }
export async function POST(req) {
  const { items, weather, occasion } = await req.json();

  const wardrobe = items
    .map((i) => `${i.id}: ${i.label} (${i.category}, warmth ${i.warmth ?? 3}/5)`)
    .join("\n");

  const prompt = `You are a stylist. Weather: ${weather.temp}°C, ${weather.condition}. Occasion: ${occasion}.
Wardrobe:
${wardrobe}

Pick up to 5 different outfits using ONLY these item ids. Each outfit is either one "dress" or a "top" + "bottom", optionally adding outerwear, footwear or accessory. Match warmth to the temperature (hot: low warmth, cold or rainy: add outerwear). Reply as JSON:
{"outfits":[{"name":"short name","itemIds":["id1","id2"],"tip":"one short styling tip mentioning the weather"}]}`;

  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat", // same text model your other routes already use
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 });

  const data = await r.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    const valid = new Set(items.map((i) => i.id));
    // drop any ids the model invented
    parsed.outfits = (parsed.outfits ?? [])
      .map((o) => ({ ...o, itemIds: (o.itemIds ?? []).filter((id) => valid.has(id)) }))
      .filter((o) => o.itemIds.length > 0);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ outfits: [] }, { status: 502 });
  }
}
