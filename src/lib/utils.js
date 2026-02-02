export async function dataURItoBlobAsync(dataURI) {
  return await (await fetch(dataURI)).blob();
}

export async function getBase64ImagePromise(imgURL) {
  try {
    const response = await fetch(imgURL);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // Returns just the string
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null; // Return null on failure
  }
}

// Helper: Robustly parse srcset and pick the highest resolution URL
export function getHighestResUrl(el, baseUrl) {
  const src = el.getAttribute("src");
  const srcset = el.getAttribute("srcset");
  const candidates = [];

  // 1. Add the fallback src as a baseline (1x)
  if (src) candidates.push({ url: src, value: 1, type: "x" });

  // 2. Parse srcset if it exists
  if (srcset) {
    // Regex handles URLs with commas (often found in CDNs) by looking for the descriptor
    const regex = /([^,\s]+)\s*(?:(\d+)w|(\d+(?:\.\d+)?)x)?/g;
    let match;
    while ((match = regex.exec(srcset)) !== null) {
      const url = match[1];
      const wDesc = match[2] ? parseInt(match[2], 10) : null;
      const xDesc = match[3] ? parseFloat(match[3]) : null;

      if (wDesc) candidates.push({ url, value: wDesc, type: "w" });
      else if (xDesc) candidates.push({ url, value: xDesc, type: "x" });
      else candidates.push({ url, value: 1, type: "x" }); // Default to 1x
    }
  }

  if (candidates.length === 0) return null;

  // 3. Rank candidates: Prioritize 'w' (width) over 'x' (density)
  // If mixed, we treat 1000w as "better" than 2x for clipping purposes
  const best = candidates.reduce((prev, curr) => {
    if (curr.type === "w" && prev.type === "w")
      return curr.value > prev.value ? curr : prev;
    if (curr.type === "w" && prev.type === "x") return curr; // w is usually higher res
    if (curr.type === "x" && prev.type === "w") return prev;
    return curr.value > prev.value ? curr : prev;
  });

  try {
    return new URL(best.url, baseUrl).href;
  } catch (e) {
    return null;
  }
}

export function formatDateTime4Tag(date, includeTime) {
  if (date === undefined || date === "") {
    return "";
  }
  const d = new Date(date);
  let cDate = d.getDate();
  cDate += "";
  if (cDate.length === 1) {
    cDate = "0" + cDate;
  }
  let cMonth = d.getMonth();
  cMonth++;
  cMonth += "";
  if (cMonth.length === 1) {
    cMonth = "0" + cMonth;
  }
  const cYear = d.getFullYear();

  let time = "";
  if (includeTime) {
    let cHour = d.getHours();
    cHour += "";
    if (cHour.length === 1) {
      cHour = "0" + cHour;
    }
    let cMinute = d.getMinutes();
    cMinute += "";
    if (cMinute.length === 1) {
      cMinute = "0" + cMinute;
    }
    let cSecond = d.getSeconds();
    cSecond += "";
    if (cSecond.length === 1) {
      cSecond = "0" + cSecond;
    }
    time = "~" + cHour + "" + cMinute + "" + cSecond;
  }

  return cYear + "" + cMonth + "" + cDate + time;
}

// Geo locations:
// GMaps: https://www.google.de/maps/@48.1401285,11.5732137,15.25z
// GMaps: https://www.google.de/maps/@-20.8096591,-49.3801033,16z
// OpenStreetMap: https://www.openstreetmap.org/#map=17/48.13504/11.59057
// OpenStreetMap: https://www.openstreetmap.org/#map=16/-20.8077/-49.3785
// Here: https://wego.here.com/?map=-20.80625,-49.37421,16,normal
// Bing: no url param
export function extractLatLong(currentUrl, enableOpenLocationCode) {
  // const regex = new RegExp('@(.*),(.*),'); // gmaps only
  const regexGMH = new RegExp("(map=|@)(.*),(.*),"); // gmaps and here
  const regexOSM = new RegExp("\\d/(.*)/(.*)"); // open street map
  if (currentUrl) {
    let lonLatMatch = currentUrl.match(regexGMH);
    let lonLatMatch2 = currentUrl.match(regexOSM);
    let lon;
    let lat;
    if (lonLatMatch && lonLatMatch.length > 1) {
      lon = lonLatMatch[2];
      lat = lonLatMatch[3];
    } else if (lonLatMatch2 && lonLatMatch2.length > 0) {
      lon = lonLatMatch2[1];
      lat = lonLatMatch2[2];
    }
    if (lon && lon.length > 0 && lat && lat.length > 0) {
      let geoTag = "";
      // if (enableOpenLocationCode) {
      try {
        geoTag = OpenLocationCode?.encode(parseFloat(lon), parseFloat(lat));
      } catch (err) {
        console.warn("Error parsing lat long to float");
      }
      // } else {
      //   if (!lat.startsWith("-")) {
      //     lat = "+" + lat;
      //   }
      //   geoTag = lon + lat;
      // }
      const tagsText =
        document.getElementById("tags").value.trim() + " " + geoTag;
      if (tagsText && tagsText.length > 0) {
        document.getElementById("tags").value = tagsText.trim();
      }
    }
  }
}
