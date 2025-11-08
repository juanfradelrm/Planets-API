// src/routes/planetRoutes.js
const express = require('express');
const router = express.Router();
const planetController = require('../controllers/planetController');

router.post('/planets', planetController.createPlanet);
router.get('/planets', planetController.getAllPlanets);
router.get('/planets/:id', planetController.getPlanetById);
router.put('/planets/:id', planetController.updatePlanet);
router.delete('/planets/:id', planetController.deletePlanet);

module.exports = router;
