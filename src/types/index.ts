export const ROUTES = [
  "To Seminary",
  "To School from Seminary",
  "To School",
  "Home from School",
  "Other",
] as const;

export type Route = (typeof ROUTES)[number];

export const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;
