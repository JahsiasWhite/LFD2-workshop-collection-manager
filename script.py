#!/usr/bin/env python3
"""
Fetches recent workshop items and uploads them in a PostgreSQL database stored with Supabase.
"""

import os
import time
import argparse
import logging
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client


# -------------------------------------------------------------------
# Logging configuration
# -------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# -------------------------------------------------------------------
# Database setup
# -------------------------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# -------------------------------------------------------------------
# Steam Workshop API fetcher
# -------------------------------------------------------------------
def get_workshop_items(app_id: str, api_key: str, days: int = 1, single_request: bool = False):
    """
    Fetch Steam Workshop items created in the last `days`.
    """
    base_url = "https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/"
    cutoff_time = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    items = []
    cursor = "*"
    request_count = 0

    while True:
        params = {
            "key": api_key,
            "query_type": 1,  # RankedByPublicationDate
            "page": 1,
            "numperpage": 100,
            "creator_appid": "563",
            "appid": app_id,
            "return_metadata": 1,
            "return_details": 1,
            "cursor": cursor,
            "return_tags": 1,
        }

        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            logging.error(f"Failed to fetch data: {e}")
            break

        details = data.get("response", {}).get("publishedfiledetails", [])
        if not details:
            break

        stop_fetching = False
        for item in details:
            created = int(item.get("time_created", 0))
            if created < cutoff_time:
                if (created == 0):
                    logging.warning(f"Item {item.get('publishedfileid')} has invalid creation time, skipping for now")
                    continue
                stop_fetching = True
                break

            items.append({
                "id": item['publishedfileid'],
                "title": item.get("title", "No Title"),
                "url": f"https://steamcommunity.com/sharedfiles/filedetails/?id={item['publishedfileid']}",
                "description": item.get("file_description", ""),
                "time_created": datetime.fromtimestamp(created).isoformat(),
                "subscriptions": item.get("subscriptions", 0),
                "favorited": item.get("favorited", 0),
                "file_size": int(item.get("file_size", 0) or 0),
                "preview_url": item.get("preview_url", ""),
                "tags": [tag.get("tag", "") for tag in item.get("tags", [])],
                "type": item.get("file_type", 0),
                "creator": item.get("creator", ""),
                "views": item.get("views", 0),
            })

        request_count += 1
        logging.info(f"Fetched {len(items)} items so far...")

        if single_request or stop_fetching or "next_cursor" not in data.get("response", {}):
            break

        cursor = data["response"]["next_cursor"]
        if not cursor or cursor == "*":
            break

        time.sleep(.1)  # Respect API rate limits

    return items


# -------------------------------------------------------------------
# Save items to database
# -------------------------------------------------------------------
def save_to_supabase(items, batch_size=500):
    if not items:
        logging.info("No items to save.")
        return

    total = len(items)
    inserted = 0
    start_time = time.perf_counter()

    logging.info(f"Starting bulk upsert of {total} items in batches of {batch_size}...")

    for i in range(0, total, batch_size):
        chunk = items[i:i + batch_size]
        
        try:
            response = supabase.table("workshop_items").upsert(
                chunk,
                on_conflict="id"
            ).execute()

            if response.data:
                count = len(response.data)
                inserted += count
                logging.info(f"Batch batch_num: upserted {count} items ({inserted}/{total})")
            else:
                logging.warning(f"Batch batch_num: empty response (may already exist or skipped)")


        except Exception as e:
            logging.error(f"Batch {i//batch_size + 1} exception: {e}")

        time.sleep(0.5)  # avoid rate limits

    end_time = time.perf_counter()
    logging.info(f"Finished inserting {inserted}/{total} items in {end_time - start_time:.2f}s.")

# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Fetch Steam Workshop items and save to SQL")
    parser.add_argument("--single", action="store_true", help="Run only a single request")
    parser.add_argument("--days", type=int, default=2, help="Fetch items created in the last N days")
    args = parser.parse_args()

    app_id = os.getenv("STEAM_APP_ID", "550")
    api_key = os.getenv("STEAM_API_KEY")

    if not api_key:
        logging.error("STEAM_API_KEY environment variable is required.")
        return

    start_time = time.perf_counter()  # start timer
 
    logging.info(f"Fetching workshop items for app {app_id} from the last {args.days} day(s)...")
    items = get_workshop_items(app_id, api_key, days=args.days, single_request=args.single)

    if not items:
        logging.info("No new items found.")
        return

    save_to_supabase(items)
    
    end_time = time.perf_counter()  # end timer
    duration = end_time - start_time
    logging.info(f"Finished. Total items fetched: {len(items)}")
    logging.info(f"Total time taken: {duration:.2f} seconds")


if __name__ == "__main__":
    main()
