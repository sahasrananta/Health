import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { config } from './config.js';

// Uses Google Cloud Vision-style REST API when GOOGLE_VISION_API_KEY is set.
// If not configured, returns null so the caller can fall back gracefully.
export function ocrIsEnabled() {
  return Boolean(process.env.GOOGLE_VISION_API_KEY);
}

export function extractTextFromImage(filePath) {
  return new Promise((resolve) => {
    if (!ocrIsEnabled()) {
      return resolve(null);
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    const endpoint =
      process.env.GOOGLE_VISION_ENDPOINT ||
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    let imageBytes;
    try {
      imageBytes = fs.readFileSync(path.resolve(filePath)).toString('base64');
    } catch {
      return resolve(null);
    }

    const body = JSON.stringify({
      requests: [
        {
          image: { content: imageBytes },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
        }
      ]
    });

    const url = new URL(endpoint);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text =
            json?.responses?.[0]?.fullTextAnnotation?.text ||
            json?.responses?.[0]?.textAnnotations?.[0]?.description ||
            null;
          resolve(text || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

