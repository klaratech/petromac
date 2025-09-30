import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith("/intranet")) {
    const user = process.env.INTRANET_USER;
    const pass = process.env.INTRANET_PASS;
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Auth required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Intranet"' },
      });
    }

    const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString();
    const [givenUser, givenPass] = decoded.split(":");

    if (givenUser !== user || givenPass !== pass) {
      return new NextResponse("Invalid credentials", { status: 403 });
    }

    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/intranet/:path*"],
};
