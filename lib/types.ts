export type AlertLevel = "Red" | "Orange" | "Green";

export type EventType = "EQ" | "TC" | "FL" | "VO" | "WF" | "DR";

export interface DisasterEvent {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  alertLevel: AlertLevel;
  severity: number;
  latitude: number;
  longitude: number;
  country: string;
  fromDate: string;
  toDate: string;
  url: string;
  population?: number;
  episodeId?: string;
}

export interface DisasterGeoJSON {
  type: "FeatureCollection";
  features: DisasterFeature[];
}

export interface DisasterFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: Omit<DisasterEvent, "latitude" | "longitude">;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  EQ: "Earthquake",
  TC: "Tropical Cyclone",
  FL: "Flood",
  VO: "Volcano",
  WF: "Wildfire",
  DR: "Drought",
};

export const ALERT_COLORS: Record<AlertLevel, string> = {
  Red: "#ef4444",
  Orange: "#f97316",
  Green: "#22c55e",
};
