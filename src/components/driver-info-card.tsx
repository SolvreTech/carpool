import Avatar from "./ui/avatar";
import Badge from "./ui/badge";
import Card from "./ui/card";

interface DriverInfoCardProps {
  name: string;
  route: string;
  time: string;
}

export default function DriverInfoCard({ name, route, time }: DriverInfoCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text">{name}</h3>
          <p className="text-sm text-text-secondary">{route}</p>
          <Badge variant="secondary" className="mt-1">{time}</Badge>
        </div>
      </div>
    </Card>
  );
}
