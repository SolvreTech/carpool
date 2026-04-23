interface RouteTimelineProps {
  origin: string;
  destination?: string;
  stops?: { name: string }[];
  distance?: number | null; // meters
  duration?: number | null; // seconds
  className?: string;
}

export default function RouteTimeline({ origin, destination, stops, distance, duration, className = "" }: RouteTimelineProps) {
  const hasMeta = distance != null && duration != null && distance > 0;
  const metaText = hasMeta
    ? `${Math.round(duration! / 60)} min · ${(distance! / 1609.344).toFixed(1)} mi`
    : null;
  const mids = stops?.filter((s) => s.name) ?? [];

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex flex-col items-center pt-0.5">
        <div className="h-3 w-3 rounded-full bg-primary border-2 border-primary" />
        {mids.map((_, i) => (
          <div key={`stop-${i}`} className="flex flex-col items-center">
            <div className="w-0.5 h-6 border-l-2 border-dashed border-primary-light" />
            <div className="h-2.5 w-2.5 rounded-full bg-white border-2 border-primary-light" />
          </div>
        ))}
        {destination && (
          <>
            <div className="w-0.5 h-6 border-l-2 border-dashed border-primary-light" />
            <div className="h-3 w-3 rounded-full border-2 border-primary bg-white" />
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-0">
        <span className="text-sm font-medium text-text leading-tight">{origin}</span>
        {mids.map((s, i) => (
          <span key={`stop-label-${i}`} className="text-sm text-text-secondary leading-tight">{s.name}</span>
        ))}
        {metaText && (
          <span className="text-xs text-text-muted -mt-1.5">{metaText}</span>
        )}
        {destination && (
          <span className="text-sm font-medium text-text leading-tight">{destination}</span>
        )}
      </div>
    </div>
  );
}
