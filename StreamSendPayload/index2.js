const AWS = require('aws-sdk');
const axios = require('axios');

// const dynamoDB = new AWS.DynamoDB.DocumentClient();
 const sqs = new AWS.SQS();

const WEBSERVICE_URL = 'https://webhook.site/042c5334-23f3-492f-8eaf-42945e4e8f7a';
// const WEBSERVICE_URL = 'https://webhook.site/042c5334-23f3-492f-8eaf-42945e4e8f7b'; //Incorrect URL to simulate error.
const DLQ_QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/618528366220/SquareupDLQ';

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      if (record.eventName === 'INSERT') {
        const streamData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        const payload = JSON.stringify(streamData);
        // Make an HTTP POST request to the external web service
        const response = await axios.post(WEBSERVICE_URL, payload);
        
        console.log('Status: '+ response.status);

        if (response.status !== 200) {
          // Web service response indicates an error, send payload to DLQ
          console.log('Did not get 200 OK from remote endpoint');
          await sendToDLQ(JSON.stringify(streamData));
        }
      }
    }
    return 'Successfully processed records.';
  } catch (error) {
    // console.error('Error:', error);
    console.error('Status: ', error.response.status);
    if (error.response.status !== 200) {
      await sendToDLQ(JSON.stringify(error.response.config.data)); // Start Here
    }
    throw error;
  }
};

async function sendToDLQ(payload) {
  const params = {
    QueueUrl: DLQ_QUEUE_URL,
    MessageBody: payload
  };
  await sqs.sendMessage(params).promise();
}