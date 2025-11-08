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
    
    // Obtener el ID desde los path parameters
    const planetId = event.pathParameters?.id;

    if (!planetId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID de planeta no proporcionado' })
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { id: planetId }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Planeta no encontrado' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error getting planet:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al obtener planeta' })
    };
  }
};