const { DynamoDB } = require('aws-sdk');
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
  };

  try {
    const body = JSON.parse(event.body);
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

    // Verificar que el planeta existe
    const getParams = {
      TableName: TABLE_NAME,
      Key: { id: planetId }
    };

    const existing = await dynamoDB.get(getParams).promise();

    if (!existing.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Planeta no encontrado' })
      };
    }

    // Actualizar el planeta (mantener created_at original)
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...existing.Item,
        ...body,
        id: planetId, // Asegurar que el ID no cambie
        created_at: existing.Item.created_at, // Mantener fecha de creación original
        updated_at: new Date().toISOString()
      }
    };

    await dynamoDB.put(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(params.Item)
    };
  } catch (error) {
    console.error('Error updating planet:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al actualizar planeta' })
    };
  }
};