import express from 'express';
import compression from 'compression';
import rp from 'request-promise-native';
import serveIndex from 'serve-index';
import commonmark from 'commonmark';


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
app.get('/sw-toolbox.js.map', (req, res) => {
  res.sendFile(__dirname + '/node_modules/sw-toolbox/sw-toolbox.js.map');
});

app.get('/*.md', async (req, res, next) => {
  const input = await new Promise((resolve, reject) => fs.readFile(__dirname + req.url, 'utf8', (err, data) => { err ? reject(err) : resolve(data); }));
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer({safe: true});
  const result = writer.render(reader.parse(input));
  const projectName = process.env.PROJECT_NAME || undefined;
  
  res.set('Content-Type', 'text/html');
          
  res.send(await HTML.string`<!doctype html>
<html>
<head>
<title>${req.url}</title>
<meta charset="utf-8" />
<link rel="icon" href="/assets/icon.png">
<style>
body {
  font-family: sans-serif;
  max-width: 640px;
  margin: 32px;
}
.edit-link {
  position: absolute;
  padding: 16px;
  background: #EEE;
  top: 0;
  right: 0;
  border-left: 1px solid #DDD;
  border-bottom: 1px solid #DDD;
}
</style>
</head>
<body>
${projectName && HTML`
  <div class="edit-link"><a href="https://glitch.com/edit/#!/${projectName}?path=${req.url.slice(1)}">edit on Glitch</a></div>
`}
<main>
  ${HTML(result)}
</main>
</body>
</html>`);
});

app.get('/favicon.ico', (req, res) => { res.status(404); res.end(); });

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
let bodyCache = {};
app.use(async (req, res) => {
  const index = await new Promise((resolve, reject) => fs.readFile(__dirname + '/src/index.html', 'utf8', (err, data) => { err ? reject(err) : resolve(data); }));
  res.set('Content-Type', 'text/html');

  const [gamesSlug, runnerSlug] = req.url.slice(1).split(/\//g);
  const gameSlugs = gamesSlug.split(/\+/g).filter(Boolean);

  let body = '';
  if (bodyCache[req.path]) {
    body = bodyCache[req.path];
  } else {
    try {
      body = await HTML.string`<div>
        ${new Header({currentHost: req.get('host'), currentProject: process.env.PROJECT_NAME})}
        ${gamesSlug ? new BestsReport({gameSlugs, runnerSlug, currentHost: req.get('host')}) : undefined}
        ${new Footer()}
      </div>`;
      bodyCache[req.path] = body;
    } catch (error) {
      body = await HTML.string`<div>
        ${new Header({currentHost: req.get('host'), currentProject: process.env.PROJECT_NAME})}
        ${new BestsReport({gameSlugs, runnerSlug, currentHost: req.get('host')})}
        ${new Footer()}
      </div>`;
      body = await HTML.string`<pre>${error}\n${error.stack}</pre>`;
    }
  }
  return res.send(index
                  .replace('unloaded', 'loaded')
                  .replace('</main>', body + '</main>'));
});

// Serve index for unknown URLs so it can route them client-side.
app.use((req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
