const axios = require('axios')
const ACCESS_TOKEN = 'EAAAEHKAsSJJiUxDE5UMH-gJ1rJSeMy6GLepVWXUFNtetd6lesnfL0AkJOP2Rfpz'
const SQUARE_VERSION = '2023-10-18'
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
// const SQUARE_VERSION = process.env.SQUARE_VERSION;
const ORDER_ID = 'eJnsTIa2aAPKjkcOJjZDUyMF'
let url = 'https://connect.squareupsandbox.com/v2/orders/'
// url = url.concat(ORDER_ID)
const AUTHORIZATION = 'Bearer '.concat(ACCESS_TOKEN);
// ord_num = 'eJnsTIa2aAPKjkcOJjZDUyMF';
post_endpoint_url = 'https://webhook.site/f6479d8d-25fc-41be-b1f4-cae8b069fa52'

getOrder(ORDER_ID)
  .then(getResponse => {
    if (getResponse.status === 200) {
      // Process the data when the status is 200
	const postData = getResponse.data
      	axios.post(post_endpoint_url, postData)
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

async function getOrder(ORDER_ID) {
    const headers = {
        'Square-Version': SQUARE_VERSION,
        'Authorization': AUTHORIZATION,
        'Content-Type': 'application/json',
    }

    url = url.concat(ORDER_ID)
    let getResponse

    try{
        getResponse = await axios.get(url, { headers })
    } catch (err) {
        console.log(err.message)
    }
    return getResponse;
	// return getResponse.data;
}