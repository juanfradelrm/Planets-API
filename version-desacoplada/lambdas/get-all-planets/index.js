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
    
    // Obtener query parameters para filtros y ordenamiento
    const queryParams = event.queryStringParameters || {};
    const sortBy = queryParams.sort_by || 'distance';
    const typeFilter = queryParams.type;

    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();
    let planets = result.Items || [];

    // Filtrar por tipo si se especifica
    if (typeFilter && typeFilter !== 'all') {
      planets = planets.filter(p => p.type === typeFilter);
    }

    // Ordenar según el criterio
    planets.sort((a, b) => {
      switch (sortBy) {
        case 'diameter':
          return (b.diameter_km || 0) - (a.diameter_km || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'distance':
        default:
          return (a.distance_from_sun_km || 0) - (b.distance_from_sun_km || 0);
      }
    });

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