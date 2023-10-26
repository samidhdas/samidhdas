const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

require('dotenv').config(); // Loads .env file
// const WEB_SERVICE_URL = 'https://webhook.site/f6479d8d-25fc-41be-b1f4-cae8b069fa52';
const WEB_SERVICE_URL = 'http://totoprod:8080/receive';
const MAX_RETRIES = 0;
const RETRY_DELAY_MS = 1000; // 1 second

app.post('/receive', async (req, res) => {
  try {
    const payload = req.body; //delete line on success
    let retryCount = 0;
    while (retryCount <= MAX_RETRIES) {
      try {
        const response = await axios.post(WEB_SERVICE_URL, payload);
        //console.log(payload) //delete line on success
        //console.log('response.status: ' + response.status);
        if (response.status === 200) {
          // If the response is successful, send a successful status back
          return res.status(200).json({ status: 'success' });
        } else {
          // If the response is an error, retry or send an error status after max retries
          retryCount++;
          if (retryCount <= MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS);
          } else {
            return res.status(500).json({ status: 'error', message: 'Max retries reached' });
          }
        }
      } catch (error) {
        // Handle network errors or timeouts
        console.log('error: ' + error);
        console.log('retryCount: '+ retryCount);
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        } else {
          return res.status(500).json({ status: 'error', message: 'Max retries reached' });
        }
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const port = process.env.PORT_DEV || 8001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});