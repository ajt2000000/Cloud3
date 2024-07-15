import { createProxyMiddleware } from 'http-proxy-middleware';
import fetch from 'node-fetch';
import useragent from 'useragent';

export default async function handler(req, res) {
  const targetUrl = req.body.url || req.query.url;
  const agent = useragent.parse(req.headers['user-agent']);
  
  if (!agent.family.includes('Firefox')) {
    res.status(400).json({ error: 'This proxy only supports access from Firefox.' });
    return;
  }

  if (req.method === 'POST' || req.method === 'GET') {
    try {
      const targetRes = await fetch(targetUrl, {
        method: req.method,
        headers: req.headers
      });

      if (targetRes.headers.get('content-type') && targetRes.headers.get('content-type').includes('text/html')) {
        const html = await targetRes.text();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        targetRes.headers.forEach((value, name) => {
          res.setHeader(name, value);
        });
        targetRes.body.pipe(res);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch the target URL.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}
