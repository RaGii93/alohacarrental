# Deployment Profiles

This project now keeps two separate content tracks so rental customer sites and SaaS/system sites do not get mixed.

## Default live profile

- Public metadata profile: `rental`
- FAQ profile: `rental`

These defaults are set in [lib/deployment-profiles.ts](/Users/ragii93/Documents/EndlessEdgeTechnologyServices/edge-rent-golden/lib/deployment-profiles.ts).

## Available profiles

- Public metadata: `rental`, `saas`
- FAQ content: `rental`, `system`

## Where the reusable content lives

- Metadata copy and keywords: [lib/public-metadata-profiles.ts](/Users/ragii93/Documents/EndlessEdgeTechnologyServices/edge-rent-golden/lib/public-metadata-profiles.ts)
- FAQ datasets and assistant copy: [lib/faq.ts](/Users/ragii93/Documents/EndlessEdgeTechnologyServices/edge-rent-golden/lib/faq.ts)

## How to switch for a future deployment

1. Open [lib/deployment-profiles.ts](/Users/ragii93/Documents/EndlessEdgeTechnologyServices/edge-rent-golden/lib/deployment-profiles.ts)
2. Change `DEFAULT_PUBLIC_PROFILE` from `rental` to `saas`
3. Change `DEFAULT_FAQ_PROFILE` from `rental` to `system`
4. Build and verify the public pages

## Recommended usage

- Rental agency deployment: keep `rental` + `rental`
- SaaS/system deployment: use `saas` + `system`

This keeps upgrades safer because the profile choice is centralized instead of being scattered across page files.
