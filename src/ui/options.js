import OptionsManager from "../lib/options-manager.js";

let form = document.getElementById("form");

// Saves options to browser.storage.sync.
function save() {
  OptionsManager.save({
    enableScreenshotEmbedding: form.enableScreenshotEmbedding.checked,
    enableOpenLocationCode: form.enableOpenLocationCode.checked
  })
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.
function load() {
  OptionsManager.load().then(items => {
    form.enableScreenshotEmbedding.checked = items.enableScreenshotEmbedding
    form.enableOpenLocationCode.checked = items.enableOpenLocationCode
  })
}

document.addEventListener('DOMContentLoaded', load);
document.getElementById('form').addEventListener('change', save);
