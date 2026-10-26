import { NextResponse } from "next/server";

// Body: { image: "data:image/jpeg;base64,..." }
// Returns: { label: "blue denim jeans", category: "bottom" }
export async function POST(req) {
  const { image } = await req.json();
  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Describe this clothing item. Reply as JSON: {"label": "<colour + item, max 5 words>", "category": "top" | "bottom" | "dress" | "outerwear" | "footwear" | "accessory", "warmth": 1-5}',
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 });
  const data = await r.json();
  try {
    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch {
    return NextResponse.json({ label: "clothing item", category: "top", warmth: 3 });
  }
}