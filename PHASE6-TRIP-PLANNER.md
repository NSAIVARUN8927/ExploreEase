# ExploreEase Phase 6 – Trip Planner and Budget Management

This phase improves the existing planner UI without inventing prices or booking availability.

- Day-wise grouping of suggested itinerary stops.
- Total budget, verified entry-fee total, and remaining-after-known-fees summary.
- Daily planning allowance (budget divided by trip duration), clearly labelled as an allowance, not a price quote.
- Save-trip loading and success feedback.
- Clear disclosure that unverified food, transport and accommodation costs are excluded.

The existing `/api/v1/trips/plan` and authenticated `/api/v1/trips/save` APIs are reused.
