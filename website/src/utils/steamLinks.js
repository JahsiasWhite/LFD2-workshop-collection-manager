const L4D2_APP_ID = 550;

export function getWorkshopBrowserUrl(workshopId) {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`;
}

export function getWorkshopSteamUrl(workshopId) {
  return `steam://url/CommunityFilePage/${workshopId}`;
}

export function getCollectionEditorBrowserUrl(collectionId) {
  if (collectionId) {
    return `https://steamcommunity.com/workshop/editcollection/?appid=${L4D2_APP_ID}&id=${collectionId}`;
  }
  return `https://steamcommunity.com/sharedfiles/editcollection/?appid=${L4D2_APP_ID}`;
}

// openurl must not be URL-encoded, and nested https:// breaks in <a href>,
// so collection editor links are opened via click handler instead.
export function openSteamCommunityPage(browserUrl) {
  window.location.assign(`steam://openurl/${browserUrl}`);
}
