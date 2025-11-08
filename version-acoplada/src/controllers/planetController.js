// src/controllers/planetController.js
const Planet = require('../models/planet');
const { dynamoDB, TABLE_NAME } = require('../config/dynamodb');

// Crear un planeta
exports.createPlanet = async (req, res) => {
  try {
    const planet = new Planet(req.body);
    
    // Validar
    const validation = planet.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: validation.errors
      });
    }

    // Guardar en DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: planet.toJSON()
    };

    await dynamoDB.put(params).promise();

    res.status(201).json(planet.toJSON());
  } catch (error) {
    console.error('Error creating planet:', error);
    res.status(500).json({ error: 'Error al crear planeta' });
  }
};

// Obtener todos los planetas
exports.getAllPlanets = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();
    let planets = result.Items || [];

    // Ordenar por distancia al sol (por defecto)
    const sortBy = req.query.sort_by || 'distance';
    
    if (sortBy === 'distance') {
      planets.sort((a, b) => a.distance_from_sun_km - b.distance_from_sun_km);
    } else if (sortBy === 'diameter') {
      planets.sort((a, b) => b.diameter_km - a.diameter_km);
    } else if (sortBy === 'name') {
      planets.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json(planets);
  } catch (error) {
    console.error('Error getting planets:', error);
    res.status(500).json({ error: 'Error al obtener planetas' });
  }
};

// Obtener un planeta por ID
exports.getPlanetById = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: req.params.id
      }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'Planeta no encontrado' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Error getting planet:', error);
    res.status(500).json({ error: 'Error al obtener planeta' });
  }
};

// Actualizar un planeta
exports.updatePlanet = async (req, res) => {
  try {
    // Primero verificar que existe
    const getParams = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    const existing = await dynamoDB.get(getParams).promise();
    if (!existing.Item) {
      return res.status(404).json({ error: 'Planeta no encontrado' });
    }

    // Preparar actualización
    const updates = req.body;
    updates.updated_at = new Date().toISOString();

    // Construir expresión de actualización
    let updateExpression = 'SET ';
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id') { // No actualizar el ID
        const placeholder = `:val${index}`;
        const namePlaceholder = `#attr${index}`;
        
        updateExpression += `${namePlaceholder} = ${placeholder}, `;
        expressionAttributeValues[placeholder] = updates[key];
        expressionAttributeNames[namePlaceholder] = key;
      }
    });

    updateExpression = updateExpression.slice(0, -2); // Quitar última coma

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(updateParams).promise();
    res.json(result.Attributes);
  } catch (error) {
    console.error('Error updating planet:', error);
    res.status(500).json({ error: 'Error al actualizar planeta' });
  }
};

// Eliminar un planeta
exports.deletePlanet = async (req, res) => {
  try {
    // Verificar que existe
    const getParams = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    const existing = await dynamoDB.get(getParams).promise();
    if (!existing.Item) {
      return res.status(404).json({ error: 'Planeta no encontrado' });
    }

    // Eliminar
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    await dynamoDB.delete(deleteParams).promise();

    res.json({
      message: 'Planeta eliminado correctamente',
      id: req.params.id,
      name: existing.Item.name
    });
  } catch (error) {
    console.error('Error deleting planet:', error);
    res.status(500).json({ error: 'Error al eliminar planeta' });
  }
};
