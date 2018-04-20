import express from 'express';
import compression from 'compression';
import rp from 'request-promise-native';
import serveIndex from 'serve-index';


// We don't use this yet, but don't want to break it.
import * as speedrun from '/assets/speedrun.js';
import HTML from '/assets/bester/html.js';


const app = express();

// enable strong etags
app.set('etag', 'strong');

// enable compression
app.use(compression());

// disable json pretty print
app.set('json spaces', null);


// Hard-coded until we have an ES-module-friendly alternative,
// such as https://github.com/tc39/proposal-import-meta
const __dirname = '/app';


// We serve all static files under the public path 'assets/' because that's what speedrun.com
// uses, so by copying that we can avoid clobbering any of their paths we'd like to mirror.

// Serve directory indexes for public/ftp folder (with icons)
app.use('/assets', serveIndex(__dirname + '/src', {
  view: 'details',
  icons: true,
}));
app.use('/assets', express.static(__dirname + '/src', {
  dotfiles: 'ignore',
  index: ['index.html', 'README.md']
}));

// Except for the Service Worker, because it needs to be at the top level. It looks like
// speedrun.com also treats paths ending in .js as static, so this should be safe.
app.get('/service-worker.js', (req, res) => {
  res.sendFile(__dirname + '/service-worker.js');
});
app.get('/service-worker-toolbox.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/sw-toolbox/sw-toolbox.js');
});
app.get('/service-worker-toolbox.js.map', (req, res) => {
  res.sendFile(__dirname + '/node_modules/sw-toolbox/sw-toolbox.js.map');
});

// Crudely mirror and cache speedrun.com/api.
// We never expire/evict values here; we assume the
// process won't live long enough for it to matter.
const apiCache = new Map();
app.get(/^\/(https:\/\/(www\.)?speedrun\.com\/api\/(.*))/, async (req, res) => {
  const url = req.url.slice(1);
  const cached = apiCache.get(url);

  if (cached) {
    return res.send(await cached);
  }

  console.log("GETting", url);
  const result = rp.get(url, {simple: false}).then(JSON.parse);
  apiCache.set(url, result);

  return res.json(await result);
});

import {BestsReport, Header, Footer} from '/assets/components.js';
import fs from 'fs';
app.get('/ssr', async (req, res) => {
  const index = await new Promise((resolve, reject) => fs.readFile(__dirname + '/src/index.html', 'utf8', (err, data) => { err ? reject(err) : resolve(data); }));

  res.set('Content-Type', 'text/html');
  try {
    const body = await HTML.string`
      ${new Header({req.get('host'), currentHost})}
      ${new Footer()}
      ${new BestsReport({gameSlugs: ['wc2'], runnerSlug: 'banks', currentHost: req.get('host')})}
    `;
    return res.send(index
                    .replace('</main>', body + '</main>')
                    .replace('type="module"', 'type="disabled-module"')
                    .replace('class="unloaded"', 'class="loaded"'));
  } catch (error) {
    res.status(500);
    console.log(error);
    return res.json(error);
  }
});

// Serve index for unknown URLs so it can route them client-side.
app.use((req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
