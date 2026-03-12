interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-primary text-white font-semibold shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
