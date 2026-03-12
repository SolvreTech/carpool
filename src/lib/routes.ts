export interface RouteCoords {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
}

// Coordinates for the Anatolia College campus area in Thessaloniki
export const ROUTE_COORDS: Record<string, RouteCoords> = {
  "To Seminary": {
    origin: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
    destination: { lat: 40.5941, lng: 22.9473, name: "Seminary" },
  },
  "To School from Seminary": {
    origin: { lat: 40.5941, lng: 22.9473, name: "Seminary" },
    destination: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
  },
  "To School": {
    origin: { lat: 40.6301, lng: 22.9407, name: "City Center" },
    destination: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
  },
  "Home from School": {
    origin: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
    destination: { lat: 40.6301, lng: 22.9407, name: "City Center" },
  },
};

export function getRouteDisplayNames(route: string, customRoute: string | null): { origin: string; destination: string } | null {
  if (route === "Other" && customRoute) {
    return { origin: customRoute, destination: "" };
  }
  const coords = ROUTE_COORDS[route];
  if (!coords) return null;
  return { origin: coords.origin.name, destination: coords.destination.name };
}
