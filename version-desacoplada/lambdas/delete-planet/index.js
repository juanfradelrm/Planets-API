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

    // Verificar que el planeta existe antes de eliminar
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

    // Eliminar el planeta
    const params = {
      TableName: TABLE_NAME,
      Key: { id: planetId }
    };

    await dynamoDB.delete(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Planeta eliminado correctamente', id: planetId })
    };
  } catch (error) {
    console.error('Error deleting planet:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al eliminar planeta' })
    };
  }
};