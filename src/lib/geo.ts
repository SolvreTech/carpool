/** Haversine distance between two coordinates in meters */
export function distanceBetween(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distance-based status message for rider tracking */
export function getStatusMessage(distanceMeters: number): string {
  if (distanceMeters < 100) return "Driver is here";
  if (distanceMeters < 500) return "Arriving soon";
  if (distanceMeters < 2000) return "Getting close";
  return "On the way";
}

/** Get a CSS class for the status color */
export function getStatusColor(distanceMeters: number): string {
  if (distanceMeters < 100) return "text-primary";
  if (distanceMeters < 500) return "text-accent";
  if (distanceMeters < 2000) return "text-amber-500";
  return "text-text-secondary";
}
