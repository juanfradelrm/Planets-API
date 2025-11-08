const { DynamoDB } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
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

    // Validación básica
    if (!body.name || !body.type || !body.diameter_km || !body.distance_from_sun_km) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan campos requeridos: name, type, diameter_km, distance_from_sun_km' })
      };
    }

    // Generar ID único automáticamente
    const planetId = uuidv4();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: planetId,
        name: body.name,
        type: body.type,
        diameter_km: body.diameter_km,
        distance_from_sun_km: body.distance_from_sun_km,
        description: body.description || '',
        has_rings: body.has_rings || false,
        number_of_moons: body.number_of_moons || 0,
        discovered_year: body.discovered_year || null,
        created_at: new Date().toISOString()
      }
    };

    await dynamoDB.put(params).promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(params.Item)
    };
  } catch (error) {
    console.error('Error creating planet:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error al crear planeta' })
    };
  }
};