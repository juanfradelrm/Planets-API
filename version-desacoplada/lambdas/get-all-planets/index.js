const { DynamoDB } = require('aws-sdk');
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
  };

  try {
    const dynamoDB = new DynamoDB.DocumentClient();

    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();
    let planets = result.Items || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(planets)
    };
  } catch (error) {
    console.error('Error getting planets:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al obtener planetas' })
    };
  }
};