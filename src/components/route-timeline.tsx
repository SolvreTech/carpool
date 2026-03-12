interface RouteTimelineProps {
  origin: string;
  destination?: string;
  className?: string;
}

export default function RouteTimeline({ origin, destination, className = "" }: RouteTimelineProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex flex-col items-center pt-0.5">
        <div className="h-3 w-3 rounded-full bg-primary border-2 border-primary" />
        {destination && (
          <>
            <div className="w-0.5 h-6 border-l-2 border-dashed border-primary-light" />
            <div className="h-3 w-3 rounded-full border-2 border-primary bg-white" />
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-0">
        <span className="text-sm font-medium text-text leading-tight">{origin}</span>
        {destination && (
          <span className="text-sm font-medium text-text leading-tight">{destination}</span>
        )}
      </div>
    </div>
  );
}
