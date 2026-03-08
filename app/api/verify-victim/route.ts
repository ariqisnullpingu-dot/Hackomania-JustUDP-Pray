import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type InjurySeverity = "none" | "minor" | "moderate" | "severe" | "critical";
type DamageLevel = "none" | "minor" | "moderate" | "severe" | "catastrophic";
type UrgencyLevel = "low" | "medium" | "high" | "immediate";

interface VerificationResult {
  verified: boolean;
  confidence: number;
  injurySeverity: InjurySeverity;
  injuryDescription: string;
  surroundingDamage: DamageLevel;
  damageDescription: string;
  peopleVisible: number;
  urgencyLevel: UrgencyLevel;
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
  allocationNote?: string;
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
  SG: { name: "Singapore Red Cross Society", wallet: "https://ilp.interledger-test.dev/sg-relief" },
};

const SEVERITY_MULTIPLIER: Record<InjurySeverity, number> = {
  none: 0.2,
  minor: 0.4,
  moderate: 0.7,
  severe: 1.0,
  critical: 1.5,
};

const URGENCY_MULTIPLIER: Record<UrgencyLevel, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1.0,
  immediate: 1.5,
};

/** Country-based allocation: higher cost-of-living regions get more aid per claim */
const COUNTRY_MULTIPLIER: Record<string, number> = {
  default: 1.0,
  US: 1.3,
  JP: 1.25,
  SG: 1.2,
  IT: 1.15,
  MX: 1.0,
  TH: 0.95,
  PH: 0.9,
  ID: 0.9,
  IN: 0.85,
  BD: 0.8,
  KE: 0.8,
};

