Client exports
==============

Run `npm ci` and `npm run build` in this directory after source changes. Commit the generated assets/client-tools/export.js bundle. `npm test` checks the integration with the existing calculator.

PDF and ZIP export dependencies load only on demand. The embedded DejaVu font is a subset for Latin, Cyrillic and common symbols; its license is in assets/fonts/LICENSE-DejaVu.txt. Client request data and photos stay in browser memory until the visitor explicitly shares or downloads them. No server or automatic delivery is provided. Calculator pricing is reused without changing price rules.
