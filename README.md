# DisasterAid - Emergency Fund Platform

A community-driven emergency fund platform that displays real-time global disasters on an interactive map, allowing users to view severity levels and donate to relief efforts.

## Features

- **Live Disaster Map** — Interactive Mapbox GL map showing global natural disasters (earthquakes, floods, cyclones, wildfires, volcanoes, droughts)
- **Severity Color Coding** — Red (Critical), Orange (Warning), Green (Advisory) markers scaled by severity
- **Click-to-Zoom Details** — Click any disaster marker to fly to the location and view detailed information
- **Donation Flow** — Select preset or custom donation amounts for specific disasters
- **Mobile Responsive** — Bottom-sheet detail panel on mobile, side panel on desktop

## Tech Stack

- **Next.js 16** (App Router + TypeScript)
- **Mapbox GL JS** via react-map-gl
- **Tailwind CSS v4**
- **GDACS API** for real-time disaster data
- **Lucide React** for icons

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get a free Mapbox access token from [mapbox.com](https://account.mapbox.com/access-tokens/)

3. Add your token to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Data Source

Disaster data is sourced from the [GDACS (Global Disaster Alert and Coordination System)](https://www.gdacs.org/) API, which provides real-time alerts for earthquakes, tropical cyclones, floods, volcanoes, wildfires, and droughts worldwide.
