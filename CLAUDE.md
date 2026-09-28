# Project: AI Ad Agency Platform

A SaaS website where brands/e-commerce clients upload product photos and receive AI-generated UGC-style ads and cinematic commercials. Subscription-based business model. This file governs how Claude Code should build and modify this codebase — read it before making changes.

## What we're building

A pipeline product wrapped in a polished marketing + app experience:

1. Client signs up, picks a subscription plan.
2. Client uploads product image(s) and fills a creative brief (audience, tone, platform, ad type).
3. Backend pipeline: Claude generates script/storyboard → video/avatar generation API renders the ad → voice/TTS → assembly/captioning → final video.
4. Client previews, downloads, and manages ads from a dashboard.
5. Usage is metered against their subscription tier (credits or generation caps).

Two ad types to support: **UGC-style** (AI creator/avatar talks to camera) and **cinematic commercial** (product in a produced scene, no avatar).

## Business model

- Subscription tiers (e.g., Starter / Growth / Agency), billed monthly via Stripe.
- Each tier has a monthly generation credit allowance (video generation costs real money per call — pricing must protect margin).
- Overage handled via credit top-ups, not silent throttling — always show remaining credits in the UI.
- Annual billing discount as a secondary option once monthly is working.

## Design philosophy — act like a design director with 20 years in the industry, not a template picker

This is a premium creative-tools product (think: category next to Runway, Captions, HeyGen). The design must read as **confident, restrained, and expensive**, not like a generic SaaS template.

Non-negotiables:
- **Typography does the heavy lifting.** One expressive display typeface for headlines, one clean workhorse for body/UI. Real type scale (not ad-hoc font sizes), generous line-height, tight tracking on large headlines.
- **Whitespace is a feature.** Never cram. Let sections breathe — big top/bottom padding, wide margins on desktop.
- **Restrained color.** A dark, cinematic base palette fits this product's subject matter (video/film) better than a bright generic-SaaS palette. One accent color used sparingly for CTAs and highlights, not everywhere.
- **Motion is purposeful, not decorative.** Subtle scroll-reveals, smooth hover states, real product footage/generated video samples autoplaying muted in the hero — not bouncy gimmicks.
- **Show the product, don't just describe it.** Hero and feature sections should show actual before/after (product photo → generated ad) rather than stock illustrations or abstract shapes.
- **Hierarchy over decoration.** Every section has one clear job and one clear next action. No competing CTAs.
- **Real, specific copy.** No lorem-ipsum energy — write like a founder who understands ad creative, not generic AI-startup boilerplate ("Unlock the power of AI").
- Reference bar: this should look closer to Linear, Runway, Ramp, or Arc's marketing sites than to a Bootstrap admin theme.

## SEO requirements

- Server-rendered/static marketing pages (Next.js App Router with proper SSR/SSG) — the marketing site must NOT be a client-only SPA shell.
- Every page: unique `<title>`, meta description, canonical URL, Open Graph + Twitter card images.
- Semantic HTML: one `h1` per page, logical heading hierarchy, descriptive alt text on all images (especially generated ad examples).
- `sitemap.xml` and `robots.txt` generated automatically.
- Structured data (JSON-LD): `Organization`, `SoftwareApplication` or `Product`, `FAQPage` on relevant pages, `BreadcrumbList` where applicable.
- Core Web Vitals matter: lazy-load below-the-fold video/images, optimize with `next/image`, avoid layout shift, keep JS bundle lean on marketing routes.
- Target landing pages for key search intent: "AI UGC ads", "AI product commercial generator", "AI ad generator for [platform]" — build dedicated SEO landing pages, not just one homepage.
- Fast page loads on marketing routes are part of the design bar, not just a technical checkbox — a slow hero video kills both SEO and the premium feel.

## Tech stack

- **Frontend/marketing**: Next.js (App Router), TypeScript, Tailwind CSS
- **Auth**: Clerk or Supabase Auth
- **Database**: Postgres (Supabase or Neon) — users, subscriptions, projects, generation jobs, credit ledger
- **Storage**: Cloudflare R2 or AWS S3 for uploaded product images and rendered videos
- **Payments**: Stripe (subscriptions + metered credits)
- **Job orchestration**: Inngest or Trigger.dev for async, long-running generation pipelines (video gen takes minutes, not milliseconds)
- **AI APIs** (server-side only, never exposed to client):
  - Anthropic Claude — script/storyboard/creative generation
  - Video generation provider (Runway / Kling / Luma / Veo — TBD per cost/quality)
  - UGC avatar provider (HeyGen / Creatify / Arcads — TBD)
  - ElevenLabs — voice/TTS
  - Shotstack or Creatomate — programmatic video assembly/captioning
- **Hosting**: Vercel (app) + a separate worker service (Railway/Fly.io) if generation jobs exceed serverless time limits

## Architecture conventions

- Marketing site and authenticated app dashboard are both in this repo but treated as distinct concerns: marketing routes optimize for SEO/conversion, app routes optimize for product UX.
- All third-party AI API calls happen server-side (API routes / server actions), never from the client. API keys live in environment variables only.
- Each AI provider integration is an isolated module behind a common interface (e.g., `lib/providers/video/*`) — these APIs and pricing change fast, and providers may need to be swapped without touching pipeline logic.
- Generation jobs are tracked in the DB with explicit states (`queued`, `generating`, `rendering`, `complete`, `failed`) — the UI polls or subscribes to job status, never assumes synchronous completion.
- Credit/usage deduction happens atomically with job creation to prevent free generations from race conditions.

## Code conventions

- TypeScript strict mode. No `any` unless justified with a comment.
- Components: small, single-purpose, colocated with their route when route-specific; shared UI in `components/ui`.
- No commented-out code, no placeholder/lorem content left in committed files.
- Prefer server components by default in the marketing site; use client components only where interactivity requires it.
- Write no code comments unless explaining a non-obvious WHY (a provider quirk, a rate-limit workaround, a pricing edge case).

## Definition of done for any page/feature

- Looks intentional at both desktop and mobile widths, light motion included, no generic-template feel.
- Real copy, no placeholder text.
- SEO metadata present (title, description, OG image, structured data where applicable).
- Loading and error states designed, not left as browser defaults — especially for generation jobs which can take minutes.
