const fs = require('fs');
const path = require('path');

// When Next.js builds with `output: "standalone"`, run the standalone server
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

process.env.PORT = process.env.PORT || '3001';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else {
  // Fallback to Next.js programmatic server
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');

  const dev = process.env.NODE_ENV !== 'production';
  const hostname = '0.0.0.0';
  const port = parseInt(process.env.PORT || '3001', 10);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  });
}