/** Disaster severity from GDACS: Red = most severe, higher allocation */
const GDACS_SEVERITY_MULTIPLIER: Record<string, number> = {
  Red: 1.4,
  Orange: 1.15,
  Green: 1.0,
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
      analyzeVictimPhoto(base64Image, mimeType),
      checkGDACS(latitude, longitude),
    ]);

    const gdacsMatch = gdacsResult.length > 0;
    const aiConfidence = aiResult.confidence;

    const noInjury = aiResult.injurySeverity === "none";
    const noDamage = aiResult.surroundingDamage === "none";
    const lowUrgency = aiResult.urgencyLevel === "low";

    let verified = false;
    let reason = "";

    if (noInjury && noDamage && lowUrgency) {
      reason = "No visible injuries, damage, or urgency detected. Claim cannot be approved.";
    } else if (noInjury && noDamage) {
      reason = "No visible injuries or structural damage detected in the photo.";
    } else if (aiConfidence >= 70 && !(noInjury && noDamage)) {
      verified = true;
      reason = gdacsMatch
        ? `AI verified with ${aiConfidence}% confidence. ${gdacsResult.length} GDACS disaster event(s) confirmed nearby.`
        : `AI verified with ${aiConfidence}% confidence. Strong visual evidence of disaster impact.`;
    } else if (aiConfidence >= 40 && gdacsMatch) {
      verified = true;
      reason = `Moderate AI confidence (${aiConfidence}%), corroborated by active GDACS event(s) in the area.`;
    } else if (gdacsMatch && aiConfidence >= 20) {
      verified = true;
      reason = `GDACS confirms active disaster at this location. AI confidence: ${aiConfidence}%.`;
    } else {
      reason =
        aiConfidence < 40
          ? `Insufficient evidence of disaster impact (confidence: ${aiConfidence}%). No matching GDACS events nearby.`
          : `Unable to verify disaster impact at this location.`;
    }

    const nearestEvent = gdacsResult[0];
    const nearestCountry = nearestEvent?.country_iso || "default";
    const committee =
      COMMITTEE_MAPPING[nearestCountry] || COMMITTEE_MAPPING.default;

    // Allocate funds by disaster severity + country + injury/urgency
    const baseAmount = 500;
    const countryMult = COUNTRY_MULTIPLIER[nearestCountry] ?? COUNTRY_MULTIPLIER.default;
    const gdacsSeverityMult = GDACS_SEVERITY_MULTIPLIER[nearestEvent?.alertLevel || "Green"] ?? 1.0;
    const sevMult = SEVERITY_MULTIPLIER[aiResult.injurySeverity] ?? 0.5;
    const urgMult = URGENCY_MULTIPLIER[aiResult.urgencyLevel] ?? 0.75;
    const confidenceMult = Math.max(aiConfidence / 100, 0.3);
    const recommendedAmount = Math.round(
      baseAmount * countryMult * gdacsSeverityMult * sevMult * urgMult * confidenceMult
    );

    const allocationNote = verified
      ? `Allocated by disaster severity (${nearestEvent?.alertLevel || "Green"}: ${(gdacsSeverityMult * 100).toFixed(0)}%) + country + injury/urgency.`
      : undefined;

    const result: VerificationResult = {
      verified,
      confidence: aiConfidence,
      injurySeverity: aiResult.injurySeverity,
      injuryDescription: aiResult.injuryDescription,
      surroundingDamage: aiResult.surroundingDamage,
      damageDescription: aiResult.damageDescription,
      peopleVisible: aiResult.peopleVisible,
      urgencyLevel: aiResult.urgencyLevel,
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
      allocationNote,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Victim verification error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

interface AIVictimResult {
  confidence: number;
  injurySeverity: InjurySeverity;
  injuryDescription: string;
  surroundingDamage: DamageLevel;
  damageDescription: string;
  peopleVisible: number;
  urgencyLevel: UrgencyLevel;
  disasterType: string;
  description: string;
}

async function analyzeVictimPhoto(
  base64Image: string,
  mimeType: string
): Promise<AIVictimResult> {
  const fallback: AIVictimResult = {
    confidence: 0,
    injurySeverity: "none",
    injuryDescription: "AI analysis unavailable.",
    surroundingDamage: "none",
    damageDescription: "",
    peopleVisible: 0,
    urgencyLevel: "low",
    disasterType: "none",
    description: "AI analysis unavailable.",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a disaster victim verification AI. Analyze photos submitted by people claiming to be affected by a natural disaster. Perform a full assessment of the scene. Respond ONLY with valid JSON in this exact format:

{
  "confidence": <0-100>,
  "injurySeverity": "<none|minor|moderate|severe|critical>",
  "injuryDescription": "<describe visible injuries or distress>",
  "surroundingDamage": "<none|minor|moderate|severe|catastrophic>",
  "damageDescription": "<describe visible structural/environmental damage>",
  "peopleVisible": <number of people visible in the photo>,
  "urgencyLevel": "<low|medium|high|immediate>",
  "disasterType": "<earthquake|flood|wildfire|cyclone|volcano|drought|storm|landslide|fire|other|none>",
  "description": "<overall assessment of the situation>"
}

Injury severity guide:
- none: No visible injuries
- minor: Scratches, bruises, minor cuts
- moderate: Visible wounds, limping, bandaged areas, bleeding
- severe: Broken bones, deep lacerations, immobilized, heavy bleeding
- critical: Life-threatening injuries, unconscious, trapped

Surrounding damage guide:
- none: No visible damage
- minor: Cracked walls, scattered debris
- moderate: Partial structural damage, flooding, fallen trees
- severe: Collapsed structures, widespread destruction
- catastrophic: Total devastation, area unrecognizable

Urgency guide:
- low: Situation is stable, no immediate threat
- medium: Needs assistance but not in immediate danger
- high: Urgent help needed, deteriorating conditions
- immediate: Life-threatening, requires emergency response now`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this photo submitted by a disaster victim claiming aid. Assess injuries, surrounding damage, urgency, and number of people. Respond with JSON only.",
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
      max_tokens: 500,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
        injurySeverity: parsed.injurySeverity || "none",
        injuryDescription: parsed.injuryDescription || "No injuries detected.",
        surroundingDamage: parsed.surroundingDamage || "none",
        damageDescription: parsed.damageDescription || "",
        peopleVisible: Math.max(0, Number(parsed.peopleVisible) || 0),
        urgencyLevel: parsed.urgencyLevel || "low",
        disasterType: parsed.disasterType || "none",
        description: parsed.description || "Unable to analyze image.",
      };
    }
    return { ...fallback, description: "Failed to parse AI response." };
  } catch (error) {
    console.error("GPT-4o victim analysis error:", error);
    return fallback;
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
