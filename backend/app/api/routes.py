from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import pandas as pd

from app.db.database import get_db
from app.models.user import User, SavedPlace, SavedTrip
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, PasswordChangeRequest
from app.schemas.travel import TripPlanRequest, ReviewAnalysisRequest, SavedPlaceCreate, SaveTripRequest, ProfileUpdateRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.api.dependencies import get_current_user
from app.services import data_service

router = APIRouter()

@router.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(full_name=payload.full_name.strip(), email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(str(user.id)), "user": user}

@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(str(user.id)), "user": user}

@router.get("/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user

@router.get("/meta/cities")
def get_cities():
    df = data_service.places()
    if df.empty or "City" not in df:
        return {"cities": []}
    return {"cities": sorted(df["City"].dropna().astype(str).unique().tolist())}

@router.get("/places")
def get_places(city: Optional[str] = None, category: Optional[str] = None, search: Optional[str] = None,
              limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    df = data_service.places()
    if city and not df.empty:
        df = df[df.City.astype(str).str.casefold() == city.casefold()]
    if category and not df.empty:
        df = df[df.Category.astype(str).str.casefold() == category.casefold()]
    if search and not df.empty:
        df = df[df.Place_Name.astype(str).str.contains(search, case=False, na=False)]
    total = len(df)
    return {"total": total, "items": data_service.records(df.iloc[offset:offset + limit])}

@router.get("/places/categories")
def get_place_categories(city: Optional[str] = None):
    df = data_service.places()
    if city and not df.empty:
        df = df[df.City.astype(str).str.casefold() == city.casefold()]
    values = sorted(df.Category.dropna().astype(str).unique().tolist()) if not df.empty else []
    return {"categories": values}

@router.get("/restaurants")
def get_restaurants(city: Optional[str] = None, cuisine: Optional[str] = None, search: Optional[str] = None,
                   limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    df = data_service.restaurants()
    if city and not df.empty:
        df = df[df.City.astype(str).str.casefold() == city.casefold()]
    if cuisine and not df.empty:
        df = df[df.Cuisine.astype(str).str.contains(cuisine, case=False, na=False)]
    if search and not df.empty:
        df = df[df.Restaurant_Name.astype(str).str.contains(search, case=False, na=False)]
    total = len(df)
    return {"total": total, "items": data_service.records(df.iloc[offset:offset + limit])}

@router.get("/recommendations/places")
def recommend_places(city: str, interests: list[str] = Query(default=[]), limit: int = Query(10, ge=1, le=50)):
    df = data_service.places()
    if df.empty:
        return {"items": [], "message": "Place dataset is unavailable"}
    df = df[df.City.astype(str).str.casefold() == city.casefold()].copy()
    if df.empty:
        return {"items": [], "message": f"No stored places found for {city}. Try a city covered by the dataset."}
    # The repository's recommendation engine is used where available; absent rating/review fields
    # are not fabricated and are explicitly reflected in the recommendation reason.
    try:
        from ml.new_features.recommendation_engine import recommend_places as engine
        ranked = engine(df, interests=interests, limit=limit)
    except Exception:
        ranked = df.head(limit).copy()
        ranked["Recommendation_Score"] = None
        ranked["Recommendation_Reason"] = "Based on available OpenStreetMap location data; ratings/reviews are unavailable."
    return {"items": data_service.records(ranked)}

@router.get("/food")
def get_food(city: Optional[str] = None):
    df = data_service.foods()
    if city and not df.empty:
        df = df[df.City.astype(str).str.casefold() == city.casefold()]
    return {"items": data_service.records(df), "note": "Prices are shown only when verified data exists; missing prices are not treated as zero."}

@router.post("/reviews/analyze")
def analyze_reviews(payload: ReviewAnalysisRequest):
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        results = []
        for review in payload.reviews:
            score = analyzer.polarity_scores(review)
            label = "positive" if score["compound"] >= 0.05 else "negative" if score["compound"] <= -0.05 else "neutral"
            results.append({"review": review, "sentiment": label, "scores": score})
        return {"count": len(results), "results": results, "notice": "Analysis is based only on the review text supplied in this request."}
    except ImportError:
        raise HTTPException(status_code=503, detail="Install backend requirements to enable VADER sentiment analysis")

@router.post("/trips/plan")
def plan_trip(payload: TripPlanRequest):
    df = data_service.places()
    if df.empty:
        raise HTTPException(status_code=503, detail="Tourist place dataset is unavailable")
    selected = df[df.City.astype(str).str.casefold() == payload.city.casefold()].copy()
    if selected.empty:
        raise HTTPException(status_code=404, detail=f"No places found for {payload.city} in the current dataset")
    if payload.interests:
        mask = selected.Category.astype(str).str.casefold().apply(lambda c: any(i.casefold() in c for i in payload.interests))
        matched = selected[mask]
        if not matched.empty:
            selected = matched
    if payload.start_latitude is not None and payload.start_longitude is not None:
        try:
            from ml.new_features.smart_trip_planner import create_itinerary
            itinerary = create_itinerary(selected, payload.start_latitude, payload.start_longitude)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Itinerary generation failed: {exc}")
    else:
        itinerary = selected.head(payload.max_places).copy()
        itinerary["Visit_Order"] = range(1, len(itinerary) + 1)
    itinerary = itinerary.head(payload.max_places)
    costs = data_service.costs()
    cost_note = "Entry fees are estimates only where a verified matching record exists. Food and transport costs are not included unless verified data is available."
    items = data_service.records(itinerary)
    for item in items:
        item["Entry_Fee"] = None
        item["Entry_Fee_Currency"] = None
        if not costs.empty:
            match = costs[(costs.City.astype(str).str.casefold() == payload.city.casefold()) &
                          (costs.Place_Name.astype(str).str.casefold() == str(item.get("Place_Name", "")).casefold()) &
                          (costs.Verification_Status.astype(str).str.casefold() == "verified")]
            if not match.empty:
                item["Entry_Fee"] = float(match.iloc[0].Entry_Fee)
                item["Entry_Fee_Currency"] = match.iloc[0].Currency
    verified_entry_total = sum(float(item["Entry_Fee"]) for item in items if item.get("Entry_Fee") is not None)
    known_fees = sum(1 for item in items if item.get("Entry_Fee") is not None)
    remaining = round(payload.budget - verified_entry_total, 2)
    return {"city": payload.city, "budget": payload.budget, "currency": payload.currency.upper(), "days": payload.days,
            "itinerary": items, "verified_entry_fee_total": round(verified_entry_total, 2),
            "remaining_after_known_entry_fees": remaining,
            "average_daily_budget": round(payload.budget / payload.days, 2),
            "budget_status": ("Over budget based on verified entry fees only" if remaining < 0 else "Within budget for known entry fees; food and transport are not included"),
            "priced_places": known_fees, "total_places": len(items), "cost_note": cost_note}

@router.post("/saved-places", status_code=201)
def save_place(payload: SavedPlaceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.place_name
    city = payload.city
    osm_id = payload.osm_id
    if osm_id and db.query(SavedPlace).filter_by(user_id=user.id, osm_id=str(osm_id)).first():
        raise HTTPException(status_code=409, detail="This place is already saved")
    saved = SavedPlace(user_id=user.id, place_name=name, city=city, category=payload.category,
                       latitude=str(payload.latitude) if payload.latitude is not None else None,
                       longitude=str(payload.longitude) if payload.longitude is not None else None,
                       osm_id=str(osm_id) if osm_id else None)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return {"id": saved.id, "place_name": saved.place_name, "city": saved.city}

@router.get("/saved-places")
def list_saved_places(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(SavedPlace).filter_by(user_id=user.id).order_by(SavedPlace.created_at.desc()).all()
    return {"items": [{"id": r.id, "place_name": r.place_name, "city": r.city, "category": r.category,
                       "latitude": r.latitude, "longitude": r.longitude, "osm_id": r.osm_id} for r in rows]}

@router.delete("/saved-places/{saved_id}")
def delete_saved_place(saved_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(SavedPlace).filter_by(id=saved_id, user_id=user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Saved place not found")
    db.delete(row)
    db.commit()
    return {"message": "Saved place removed"}


@router.get("/recommendations/food")
def recommend_food(city: str, preferences: list[str] = Query(default=[]), limit: int = Query(10, ge=1, le=50)):
    foods = data_service.foods()
    if foods.empty:
        return {"items": [], "message": "Food dataset is unavailable"}
    try:
        from ml.new_features.food_recommendation import recommend_food as engine
        ranked = engine(foods, preferences=preferences, city=city, limit=limit)
        return {"items": data_service.records(ranked), "notice": "Only stored food information is returned; unverified prices remain unverified."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Food recommendation failed: {exc}")


@router.get("/recommendations/transport")
def recommend_transport(city: str, starting_point: str, destination: str,
                        country: Optional[str] = None, currency: Optional[str] = None):
    from pathlib import Path
    fares_path = data_service.RAW / "transport_fares.csv"
    if not fares_path.exists():
        return {"items": [], "message": "Transport fare dataset is unavailable"}
    try:
        fares = pd.read_csv(fares_path)
        from ml.new_features.transport_recommendation import recommend_transport as engine
        options = engine(fares, city, starting_point, destination, country, currency)
        return {"items": data_service.records(options),
                "notice": "Only verified fares are returned. No fare is estimated or invented."}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transport recommendation failed: {exc}")


@router.get("/analytics/popularity")
def popularity(city: Optional[str] = None, limit: int = Query(10, ge=1, le=50)):
    df = data_service.places()
    if city and not df.empty:
        df = df[df.City.astype(str).str.casefold() == city.casefold()].copy()
    try:
        from ml.new_features.popularity_analysis import get_trending_places
        ranked = get_trending_places(df, limit=limit)
        if ranked.empty:
            return {"items": [], "message": "Popularity cannot be calculated: the place dataset has no verified rating and review-count fields."}
        return {"items": data_service.records(ranked)}
    except ValueError as exc:
        return {"items": [], "message": str(exc)}


@router.get("/analytics/reviews")
def review_analytics(city: Optional[str] = None):
    reviews_path = data_service.RAW / "place_reviews.csv"
    if not reviews_path.exists():
        return {"items": [], "message": "Review dataset is unavailable"}
    reviews = pd.read_csv(reviews_path)
    if city and "City" in reviews.columns:
        reviews = reviews[reviews.City.astype(str).str.casefold() == city.casefold()].copy()
    if reviews.empty or "Review_Text" not in reviews.columns:
        return {"items": [], "message": "No review text is currently available for analysis."}
    try:
        from ml.new_features.review_analysis import analyze_reviews, get_review_summary
        analyzed = analyze_reviews(reviews)
        summary = get_review_summary(analyzed)
        return {"items": data_service.records(summary),
                "notice": "Analysis uses only reviews present in the local dataset."}
    except ImportError:
        raise HTTPException(status_code=503, detail="Install ml requirements to enable review analysis")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/trips/save", status_code=201)
def save_trip(payload: SaveTripRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = SavedTrip(user_id=user.id, title=payload.title, city=payload.city, days=payload.days,
                     budget=payload.budget, currency=payload.currency.upper(), itinerary=payload.itinerary)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"id": trip.id, "title": trip.title, "city": trip.city, "message": "Trip saved successfully"}


@router.get("/trips/saved")
def list_saved_trips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(SavedTrip).filter_by(user_id=user.id).order_by(SavedTrip.created_at.desc()).all()
    return {"items": [{"id": t.id, "title": t.title, "city": t.city, "days": t.days,
                       "budget": t.budget, "currency": t.currency, "itinerary": t.itinerary,
                       "created_at": t.created_at.isoformat()} for t in trips]}


@router.delete("/trips/saved/{trip_id}")
def delete_saved_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(SavedTrip).filter_by(id=trip_id, user_id=user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Saved trip not found")
    db.delete(trip)
    db.commit()
    return {"message": "Saved trip deleted"}


@router.patch("/auth/profile", response_model=UserResponse)
def update_profile(payload: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.full_name = payload.full_name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.patch("/auth/password")
def change_password(payload: PasswordChangeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
