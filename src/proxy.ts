export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/driver/:path*", "/rider/:path*", "/api/carpools/:path*", "/api/bookings/:path*", "/api/my-carpools/:path*", "/api/my-rides/:path*", "/api/blocks/:path*"],
};
