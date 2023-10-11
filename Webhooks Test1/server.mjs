import * as http from 'http';
import { WebhooksHelper } from 'square';

// The URL where event notifications are sent.
const NOTIFICATION_URL = 'https://example.com/webhook';
// const NOTIFICATION_URL = 'https://webhook.site/042c5334-23f3-492f-8eaf-42945e4e8f7a';

// The signature key defined for the subscription.
const SIGNATURE_KEY = 'asdf1234';
// const SIGNATURE_KEY = 'mBt8dfWrK6tuBBEs1ivk2Q';

// isFromSquare generates a signature from the url and body and compares it to the Square signature header.
function isFromSquare(signature, body) {
  return WebhooksHelper.isValidWebhookEventSignature(
      body,
      signature,
      SIGNATURE_KEY,
      NOTIFICATION_URL
    );
}

function requestHandler(request, response) {
  let body = '';
  request.setEncoding('utf8');

  request.on('data', function(chunk) {
    body += chunk;
  });

  request.on('end', function() {
    const signature = request.headers['x-square-hmacsha256-signature'];
    if (isFromSquare(signature, body)) {
      // Signature is valid. Return 200 OK.
      response.writeHead(200);
      console.info("Request body: " + body);
    } else {
      // Signature is invalid. Return 403 Forbidden.
      response.writeHead(403);
    }
    response.end();
  });
}

// Start a simple server for local testing.
// Different frameworks may provide the raw request body in other ways.
// INSTRUCTIONS
// 1. Run the server:
//    node server.js
// 2. Send the following request from a separate terminal:
//    curl -vX POST localhost:8000 -d '{"hello":"world"}' -H "X-Square-HmacSha256-Signature: 2kRE5qRU2tR+tBGlDwMEw2avJ7QM4ikPYD/PJ3bd9Og="
const server = http.createServer(requestHandler);
server.listen(8000);
