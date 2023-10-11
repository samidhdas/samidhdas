const AWS = require("aws-sdk");

exports.handler = async (event) => {
  // TODO implement
  const records = event.Records;

    for (const record of records) {

      const payload = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      console.log('Payload: ', JSON.stringify(payload));}

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};