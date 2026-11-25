# ExploreEase Phase 2 – ML API Integration

## Added API endpoints

- `GET /api/v1/recommendations/food?city=Hyderabad&preferences=biryani`
- `GET /api/v1/recommendations/transport?city=Hyderabad&starting_point=A&destination=B&currency=INR`
- `GET /api/v1/analytics/popularity?city=Hyderabad&limit=10`
- `GET /api/v1/analytics/reviews?city=Hyderabad`

The endpoints call the existing `ml.new_features` modules. They return an empty result and an explanatory message when the source data needed by an algorithm is unavailable. They do not invent ratings, reviews, or transport fares.

## Run

From the `backend` folder:

```cmd
run.bat
```

Open `http://127.0.0.1:8000/docs` and look for the four endpoint groups above.

## Current dataset limitation

The current CSVs contain food names but blank price fields; transport fares and review files contain headers but no submitted records. Therefore those endpoints may correctly return empty results until verified data is added. Popularity ranking also requires rating and review-count columns that are not currently present in the processed places dataset.
