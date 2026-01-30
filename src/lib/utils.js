export function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(",")[1]);
  // separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  // write the bytes of the string to an ArrayBuffer
  const arrayBuffer = new ArrayBuffer(byteString.length);
  let _ia = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    _ia[i] = byteString.charCodeAt(i);
  }
  const dataView = new DataView(arrayBuffer);
  const blob = new Blob([dataView], {
    type: mimeString,
  });
  return blob;
}

export function getBase64ImagePromise(imgURL) {
  return new Promise((resolve) => {
    let mimeType = "image/jpeg";
    // if (imgURL.endsWith('gif')) {
    //   mimeType = 'image/gif';
    // }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    let dataURL;
    img.src = imgURL;
    img.crossOrigin = "anonymous";
    img.onerror = (err) => {
      console.warn("Error fetching image: " + JSON.stringify(err));
      resolve([imgURL, imgURL]);
    };
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        dataURL = canvas.toDataURL(mimeType, 0.9);
        resolve([imgURL, dataURL]);
      } catch (e) {
        resolve(["", dataURL]);
      }
    };
  });
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
