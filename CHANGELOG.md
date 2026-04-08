# Changelog

All notable changes to the TagSpaces Web Clipper browser extension are documented in this file.

## [4.1.6] - 2026-04-08

### Added

- Minimal support for Brave browser
- Option to disable embedding images as data URLs in HTML and MD files
- Clear tags button, extract tags from page, embed meta in Markdown frontmatter
- i18n for the options page
- New E2E tests and a nightly build for GitHub Actions

### Fixed

- Sandboxing iframe for the preview
- E2E tests by adding xvfb-run
- Nightly builds, migration to Node 22

### Changed

- Marked the tag extraction as experimental feature
- Removed redundant `<all_urls>` from host_permissions
- Updated translations with the latest changes

## [4.1.5] - 2026-04-03

- Maintenance release

## [4.1.4] - 2026-03-31

### Added

- Initial implementatio for Safari web extension

### Changed

- Updated libraries
- Added web store descriptions
- Corrected German translations
- Added missing translations in all languages

## [4.1.3] - 2026-03-23

### Changed

- Updated translations
- Removed 3 obsolete languages and their translation files
- Updated DOMPurify version

## [4.1.2] - 2026-03-06

### Added

- E2E tests based on Playwright
- Unit tests
- Markdown extraction functionality

### Fixed

- Saving HTML pages with UTF-8 header by default

### Changed

- Replaced innerHTML with innerText for i18n
- Code optimizations

## [4.1.1] - 2026-02-04

### Changed

- Improved datetime formatting function
- Fixed issue with width of SVGs
- Added functionality for extracting the image with highest resolution from srcsets

## [4.1.0] - 2026-02-02

### Added

- Dedicated button for screenshotting whole page
- Function for offcanvas base64 image generation
- Alert on errors
- Code for removing sticky headers while taking fullscreen screenshot

### Fixed

- Wrong PDF file name on Firefox

### Changed

- CSS adjustments
- Updated libraries
- Considering browser limitations for taking screenshots

## [4.0.9] - 2026-01-30

### Added

- Function for screenshotting the whole webpage

### Fixed

- Capturing full page to consider device pixel ratio (DPR)

### Changed

- Refactored strings and code cleanup
- Updated libraries to latest versions
- Removed option for enabling Open Location Code

## [4.0.8] - 2025-04-14

### Fixed

- UI glitch

### Changed

- Updated libraries
- Updated translations

## [4.0.7] - 2025-01-07

### Fixed

- Incorrect CSS injection

### Changed

- Corrected the outputted HTML
- Removed save selection as HTML functionality
- Fixed UTF-8 recognition
- Updated README with badges

## [4.0.6] - 2024-07-11

### Fixed

- Issues with parsing images and links

## [4.0.5] - 2024-07-10

### Fixed

- Issue with embedding images and correcting relative links

## [4.0.4] - 2024-06-18

### Changed

- Improved handling of images with srcset
- Improved logo in dark mode

## [4.0.3] - 2024-05-07

### Changed

- Removed yarn.lock

## [4.0.2] - 2024-05-02

### Fixed

- Issue with extracting geo codes

### Changed

- Separated manifests for Chrome and Firefox extensions

## [4.0.1] - 2024-04-29

- Maintenance release

## [4.0.0] - 2024-04-29

### Added

- Dark mode support
- Bootstrap 5 design with Bootstrap Icons
- Readability integration for cleaner article extraction
- German language translations

### Changed

- **Breaking**: Migrated to Manifest V3
- Migrated from jQuery to vanilla JavaScript
- Migrated to Bootstrap 5
- Updated DOMPurify
- Adjustments for Firefox needed for the Manifest V3 migration
- Migrated get selection from page functionality
