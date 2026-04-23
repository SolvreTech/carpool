const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface DirectionsResult {
  geometry: string;
  distance: number;
  duration: number;
}

export async function fetchDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  stops: { lat: number; lng: number }[] = []
): Promise<DirectionsResult | null> {
  if (!MAPBOX_TOKEN) return null;

  try {
    const points = [origin, ...stops, destination]
      .map((p) => `${p.lng},${p.lat}`)
      .join(";");
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${points}?geometries=polyline6&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      geometry: route.geometry,
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
    };
  } catch {
    return null;
  }
}

export function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / 1e6, lat / 1e6]);
  }

  return coords;
}
