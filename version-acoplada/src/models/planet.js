// src/models/Planet.js
const { v4: uuidv4 } = require('uuid');

class Planet {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.type = data.type;
    this.diameter_km = data.diameter_km;
    this.distance_from_sun_km = data.distance_from_sun_km;
    this.description = data.description || '';
    this.has_rings = data.has_rings || false;
    this.number_of_moons = data.number_of_moons || 0;
    this.discovered_year = data.discovered_year || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  // Validar datos del planeta
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('El nombre es requerido');
    }

    if (!['terrestre', 'gaseoso', 'enano'].includes(this.type)) {
      errors.push('El tipo debe ser: terrestre, gaseoso o enano');
    }

    if (!this.diameter_km || this.diameter_km <= 0) {
      errors.push('El diámetro debe ser mayor a 0');
    }

    if (!this.distance_from_sun_km || this.distance_from_sun_km <= 0) {
      errors.push('La distancia al sol debe ser mayor a 0');
    }

    if (this.number_of_moons < 0) {
      errors.push('El número de lunas no puede ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Convertir a objeto plano para DynamoDB
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      diameter_km: this.diameter_km,
      distance_from_sun_km: this.distance_from_sun_km,
      description: this.description,
      has_rings: this.has_rings,
      number_of_moons: this.number_of_moons,
      discovered_year: this.discovered_year,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Planet;