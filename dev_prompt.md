# Repository Reorganization & Public/Intranet Split

**Purpose:** Move the current app into `/intranet`, create a new public-facing homepage (replica of [petromac.co.nz](https://petromac.co.nz)), and add an intranet homepage with Athena + Kiosk tiles.

---

## Tasks
1. **Move current app into `/app/intranet/*`**
   - Old homepage → `/app/intranet/page.tsx`.
   - All existing routes, APIs, and components → under `/app/intranet/`.
   - Fix all imports/paths.

2. **Create public-facing site at `/`**
   - `/app/page.tsx` = replica of current Petromac homepage.
   - Add `/about`, `/catalog`, `/case-studies`, `/contact` (stubs).
   - Build with reusable components under `/components/public/`.

3. **Intranet homepage**
   - `/app/intranet/page.tsx` shows two tiles:
     - **Athena** → external link (env-configurable).
     - **Kiosk** → points to existing intranet app (`/app/intranet/kiosk`).

4. **Middleware**
   - Protect `/intranet/*` with Basic Auth (`INTRANET_USER`, `INTRANET_PASS`).
   - Add `X-Robots-Tag: noindex, nofollow` for `/intranet/*`.

5. **Docs**
   - Update `README.md`, `.env.example`, `TODO.md`.

---

## Target Structure
```
/app
  /page.tsx                 # new public homepage
  /about/page.tsx           # stub
  /catalog/page.tsx         # stub
  /case-studies/page.tsx    # stub
  /contact/page.tsx         # stub
  /intranet
    /page.tsx               # intranet homepage (Athena + Kiosk tiles)
    /kiosk/page.tsx         # kiosk entry (existing code moved here)
/components/public
  Hero.tsx
  ProblemSection.tsx
  ProductTeaser.tsx
  Footer.tsx
/middleware.ts
/public/images/hero.jpg     # hero image
```

---

## Public Homepage Components

### `/components/public/Hero.tsx`
```tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-cover bg-center text-white h-[70vh]" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
      <div className="flex flex-col items-center justify-center h-full bg-black/50 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Bespoke Devices for the Wireline Logging Industry
        </h1>
        <p className="max-w-2xl mb-6 text-lg md:text-xl">
          Solutions for differential sticking, high deviation, orientation, and sample quality
        </p>
        <div className="flex gap-4">
          <Link href="/catalog" className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
            View Catalog
          </Link>
          <Link href="/case-studies" className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-800">
            Case Studies
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### `/components/public/ProblemSection.tsx`
```tsx
import Link from "next/link";

const problems = [
  { title: "Deviation", desc: "Operate reliably in high deviation wells.", link: "/case-studies" },
  { title: "Ledges", desc: "Manage ledges and hole irregularities.", link: "/case-studies" },
  { title: "Orientation", desc: "Orient probes for better sample quality.", link: "/case-studies" },
  { title: "Sticking", desc: "Mitigate differential sticking risks.", link: "/case-studies" },
];

export default function ProblemSection() {
  return (
    <section className="py-16 px-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {problems.map((p) => (
        <div key={p.title} className="border rounded-xl p-6 shadow hover:shadow-lg transition">
          <h3 className="text-xl font-bold mb-2">{p.title}</h3>
          <p className="mb-4">{p.desc}</p>
          <Link href={p.link} className="text-blue-600 hover:underline">
            Read More →
          </Link>
        </div>
      ))}
    </section>
  );
}
```

### `/components/public/ProductTeaser.tsx`
```tsx
import Link from "next/link";

export default function ProductTeaser() {
  return (
    <section className="bg-gray-50 py-16 px-6 text-center">
      <h2 className="text-3xl font-bold mb-4">Wireline Express</h2>
      <p className="max-w-2xl mx-auto mb-6">
        Our wheeled carriages and orientation tools simplify high-deviation logging and improve sample quality.
      </p>
      <Link href="/catalog" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Explore Catalog
      </Link>
    </section>
  );
}
```

### `/components/public/Footer.tsx`
```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-6 text-center">
      <div className="mb-4 flex justify-center gap-6">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Use</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
      </div>
      <p>© {new Date().getFullYear()} Petromac. All rights reserved.</p>
    </footer>
  );
}
```

### `/app/page.tsx`
```tsx
import Hero from "@/components/public/Hero";
import ProblemSection from "@/components/public/ProblemSection";
import ProductTeaser from "@/components/public/ProductTeaser";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProblemSection />
      <ProductTeaser />
      <Footer />
    </main>
  );
}
```

---

## Intranet Homepage

### `/app/intranet/page.tsx`
```tsx
import Link from "next/link";

export default function IntranetHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Intranet</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <a
          href="https://athena.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold mb-2">Athena</h2>
          <p className="text-gray-600">Go to Athena portal</p>
        </a>
        <Link
          href="/intranet/kiosk"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold mb-2">Kiosk</h2>
          <p className="text-gray-600">Access the internal kiosk application</p>
        </Link>
      </div>
    </main>
  );
}
```

---

## Middleware

### `/middleware.ts`
```ts
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
        headers: { "WWW-Authenticate": "Basic realm=\"Intranet\"" },
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
```

---

## Environment Variables

`.env.example`
```env
INTRANET_USER=changeme
INTRANET_PASS=changeme
INTRANET_PROTECT_ENABLED=true
```

---

## TODO.md (starter items)
- [ ] Replace basic auth with NextAuth/OAuth (role-based access).  
- [ ] Flesh out public About, Catalog, Case Studies pages.  
- [ ] Optimize images for performance.  
- [ ] Add audit logs for intranet access.  
- [ ] Centralize shared UI (public + intranet) in `/components/shared`.  

---

## Acceptance Criteria
- `/` shows **replica homepage**.  
- `/intranet/` shows **two tiles** (Athena, Kiosk).  
- All old app code works under `/intranet/*`.  
- Middleware protects intranet with basic auth and sets `noindex`.  
- Data pipeline still outputs JSON to `/public/data`.  
- Build passes locally and on Vercel.  
