# chrome-path

> Getting path for chromium / chrome, it returns paths of chromium / chrome installed on your system

## Install

```
$ yarn add @moonandyou/chrome-path

or

$ npm install @moonandyou/chrome-path
```

# Usage

```js
const chromePath = require('chrome-path');

chromePath().then(res => console.log(res));
//=> { 'google-chrome': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome-canary': '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary', chromium: '/Applications/Chromium.app/Contents/MacOS/Chromium' }
```

## License

MIT © [Jimmy Moon](http://ragingwind.me)
