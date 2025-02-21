import AWS from 'aws-sdk';

// Set AWS region
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });
const credentials = new AWS.SharedIniFileCredentials({ profile: '562131568493_Dish-AwsSSO-PowerUserAccess' });
AWS.config.credentials = credentials;

// Create DynamoDB client
const ddb = new AWS.DynamoDB.DocumentClient(); // Use DocumentClient for easier JSON handling

export async function getTable(tableName) { //use to get whole table data
  const dynamodb = new AWS.DynamoDB(); // Use raw DynamoDB for table description
  console.log("dynamo db from controller:", dynamodb)
  const params = { TableName: tableName };

  const tableData = await scanTable(tableName)
  return tableData
}

export async function queryTable(tableName, keyConditionExpression, expressionAttributes) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributes,
  };
  return await ddb.query(params).promise();
}

export async function scanTable(tableName) {
  const params = { TableName: tableName };
  return await ddb.scan(params).promise();
}

export async function putItem(tableName, item) {
  const params = { TableName: tableName, Item: item };
  return await ddb.put(params).promise();
}

export async function updateItem(tableName, key, updateExpression, expressionAttributes) {
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributes,
  };
  return await ddb.update(params).promise();
}

export async function deleteItem(tableName, key) {
  const params = { TableName: tableName, Key: key };
  return await ddb.delete(params).promise();
}
