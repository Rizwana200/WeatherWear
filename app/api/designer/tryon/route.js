import { NextResponse } from "next/server";
import { Client } from "@gradio/client";
import { createClient } from "@/lib/supabase/server";

// Free Hugging Face GPU queues are slow, and a top + bottom needs two runs.
export const maxDuration = 120;

// CatVTON can change the upper body, the lower body, or the whole outfit.
const SPACE = "zhengchong/CatVTON";
const MAX_GARMENTS = 2; // top + bottom (or a single dress)
const CLOTH_TYPE = { dress: "overall", top: "upper", outerwear: "upper", bottom: "lower" };

// 1x1 transparent PNG. The Space needs a mask layer, and an empty one tells it
// to find the clothing area on its own.
const BLANK_MASK_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function parse(dataUrl) {
  const m = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(dataUrl || "");
  return m ? { mime: m[1], b64: m[2] } : null;
}

const toBlob = ({ mime, b64 }) => new Blob([Buffer.from(b64, "base64")], { type: mime });

// in:  { person, clothes: [{ src: dataUrl, category }, ...], occasion, climate }
//      (plain dataUrl strings still work and are treated as tops)
// out: { image: dataUrl }
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const { person, clothes } = await req.json();
    const personImg = parse(person);
    const garments = (clothes || [])
      .slice(0, MAX_GARMENTS)
      .map((c) => {
        const src = typeof c === "string" ? c : c?.src;
        const category = typeof c === "string" ? "top" : c?.category;
        const img = parse(src);
        return img ? { img, clothType: CLOTH_TYPE[category] || "upper" } : null;
      })
      .filter(Boolean);

    if (!personImg || garments.length === 0) {
      return NextResponse.json(
        { error: "A photo and at least one clothing item are required." },
        { status: 400 }
      );
    }
    if (!process.env.HF_TOKEN) {
      return NextResponse.json({ error: "Server is missing HF_TOKEN." }, { status: 500 });
    }

    const client = await Client.connect(SPACE, { hf_token: process.env.HF_TOKEN });
    const blankMask = toBlob({ mime: "image/png", b64: BLANK_MASK_PNG });

    // Garments go on one after another: the result of the first call becomes
    // the "person" of the second, so top and bottom both end up on the body.
    let current = personImg;
    for (const g of garments) {
      const result = await client.predict("/submit_function", [
        { background: toBlob(current), layers: [blankMask], composite: null },
        toBlob(g.img),
        g.clothType, // "upper", "lower" or "overall"
        30, // inference steps (50 is slower)
        2.5, // guidance
        42, // seed
        "result only",
      ]);

      const url = result?.data?.[0]?.url;
      if (!url) throw new Error("The try-on service returned no image. Try a clearer photo.");

      const img = await fetch(url);
      const buf = Buffer.from(await img.arrayBuffer());
      current = { mime: "image/png", b64: buf.toString("base64") };
    }

    return NextResponse.json({ image: `data:${current.mime};base64,${current.b64}` });
  } catch (err) {
    const busy = /queue|quota|GPU|exceeded|timeout/i.test(err.message || "");
    return NextResponse.json(
      {
        error: busy
          ? "The free try-on service is busy. Please try again in a minute."
          : err.message || "Try-on failed.",
      },
      { status: busy ? 503 : 500 }
    );
  }
}