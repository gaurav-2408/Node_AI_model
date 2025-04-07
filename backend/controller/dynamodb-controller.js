import AWS from 'aws-sdk';

// Set AWS region and credentials
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });
const credentials = new AWS.SharedIniFileCredentials({ profile: '562131568493_Dish-AwsSSO-PowerUserAccess' });
AWS.config.credentials = credentials;

// Create DynamoDB client
const dynamoDB = new AWS.DynamoDB();
const ddb = new AWS.DynamoDB.DocumentClient();

/**Only Tables related functions */
export async function getTable(tableName) { //use to get whole table data
  const dynamodb = new AWS.DynamoDB(); // Use raw DynamoDB for table description
  //console.log("dynamo db from controller:", dynamodb)
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
  try {
    const params = { TableName: tableName };
    console.log(`Scanning table with params:`, params);
    const result = await ddb.scan(params).promise();
    console.log("result from scan table:")
    return result;
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error);
    throw error;
  }
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

/**Only List of Tables related functions */
export async function listTables() {
  try {
    console.log('Fetching tables list...');
    const data = await dynamoDB.listTables().promise();
    console.log('Tables fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in listTables:', error);
    throw error;
  }
}


