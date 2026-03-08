import { NextResponse } from "next/server";
import type { DisasterGeoJSON, DisasterFeature, AlertLevel, EventType } from "@/lib/types";

const DEMO_EVENTS: DisasterFeature[] = [
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [139.6917, 35.6895] },
    properties: {
      id: "DEMO-EQ-001",
      name: "Earthquake in Japan",
      description: "Red M 7.8 Earthquake in Japan — Major seismic event near Tokyo metropolitan area. Tsunami warning issued for coastal prefectures.",
      eventType: "EQ",
      alertLevel: "Red",
      severity: 2.5,
      country: "Japan",
      fromDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-001",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [-89.2, 18.5] },
    properties: {
      id: "DEMO-TC-002",
      name: "Tropical Cyclone in Caribbean",
      description: "Red Category 4 Tropical Cyclone approaching Yucatan Peninsula. Wind speeds exceeding 210 km/h. Evacuations ordered.",
      eventType: "TC",
      alertLevel: "Red",
      severity: 2.5,
      country: "Mexico",
      fromDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-002",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [90.4, 23.8] },
    properties: {
      id: "DEMO-FL-003",
      name: "Severe Flooding in Bangladesh",
      description: "Red Severe flooding across Dhaka division. Over 2 million people affected. Monsoon rains 300% above seasonal average.",
      eventType: "FL",
      alertLevel: "Red",
      severity: 2.5,
      country: "Bangladesh",
      fromDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-003",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [-122.4194, 37.7749] },
    properties: {
      id: "DEMO-WF-004",
      name: "Wildfire in California",
      description: "Orange Major wildfire burning in Northern California. 50,000 acres consumed. Air quality hazardous across Bay Area.",
      eventType: "WF",
      alertLevel: "Orange",
      severity: 1.5,
      country: "United States",
      fromDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-004",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [14.4264, 40.8218] },
    properties: {
      id: "DEMO-VO-005",
      name: "Volcanic Eruption near Naples, Italy",
      description: "Orange Increased volcanic activity at Campi Flegrei. Elevated seismic swarms detected. Alert level raised.",
      eventType: "VO",
      alertLevel: "Orange",
      severity: 1.5,
      country: "Italy",
      fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-005",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [36.8, -1.3] },
    properties: {
      id: "DEMO-DR-006",
      name: "Drought in Kenya",
      description: "Orange Prolonged drought affecting Eastern Kenya. Crop failures reported across 5 counties. 1.5 million facing food insecurity.",
      eventType: "DR",
      alertLevel: "Orange",
      severity: 1.5,
      country: "Kenya",
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-006",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [100.5, 13.75] },
    properties: {
      id: "DEMO-FL-007",
      name: "Flash Floods in Thailand",
      description: "Orange Flash flooding in Bangkok metropolitan area. Transportation disrupted. Emergency shelters activated.",
      eventType: "FL",
      alertLevel: "Orange",
      severity: 1.5,
      country: "Thailand",
      fromDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      url: "https://www.gdacs.org",
      episodeId: "DEMO-007",
    },
  },
];

let cachedData: DisasterGeoJSON | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cachedData);
  }

  try {
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];

    const url =
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH` +
      `?eventlist=EQ,TC,FL,VO,WF,DR` +
      `&alertlevel=Green;Orange;Red` +
      `&fromDate=${fromDate}` +
      `&toDate=${toDate}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`GDACS API responded with ${response.status}`);
    }

    const raw = await response.json();

    const features: DisasterFeature[] = (raw.features || [])
      .filter((f: any) => f.geometry?.coordinates?.length === 2)
      .map((f: any): DisasterFeature => {
        const p = f.properties;
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: f.geometry.coordinates,
          },
          properties: {
            id: `${p.eventtype}-${p.eventid}`,
            name: p.name || "Unknown Event",
            description: p.htmldescription || p.description || "",
            eventType: p.eventtype as EventType,
            alertLevel: (p.alertlevel || "Green") as AlertLevel,
            severity: p.episodealertscore ?? p.alertscore ?? 0,
            country: p.country || "Unknown",
            fromDate: p.fromdate || "",
            toDate: p.todate || "",
            url: p.url?.report || "",
            episodeId: String(p.episodeid || ""),
          },
        };
      });

    const geojson: DisasterGeoJSON = {
      type: "FeatureCollection",
      features: [...DEMO_EVENTS, ...features],
    };

    cachedData = geojson;
    cacheTimestamp = now;

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("Failed to fetch GDACS data:", error);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    return NextResponse.json(
      { type: "FeatureCollection", features: [] } as DisasterGeoJSON,
      { status: 502 }
    );
  }
}
