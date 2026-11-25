"""Unified ExploreEase dataset access.

Prefer populated SQL tables when available; fall back to the repository CSVs
for local development and first-run deployments. Missing files/tables return an
empty DataFrame rather than crashing unrelated API endpoints.
"""
from pathlib import Path
import logging
import pandas as pd
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import engine

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[3]
PROCESSED = ROOT / "data" / "processed"
RAW = ROOT / "data" / "raw"


def _csv(path: Path, required: list[str]) -> pd.DataFrame:
    try:
        if not path.exists():
            logger.warning("ExploreEase dataset missing: %s", path)
            return pd.DataFrame(columns=required)
        df = pd.read_csv(path)
        for col in required:
            if col not in df.columns:
                df[col] = None
        return df
    except Exception:
        logger.exception("Could not read dataset %s", path)
        return pd.DataFrame(columns=required)


def _table_or_csv(table: str, query: str, path: Path, required: list[str]) -> pd.DataFrame:
    try:
        inspector = inspect(engine)
        if table in inspector.get_table_names():
            with engine.connect() as connection:
                result = pd.read_sql_query(text(query), connection)
            if not result.empty:
                return result
    except (SQLAlchemyError, OSError):
        logger.info("Database table %s unavailable; using CSV fallback", table, exc_info=True)
    except Exception:
        logger.info("Could not inspect/read %s; using CSV fallback", table, exc_info=True)
    return _csv(path, required)


def places() -> pd.DataFrame:
    cols = ["City", "Place_Name", "Category", "Latitude", "Longitude", "OSM_ID"]
    return _table_or_csv("tourist_places", '''SELECT city AS "City", place_name AS "Place_Name", category AS "Category", latitude AS "Latitude", longitude AS "Longitude", osm_id AS "OSM_ID" FROM tourist_places ORDER BY city, place_name''', PROCESSED / "tourist_places.csv", cols)


def restaurants() -> pd.DataFrame:
    cols = ["City", "Restaurant_Name", "Category", "Cuisine", "Latitude", "Longitude", "OSM_ID"]
    return _table_or_csv("restaurants", '''SELECT city AS "City", restaurant_name AS "Restaurant_Name", category AS "Category", cuisine AS "Cuisine", latitude AS "Latitude", longitude AS "Longitude", osm_id AS "OSM_ID" FROM restaurants ORDER BY city, restaurant_name''', PROCESSED / "restaurants.csv", cols)


def costs() -> pd.DataFrame:
    cols = ["City", "Place_Name", "Entry_Fee", "Currency", "Source", "Last_Updated", "Verification_Status"]
    return _table_or_csv("place_costs", '''SELECT city AS "City", place_name AS "Place_Name", entry_fee AS "Entry_Fee", currency AS "Currency", source AS "Source", last_updated AS "Last_Updated", verification_status AS "Verification_Status" FROM place_costs ORDER BY city, place_name''', RAW / "place_costs.csv", cols)


def foods() -> pd.DataFrame:
    cols = ["City", "Food_Name", "Description", "Approx_Price", "Currency", "Restaurant_Name", "Restaurant_ID", "Source", "Last_Updated", "Verification_Status", "Country", "Latitude", "Longitude"]
    return _table_or_csv("local_food", '''SELECT city AS "City", food_name AS "Food_Name", description AS "Description", approx_price AS "Approx_Price", currency AS "Currency", restaurant_name AS "Restaurant_Name", restaurant_id AS "Restaurant_ID", source AS "Source", last_updated AS "Last_Updated", verification_status AS "Verification_Status", country AS "Country", latitude AS "Latitude", longitude AS "Longitude" FROM local_food ORDER BY city, food_name''', RAW / "local_food.csv", cols)


def records(df: pd.DataFrame) -> list[dict]:
    if df is None or df.empty:
        return []
    clean = df.astype(object).where(pd.notna(df), None)
    return clean.to_dict(orient="records")
