# TagSpaces web clipper for Chrome & Firefox

## Download

* Google Chrome: [Chrome Web Store - TagSpaces](https://chrome.google.com/webstore/detail/tagspaces/ldalmgifdlgpiiadeccbcjojljeanhjk)
* Firefox: [TagSpaces :: Add-ons for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tagspaces/)

## Features

* Saving complete web pages as HTML and MHTML(chrome only) files
* Saving selected part of a web pages as HTML file
* Saving a screenshot of the visible area of the current tab as PNG file
* Saving a bookmark as URL files

## Keyboard Shortcuts (Chrome-only)

You can add keyboard shortuts for opening the web scrapping menu.

1. Open Extensions Page at chrome://extensions/.
2. Scroll to the bottom and click "Keyboard shortcuts"
![](screenshots/keybinding-1.png)
3. Assign Keyboard Shortcuts in the dialog.

![](screenshots/keybinding-2.png)

## Tips and tricks

* Chrome: Enabling the setting 'Ask where to save each file before downloading' in the Downloads section of the Chorme settings, will make you files not be saved automatically in the default downdload folder.

## Known Issues

## Development

### Install dependencies

```
yarn install
```

### Build for Development

```
yarn build
```

* Chrome Version: `build/chrome/`
* Firefox Version: `build/firefox/`

To debug in Chrome: [Window] Menu -> Extensions -> Load unpacked extension

To debug in Firefox: [Tools] Menu -> Add-ons -> [Gear] Icon -> Debug Add-ons -> Load Temporary Add-on

## License

See [LICENSE](./LICENSE)
