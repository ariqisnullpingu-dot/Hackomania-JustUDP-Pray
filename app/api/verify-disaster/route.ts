import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VerificationResult {
  verified: boolean;
  confidence: number;
  disasterType: string;
  aiDescription: string;
  gdacsMatch: boolean;
  gdacsEvents: Array<{
    name: string;
    alertLevel: string;
    distance_km: number;
  }>;
  reason: string;
  recommendedAmount: number;
  nearestCommittee: string;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const COMMITTEE_MAPPING: Record<string, { name: string; wallet: string }> = {
  default: {
    name: "International Disaster Relief Fund",
    wallet: "https://ilp.interledger-test.dev/disaster-relief",
  },
  JP: { name: "Japan Red Cross Society", wallet: "https://ilp.interledger-test.dev/jp-relief" },
  US: { name: "American Red Cross", wallet: "https://ilp.interledger-test.dev/us-relief" },
  PH: { name: "Philippine Red Cross", wallet: "https://ilp.interledger-test.dev/ph-relief" },
  BD: { name: "Bangladesh Red Crescent Society", wallet: "https://ilp.interledger-test.dev/bd-relief" },
  MX: { name: "Mexican Red Cross", wallet: "https://ilp.interledger-test.dev/mx-relief" },
  ID: { name: "Indonesian Red Cross", wallet: "https://ilp.interledger-test.dev/id-relief" },
  IN: { name: "Indian Red Cross Society", wallet: "https://ilp.interledger-test.dev/in-relief" },
  TH: { name: "Thai Red Cross Society", wallet: "https://ilp.interledger-test.dev/th-relief" },
  KE: { name: "Kenya Red Cross Society", wallet: "https://ilp.interledger-test.dev/ke-relief" },
  IT: { name: "Italian Red Cross", wallet: "https://ilp.interledger-test.dev/it-relief" },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid or missing coordinates" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const [aiResult, gdacsResult] = await Promise.all([
      analyzeWithGPT4o(base64Image, mimeType),
      checkGDACS(latitude, longitude),
    ]);

    const gdacsMatch = gdacsResult.length > 0;
    const aiConfidence = aiResult.confidence;

    let verified = false;
    let reason = "";

    if (aiConfidence >= 70) {
      verified = true;
      reason = gdacsMatch
        ? `AI detected disaster with ${aiConfidence}% confidence, corroborated by ${gdacsResult.length} GDACS event(s) nearby.`
        : `AI detected disaster with ${aiConfidence}% confidence. No matching GDACS events, but visual evidence is strong.`;
    } else if (aiConfidence >= 40 && gdacsMatch) {
      verified = true;
      reason = `Moderate AI confidence (${aiConfidence}%), but corroborated by GDACS event(s) in the area.`;
    } else if (gdacsMatch && aiConfidence >= 20) {
      verified = true;
      reason = `GDACS confirms active disaster in this area. AI confidence: ${aiConfidence}%.`;
    } else {
      reason =
        aiConfidence < 40
          ? `AI analysis did not detect clear disaster indicators (confidence: ${aiConfidence}%). No matching GDACS events found nearby.`
          : `Insufficient evidence to verify disaster at this location.`;
    }

    const nearestCountry = gdacsResult[0]?.country_iso || "default";
    const committee =
      COMMITTEE_MAPPING[nearestCountry] || COMMITTEE_MAPPING.default;

    const severityMultiplier = Math.max(aiConfidence / 100, 0.5);
    const recommendedAmount = Math.round(500 * severityMultiplier);

    const result: VerificationResult = {
      verified,
      confidence: aiConfidence,
      disasterType: aiResult.disasterType,
      aiDescription: aiResult.description,
      gdacsMatch,
      gdacsEvents: gdacsResult.map((e) => ({
        name: e.name,
        alertLevel: e.alertLevel,
        distance_km: e.distance_km,
      })),
      reason,
      recommendedAmount,
      nearestCommittee: committee.name,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

async function analyzeWithGPT4o(
  base64Image: string,
  mimeType: string
): Promise<{ confidence: number; disasterType: string; description: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a disaster verification AI agent. Analyze images to determine if they show evidence of a natural disaster. Respond ONLY with valid JSON in this exact format:
{"confidence": <0-100>, "disasterType": "<earthquake|flood|wildfire|cyclone|volcano|drought|storm|landslide|other|none>", "description": "<brief description of what you see>"}

Confidence guidelines:
- 90-100: Clear, unmistakable disaster (massive flooding, building collapse, raging wildfire)
- 70-89: Strong evidence of disaster (significant damage, emergency conditions)
- 40-69: Possible disaster indicators (minor damage, weather events)
- 0-39: No clear disaster evidence`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is there evidence of a natural disaster? Respond with JSON only.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
        disasterType: parsed.disasterType || "none",
        description: parsed.description || "Unable to analyze image.",
      };
    }
    return { confidence: 0, disasterType: "none", description: "Failed to parse AI response." };
  } catch (error) {
    console.error("GPT-4o analysis error:", error);
    return { confidence: 0, disasterType: "none", description: "AI analysis unavailable." };
  }
}

interface GDACSNearbyEvent {
  name: string;
  alertLevel: string;
  distance_km: number;
  country_iso: string;
}

async function checkGDACS(
  lat: number,
  lng: number
): Promise<GDACSNearbyEvent[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];

    const url =
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH` +
      `?eventlist=EQ,TC,FL,VO,WF,DR` +
      `&alertlevel=Green;Orange;Red` +
      `&fromDate=${fromDate}&toDate=${toDate}`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];

    const data = await res.json();
    const RADIUS_KM = 150;

    const nearby: GDACSNearbyEvent[] = [];
    for (const feature of data.features || []) {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const dist = haversineDistance(lat, lng, coords[1], coords[0]);
      if (dist <= RADIUS_KM) {
        nearby.push({
          name: feature.properties?.name || "Unknown Event",
          alertLevel: feature.properties?.alertlevel || "Green",
          distance_km: Math.round(dist),
          country_iso: feature.properties?.iso3?.substring(0, 2) || "",
        });
      }
    }

    nearby.sort((a, b) => a.distance_km - b.distance_km);
    return nearby.slice(0, 5);
  } catch (error) {
    console.error("GDACS check error:", error);
    return [];
  }
}
