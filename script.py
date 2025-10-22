import requests
import time
import json
import argparse
from datetime import datetime

from dotenv import load_dotenv
import os

def get_workshop_items(app_id, api_key, single_request=False):
    base_url = "https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/"
    items = []
    cursor = "*"
    request_count = 0

    while True:
    # for x in range(1):
        
        params = {
            "key": api_key,
            "query_type": 1, # 1 === k_PublishedFileQueryType_RankedByPublicationDate
            "page": 1, # Start at the first page. Max of 1000
            "numperpage": 100, # 100 Is max allowed by api :(
            "creator_appid": "563",
            "appid": app_id,
            "return_metadata": 1, # When set to 1, it tells the API to return metadata about the items (like title, description, etc.)
            "return_details": 1, # When set to 1, it requests additional details about the items
            "cursor": cursor, # This is used for pagination. It's a string that tells the API where to start fetching results. The initial value "*" means start from the beginning. In subsequent requests, we use the "next_cursor" value from the previous response.
            
            # NOT SURE IF THESE WORK
            "requiredtags": "",  # Example: "Weapon,Armor" - Items must have ALL these tags
            # "excludedtags": "",  # Example: "NSFW,Mature" - Exclude items with ANY of these tags
            "match_all_tags": "",  # Example: "1" - Match all tags in requiredtags (use with requiredtags)
            # "required_flags": "",  # Example: "retreivable" - Items must have these flags
            # "omitted_flags": "",  # Example: "hidden" - Exclude items with these flags
            # "search_text": "",  # Example: "sword" - Search for items containing this text
            # "filetype": "",  # Example: "0" for Community item, "1" for Microtransaction item
            # "child_publishedfileid": "",  # Example: "1234567890" - Return only children of this item
            # "days": "",  # Example: "7" - Only return items from the last 7 days
            # "include_recent_votes_only": "",  # Example: "1" - Only use votes from the last 7 days
            # "required_kv_tags": "",  # Example: "{\"key\":\"value\"}" - Required key-value tags
            # "return_vote_data": "",  # Example: "1" - Return vote data for the items
            "return_tags": "",  # Example: "1" - Return tag data for the items
            # "return_kv_tags": "",  # Example: "1" - Return key-value tag data
            # "return_previews": "",  # Example: "1" - Return preview image and video data
            # "return_children": "",  # Example: "1" - Return child item ids
            # "return_short_description": "",  # Example: "1" - Return short descriptions instead of full
            # "return_for_sale_data": "",  # Example: "1" - Return pricing data, if applicable
            # "return_playtime_stats": "",  # Example: "1" - Return playtime stats
            # "strip_description_bbcode": "",  # Example: "1" - Strip BBCode from descriptions
            # "ids_only": ""  # Example: "1" - Return only the PublishedFileIDs of the items found
        }
        
        # if (request_count == 2):
        #     break
        
        response = requests.get(base_url, params=params)
        
        try:
            data = response.json()
        except:
            break

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
            
            # Determine if it's a texture mod 
            # item_details["is_texture_mod"] = any("texture" in tag.lower() for tag in item_details["tags"])

            items.append(item_details)

        request_count += 1
        print(f"Fetched {len(items)} items so far...")

        if single_request or "next_cursor" not in data["response"] or data["response"]["next_cursor"] == cursor:
            break

        cursor = data["response"]["next_cursor"]
        time.sleep(1)  # To avoid hitting rate limits

    return items

def query_single_item(api_key, publishedfileid):
    base_url = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/"
    
    data = {
        "itemcount": 1,
        "publishedfileids[0]": publishedfileid
    }
    
    try:
        response = requests.post(base_url, data=data)
        response.raise_for_status()
        
        result = response.json()
        
        if 'response' in result and 'publishedfiledetails' in result['response']:
            item_details = result['response']['publishedfiledetails'][0]
            
            if item_details.get('result') == 1:  # 1 means success
                print(f"Successfully retrieved item {publishedfileid}")
                return item_details
            else:
                print(f"Failed to retrieve item {publishedfileid}. Result: {item_details.get('result')}")
                return None
        else:
            print("Unexpected response structure:", json.dumps(result, indent=2))
            return None
        
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def save_to_json(items, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=4)
    print(f"Results saved to {filename}")

def main():
    parser = argparse.ArgumentParser(description="Fetch Steam Workshop items")
    # parser.add_argument("app_id", help="App ID of the game")
    # parser.add_argument("api_key", help="Your Steam Web API key")
    parser.add_argument("--single", action="store_true", help="Run only a single request")
    parser.add_argument("--output", default="workshop_items3.json", help="Output JSON filename")
    args = parser.parse_args()
    
    # Usage
    load_dotenv() # Load environment variables from .env file
    
    app_id = "550"  # !REQUIRED Replace with the app ID of the game you're interested in
    api_key = os.getenv("API_KEY")
    creator_app_id = "" # This can be multiple??? So far I've seen: 550, 563

    if api_key == "":
        print("API key is required to fetch workshop items.")
        return

    workshop_items = get_workshop_items(app_id, api_key)#, args.single)
    # workshop_items = query_single_item(api_key, 459208387)
    save_to_json(workshop_items, args.output)

    print(f"Total items: {len(workshop_items)}")

if __name__ == "__main__":
    main()