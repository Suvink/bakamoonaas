# Bakamoonaas 🦉

A browser extension for scheduling downloads.

## Installation

### From Source
1. Clone or download this repository and navigate to the extension folder
```bash
git clone https://gitub.com/suvink/bakamoonaas.git && cd bakamoonaas
```
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your browser toolbar

If your browser does not support having the package manager inside source files, run the following command to generate the `dist` folder:
```bash
npm run build
```
if you don't have `npm` installed, run the script manually:
```bash
chmod +x scripts/build.js && node scripts/build.js
```
After running the script, you can load the `dist` folder instead of the source folder in step 4.

## Usage

1. Start a download in your browser and pause it
2. Click the Bakamoonaas extension icon
3. Find your paused download and click "Schedule"
4. Set your desired start and end times
5. The extension will automatically manage your download

## Development

### Prerequisites
- A Chromium based browser with developer mode enabled

### Local Development
1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test your changes

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you find this extension helpful, consider supporting me!
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/suvink)

---

Made with ♥️ by [Suvink](https://suvin.me)
