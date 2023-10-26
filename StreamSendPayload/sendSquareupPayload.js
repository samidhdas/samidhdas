// Tried to use below code to emit 3 Webhook payloads (invoice.payment_made, payment.updated, and orders) from AWS Lambda function sendSquareupPayload_v1.
// But it is not emitting the orders payload at all.
const AWS = require('aws-sdk');
const axios = require('axios');

// const dynamodb = new AWS.DynamoDB();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const SQUARE_VERSION = process.env.SQUARE_VERSION;
const WEB_SERVICE_URL = process.env.WEB_SERVICE_URL;
const DLQ_QUEUE_URL = process.env.DLQ_QUEUE_URL;
const FUNCTION_NAME = process.env.FUNCTION_NAME;
const MAX_RETRY_COUNT = process.env.MAX_RETRY_COUNT;
const RETRY_DELAY_MS = process.env.RETRY_DELAY_MS; // 10 seconds
const url = process.env.URL;
const AUTHORIZATION = 'Bearer '.concat(ACCESS_TOKEN);
// let postResponse = {status: 'success', message: 'Order payload was Posted successfully', data: '200'};
// const WEB_SERVICE_URL = 'https://webhook.site/f6479d8d-25fc-41be-b1f4-cae8b069fa52';
// const WEB_SERVICE_URL = 'https://totosquarepay.com/receive';     uncomment after webhook test
// const DLQ_QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/618528366220/SquareupDLQ';
// const FUNCTION_NAME = 'sendSquareupPayload_v1';
// const MAX_RETRY_COUNT = 2;
// const RETRY_DELAY_MS = 10000; // 10 seconds

exports.handler = async (event) => {
    for (const record of event.Records) {
        const streamPayload = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        let procfee = 'processing_fee';  //uncomment after webhook test
        if ((streamPayload.data?.object?.payment?.status === 'COMPLETED' && streamPayload.data?.object?.payment?.hasOwnProperty(procfee)) || (streamPayload.data?.object?.refund?.status === 'COMPLETED' && streamPayload.data?.object?.refund?.hasOwnProperty(procfee)) || (streamPayload.data?.object?.invoice?.status === 'PAID' && streamPayload.type === 'invoice.payment_made')) {
            try {
                const response = await axios.post(WEB_SERVICE_URL, streamPayload);
                if (response.status === 200) {
                    console.log('It should now get Order details and write those records to the WEB_SERVICE_URL');
                    // Process the Order if it is a Payment record
                    let refmoney = 'refunded_money';
                    if ((streamPayload.type) === 'payment.updated' && !(streamPayload.data.object.payment.hasOwnProperty(refmoney))) {
                        const ORDER_ID = streamPayload.data?.object?.payment?.order_id;
                        console.log('ORDER_ID: ' + ORDER_ID);
                        await getOrder(ORDER_ID)
                          .then(getResponse => {
                            if (getResponse.status === 200) {
                                // Process the data when the status is 200
                        	   // const postData = getResponse.data;
                        	   // postOrder(postData);
                        	    const postData = JSON.stringify(getResponse.data);
                        	    console.log('postData right before the POST: ' + postData);
                        	    /* try { //Write a POST function for Order records
                        	        postOrder(postData);
                        	       // const postResponse = await axios.post(WEB_SERVICE_URL, postData);
                        	        console.log('postResponse from after the function call: ' + postResponse);
                        	        console.log('postResponse.data from after the function call: ' + postResponse.data);
                        	        console.log('postResponse.status from after the function call: ' + postResponse.status);
                        	        if (postResponse.status === 200) {
                                        console.log('POST request successful. Order#:', ORDER_ID);      // postData.order.id
                                	  } else {
                                	    console.log('POST request Unsuccessful. Order#:', ORDER_ID);    // postData.order.id
                                	   // await sendToDLQ(postData);
                                	  }
                        	    } catch (postError) {
                        	            console.error('Error making POST request:', postError);
                        	            console.log('POST request Unsuccessful. Order#:', ORDER_ID);    // postData.order.id
                        	    } */
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
                            //   console.log('GET request Unsuccessful. Order#:', ORDER_ID);               // getResponse.data.order.id
                            }
                          })
                          .catch(error => {
                            console.error('Error: There was an error doing the GET request', error);
                            // console.log('GET request Unsuccessful. Order#:', ORDER_ID);                 // getResponse.data.order.id
                          });
                    }
                    // Web service call successful, delete the record from DynamoDB
                    // await dynamodb.deleteItem({
                    //     TableName: 'YourTableName',
                    //     Key: {
                    //         'primaryKey': { S: streamPayload.primaryKey } // Adjust the primary key field
                    //     }
                    // }).promise();
                } else {
                    console.log('response.status: ' + response.status);
                    console.log('It is inside try block else section: record.retryCount: ' + record.retryCount);
                }
            } catch (error) {
                console.error('Web service call failed:', error);
                console.log('It is inside catch block: record.retryCount: ' + record.retryCount);
                if (record.retryCount < MAX_RETRY_COUNT) {
                    await delay(RETRY_DELAY_MS);
                    await retryLambda(record);
                } else {
                    await sendToDLQ(record);
                }
            }
        } //end if  uncomment after webhook test
    }
};

async function retryLambda(record) {
    await lambda.invoke({
        // FunctionName: 'sendSquareupPayload_v1',
        FunctionName: FUNCTION_NAME,
        InvocationType: 'Event', // Asynchronous invocation
        Payload: JSON.stringify({ record })
    }).promise();
}

async function sendToDLQ(record) {
    // const queueUrl = 'YourSQSQueueUrl';
    const payload = JSON.stringify(record);
    await sqs.sendMessage({
        QueueUrl: DLQ_QUEUE_URL,
        MessageBody: payload
    }).promise();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrder(ORDER_ID) {
    const headers = {
        'Square-Version': SQUARE_VERSION,
        'Authorization': AUTHORIZATION,
        'Content-Type': 'application/json',
    };

    // url = url.concat(ORDER_ID);
    let squareURL = url.concat(ORDER_ID);
    console.log('URL: ' + url);
    console.log('squareURL: ' + squareURL);
    let getResponse;

    try{
        getResponse = await axios.get(squareURL, { headers });
    } catch (err) {
        console.log(err.message);
    }
    return getResponse;
	// return getResponse.data;
}

/* async function postOrder(postData) {

    // let postResponse;

    try{
        postResponse = await axios.post(WEB_SERVICE_URL, postData);
        console.log('postResponse from postOrder() function: ' + postResponse);
        console.log('postResponse.data from postOrder() function: ' + postResponse.data);
        console.log('postResponse.status from postOrder() function: ' + postResponse.status);
    } catch (err) {
        console.log(err.message);
        console.log('POST request Unsuccessful at postOrder() function. Order#:', postData.order.id);    // postData.order.id
    }
    return postResponse;
} */