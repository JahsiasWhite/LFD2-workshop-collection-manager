import requests
import time
import json
import argparse
from datetime import datetime

def get_workshop_items(app_id, api_key, single_request=True):
    base_url = "https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/"
    items = []
    cursor = "*"
    request_count = 0

    while True:
    # for x in range(1):
        params = {
            "key": api_key,
            "query_type": 1, # 1 == return all items for a specific app ID
            "page": 1, # Start at the first page
            "numperpage": 100, # 100 Is max allowed by api :(
            "creator_appid": app_id,
            "appid": app_id,
            "return_metadata": 1, # When set to 1, it tells the API to return metadata about the items (like title, description, etc.)
            "return_details": 1, # When set to 1, it requests additional details about the items
            "cursor": cursor # This is used for pagination. It's a string that tells the API where to start fetching results. The initial value "*" means start from the beginning. In subsequent requests, we use the "next_cursor" value from the previous response.
        }

        response = requests.get(base_url, params=params)
        data = response.json()

        if "response" not in data or "publishedfiledetails" not in data["response"]:
            break

        for item in data["response"]["publishedfiledetails"]:
            item_details = {
                "id": item['publishedfileid'],
                "title": item.get("title", "No Title"),
                "url": f"https://steamcommunity.com/sharedfiles/filedetails/?id={item['publishedfileid']}",
                "description": item.get("file_description", ""),
                "time_created": datetime.fromtimestamp(item.get("time_created", 0)).isoformat(),
                "subscriptions": item.get("subscriptions", 0),
                "favorited": item.get("favorited", 0),
                "file_size": item.get("file_size", 0),
                "preview_url": item.get("preview_url", ""),
                "tags": [tag.get("tag", "") for tag in item.get("tags", [])],
                "type": item.get("file_type", 0),
                "creator": item.get("creator", ""),
                "views": item.get("views", 0),
            }
            
            # Determine if it's a texture mod (this is a simple check, you might need to refine it)
            # item_details["is_texture_mod"] = any("texture" in tag.lower() for tag in item_details["tags"])

            items.append(item_details)

        request_count += 1
        print(f"Fetched {len(items)} items so far...")

        if single_request or "next_cursor" not in data["response"] or data["response"]["next_cursor"] == cursor:
            break

        cursor = data["response"]["next_cursor"]
        time.sleep(1)  # To avoid hitting rate limits

    return items

def save_to_json(items, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=4)
    print(f"Results saved to {filename}")

def main():
    parser = argparse.ArgumentParser(description="Fetch Steam Workshop items")
    # parser.add_argument("app_id", help="App ID of the game")
    # parser.add_argument("api_key", help="Your Steam Web API key")
    parser.add_argument("--single", action="store_true", help="Run only a single request")
    parser.add_argument("--output", default="workshop_items2.json", help="Output JSON filename")
    args = parser.parse_args()
    
    # Usage
    app_id = "550"  # Replace with the app ID of the game you're interested in
    api_key = "AAAA9B2EF00B0C2A39CD3BAC3EBB5D71"  # Replace with your Steam Web API key

    workshop_items = get_workshop_items(app_id, api_key, args.single)
    # workshop_items = get_workshop_items(args.app_id, args.api_key, args.single)
    save_to_json(workshop_items, args.output)

    print(f"Total items: {len(workshop_items)}")

if __name__ == "__main__":
    main()