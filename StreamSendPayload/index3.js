const AWS = require('aws-sdk');
const axios = require('axios');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// const dynamodb = new AWS.DynamoDB();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

// const WEB_SERVICE_URL = 'https://webhook.site/f6479d8d-25fc-41be-b1f4-cae8b069fa52'; // Correct URL.
const WEB_SERVICE_URL = 'http://localhost:8001/receive'; /* 'http://[::1]:8001/receive'; 'http://127.0.0.1:8001/receive'; 'http://192.168.1.127:8001/receive'; */
// const WEB_SERVICE_URL = 'https://webhook.site/042c5334-23f3-492f-8eaf-42945e4e8f7b'; //Incorrect URL to simulate error.
const DLQ_QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/618528366220/SquareupDLQ';
const FUNCTION_NAME = 'sendSquareupPayload_v1';
const MAX_RETRY_COUNT = 2;
const RETRY_DELAY_MS = 10000; // 10 seconds

exports.handler = async (event) => {
    for (const record of event.Records) {
        const streamPayload = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        let procfee = 'processing_fee';
        if ((streamPayload.data?.object?.payment?.status === 'COMPLETED' && streamPayload.data?.object?.payment?.hasOwnProperty(procfee)) || (streamPayload.data?.object?.refund?.status === 'COMPLETED' && streamPayload.data?.object?.refund?.hasOwnProperty(procfee))) {
            try {
                
                const response = await axios.post(WEB_SERVICE_URL, streamPayload);
                if (response.status === 200) {
                    console.log('It should not write anything to the DLQ');
                    // Web service call successful, delete the record from DynamoDB
                    // await dynamodb.deleteItem({
                    //     TableName: 'YourTableName',
                    //     Key: {
                    //         'primaryKey': { S: streamPayload.primaryKey } // Adjust the primary key field
                    //     }
                    // }).promise();
                }
            } catch (error) {
                console.error('Web service call failed:', error);
                if (record.retryCount < MAX_RETRY_COUNT) {
                    await delay(RETRY_DELAY_MS);
                    await retryLambda(record);
                } else {
                    await sendToDLQ(record);
                }
            }
        } //end if
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