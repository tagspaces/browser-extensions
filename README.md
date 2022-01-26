# TagSpaces web clipper for Chrome & Firefox

## Downloads

- Google Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tagspaces/ldalmgifdlgpiiadeccbcjojljeanhjk)
- Mozilla Firefox: [Add-ons for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tagspaces/)
- Microsoft Edge: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tagspaces-web-clipper/dinjgbhjngaockabnagbonbfinanjpdn)

## Features

- Saving complete web pages as HTML and MHTML(chrome only) files
- Saving selected part of a web pages as HTML file
- Saving a screenshot of the visible area of the current tab as PNG file
- Saving a bookmark as URL files

## User manual

A user manual and tips are available in the TagSpaces' online [documentation](https://docs.tagspaces.org/web-clipper)

## Known Issues

Issue are tracked in the [issue tracker](https://github.com/tagspaces/browser-extensions/issues) of this GitHub repository

## Development

### Install dependencies

```
yarn install
```

### Build for Development

```
yarn build
```

- Chrome Version: `build/chrome/`
- Firefox Version: `build/firefox/`

To debug in Chrome:

- Go to Window Menu -> Extensions
- Enable developer's mode
- Click on the load unpacked extension and select the folder with the builded

To debug in Firefox:

- Go to Tools Menu ->
- Click on Add-ons ->
- Click the Gear Icon
- Select Debug Add-ons
- Click Load Temporary Add-on

## License

See [LICENSE](./LICENSE)

## Privacy Policy

Available on the TagSpaces' [webpage](https://www.tagspaces.org/legal/privacy-webclipper/)
