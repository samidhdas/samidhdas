const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

require('dotenv').config(); // Loads .env file

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const SQUARE_VERSION = process.env.SQUARE_VERSION;
const WEB_SERVICE_URL = process.env.WEB_SERVICE_URL;
const MAX_RETRIES = process.env.MAX_RETRIES;
const RETRY_DELAY_MS = process.env.RETRY_DELAY_MS;
let url = process.env.SQUARE_URL;
const AUTHORIZATION = 'Bearer '.concat(ACCESS_TOKEN);
// const WEB_SERVICE_URL = 'https://webhook.site/f6479d8d-25fc-41be-b1f4-cae8b069fa52';
// const WEB_SERVICE_URL = 'http://totoprod:8080/receive';
// const MAX_RETRIES = 0;
// const RETRY_DELAY_MS = 1000; // 1 second
// let url = 'https://connect.squareupsandbox.com/v2/orders/'

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
          // If the response is successful, GET the Order and POST it. Then send a successful status back.

	  let refmoney = 'refunded_money';
          if (payload.type === 'payment.updated' && !(payload.data.object.payment.hasOwnProperty(refmoney))) {
	      //const ORDER_ID = '';
              ORDER_ID = payload.data.object.payment.order_id;
              console.log('ORDER_ID: ' + ORDER_ID);

              await getOrder(ORDER_ID)
                .then(getResponse => {
                  if (getResponse.status === 200) {
                    // Process the data when the status is 200
                      const postData = getResponse.data
                      axios.post(WEB_SERVICE_URL, postData)
                      .then(postResponse => {
                        // Handle the response of the POST request here
                          if (postResponse.status === 200) {
                                console.log('POST request successful:', postResponse.data);
                          }
                      })
                      .catch(postError => {
                          // Handle errors from the POST request
                          console.error('Error making POST request:', postError);
                      });
                  } else {
                    console.log('Error: Status of GET request is not 200');
                  }
                })
                .catch(error => {
                  console.error('Error:', error);
                });
          }

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

async function getOrder(ORDER_ID) {
  const headers = {
      'Square-Version': SQUARE_VERSION,
      'Authorization': AUTHORIZATION,
      'Content-Type': 'application/json',
  }

  let getOrdURL = '';
  getOrdURL = url.concat(ORDER_ID)
  // url = url.concat(ORDER_ID)
  let getResponse

  try{
      getResponse = await axios.get(getOrdURL, { headers })
  } catch (err) {
      console.log(err.message)
  }
  return getResponse;
// return getResponse.data;
}

const port = process.env.PORT_DEV || 8001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});