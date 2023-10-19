const axios = require('axios')
const ACCESS_TOKEN = 'EAAAEHKAsSJJiUxDE5UMH-gJ1rJSeMy6GLepVWXUFNtetd6lesnfL0AkJOP2Rfpz'
const SQUARE_VERSION = '2023-10-18'
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
// const SQUARE_VERSION = process.env.SQUARE_VERSION;
const ORDER_ID = 'eJnsTIa2aAPKjkcOJjZDUyMF'
let url = 'https://connect.squareupsandbox.com/v2/orders/'
url = url.concat(ORDER_ID)
const AUTHORIZATION = 'Bearer '.concat(ACCESS_TOKEN);

getOrder().then((response) => console.log(JSON.stringify(response)))

async function getOrder() {
    const headers = {
        'Square-Version': SQUARE_VERSION,
        'Authorization': AUTHORIZATION,
        'Content-Type': 'application/json',
    }
    let response
    try{
        response = await axios.get(url, { headers })
        // console.log(JSON.stringify(response.data))
        // console.log(response.body)
    } catch (err) {
        console.log(err.message)
    }
    return response.data;
}