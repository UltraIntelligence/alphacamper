# Provider Scoring Rubric

Last updated: 2026-05-09

Use this rubric when ranking the next campsite-alert provider systems for Alphacamper.

## Why This Exists

We want to dominate North America, but we should not add providers randomly.

The best next provider is not always the biggest one. The best next provider is the one that gives the strongest customer value for the least risky build, while moving the public story forward.

## Scorecard

Score each provider from 1 to 5 in each category.

| Category | 1 | 3 | 5 |
|---|---|---|---|
| Customer demand | Niche or uncertain | Regionally useful | Obvious high-demand camping market |
| Coverage unlock | A few campgrounds | Dozens of campgrounds | Hundreds or a whole major system |
| Alert feasibility | Unknown or hostile | Possible with research | Clear API/provider pattern |
| Catalog feasibility | Mostly manual | Some structured data | Official directory/API/open data exists |
| Strategic value | Nice-to-have | Helps parity | Changes the public story |
| Build difficulty | High unknowns | Medium adapter work | Similar to an existing adapter |
| Operational risk | High WAF/legal/load risk | Manageable limits | Low-risk official/open data path |
| Marketing value | Little SEO/story value | Good province/state story | Strong landing-page and competitor-parity value |

## Recommended Weighting

Use this weighting for the first roadmap pass:

| Category | Weight |
|---|---:|
| Customer demand | 20% |
| Coverage unlock | 15% |
| Alert feasibility | 20% |
| Catalog feasibility | 10% |
| Strategic value | 15% |
| Build difficulty | 10% |
| Operational risk | 5% |
| Marketing value | 5% |

Interpretation:

- 4.2 to 5.0: build soon.
- 3.4 to 4.1: research now, build after current sprint.
- 2.5 to 3.3: park in backlog.
- Below 2.5: only pursue if customers request it heavily.

## First Provider Hypotheses

These started as hypotheses and were updated after the provider-roadmap window reported back on 2026-05-09.

| Provider / Region | Starting Read | Why It Matters | Likely First Question |
|---|---|---|---|
| Alberta Parks | Build first after catalog gate | Biggest Canadian gap; strong demand; likely new ReserveAmerica/Aspira-style adapter | Can we prove site-level availability and reuse the adapter for Saskatchewan? |
| Saskatchewan Parks | Build second after Alberta proof | Strong Canada parity value and likely similar adapter work | Does the Alberta adapter pattern transfer cleanly? |
| New Brunswick Parks | Atlantic quick win | GoingToCamp-compatible path appears plausible and closes a visible Canada gap | Can worker poll it end to end with notifications? |
| PEI Parks | Add after NB proof | Smaller system, but parity-visible and trust-building | Can we prove provider source and alertability quickly? |
| Quebec / SEPAQ | Research only for now | Very high strategic value, but Cloudflare and French-first UX increase risk | Can we solve access and bilingual product quality without a half-baked launch? |
| Algonquin Highlands | Medium priority | Ontario regional GoingToCamp-style coverage expands depth | Does it matter to enough customers compared with provincial systems? |
| Saugeen Valley | Medium priority | Another Ontario regional GoingToCamp-style system | Same as above; verify demand and adapter similarity |
| Washington State Parks | First US cluster candidate | GoingToCamp-style US provider; good expansion bridge after Canada | Can existing GoingToCamp adapter support it safely? |
| Wisconsin State Parks | US GoingToCamp cluster candidate | Same cluster may unlock multiple US systems | Does it reuse the same browser/session behavior? |
| Michigan State Parks | US Midwest cluster candidate | Same cluster may unlock multiple US systems | Does it reuse enough provider behavior to be fast? |
| Maryland State Parks | US GoingToCamp cluster candidate | Smaller but potentially cheap if cluster works | Add only if adapter reuse is real |
| ReserveCalifornia | Build after Canada core | Huge marketing value, but likely needs UseDirect-style adapter | Is UseDirect-style support worth building after Canada parity? |

## Research Output Format

Each provider-roadmap report should include:

```text
Provider:
Region:
Score:
Recommended action: build now / research next / backlog / skip

Customer value:
Coverage estimate:
Reservation system:
Directory source:
Availability source:
Known API/provider pattern:
WAF/auth/rate-limit risk:
Legal/terms risk:
Localization needs:
Data enrichment opportunities:
Why this should or should not be next:
```

## Control-Tower Recommendation

For the next three weeks, prioritize providers in this order:

1. Providers that use an already-understood pattern.
2. Providers that close public Canadian parity gaps.
3. Providers that unlock many campgrounds at once.
4. Providers that help customers answer, "Where can I realistically get in?"
5. Providers that create strong province/state coverage pages.

Avoid:

- one-off tiny systems unless customers repeatedly request them
- systems that require unsupported auto-booking behavior
- providers where we cannot clearly separate searchable from alertable
- any data source that would require copying a competitor directory
