# Colecciones Postman - Planets API

Este paquete contiene colecciones de Postman para probar ambas arquitecturas de Planets API.

## Archivos Incluidos

1. **Planets_API_Coupled.postman_collection.json** - Colección para arquitectura acoplada (ECS Fargate)
2. **Planets_API_Decoupled.postman_collection.json** - Colección para arquitectura desacoplada (Lambda)
3. **Planets_API.postman_environment.json** - Variables de entorno

## Importar en Postman

### Paso 1: Importar las Colecciones
1. Abre Postman
2. Click en **Import** (botón arriba a la izquierda)
3. Arrastra los 3 archivos JSON o usa **Upload Files**
4. Click en **Import**

### Paso 2: Configurar el Environment
1. Click en el selector de entornos 
2. Selecciona **Planets API - Environment**
3. Click en el ícono de editar
4. Actualiza los valores:
   - `coupled_base_url`: URL de tu API Gateway para arquitectura acoplada
   - `decoupled_base_url`: URL de tu API Gateway para arquitectura desacoplada
   - `api_key_coupled`: Tu API Key (si tienes autenticación habilitada)
   - `api_key_decoupled`: Tu API Key (si tienes autenticación habilitada)



## Endpoints Disponibles

### Arquitectura Acoplada (ECS Fargate)
- **GET** `/planets` - Listar todos los planetas
- **GET** `/planets/{id}` - Obtener planeta por ID
- **POST** `/planets` - Crear nuevo planeta
- **PUT** `/planets/{id}` - Actualizar planeta
- **DELETE** `/planets/{id}` - Eliminar planeta

### Arquitectura Desacoplada (Lambda)
- **GET** `/planets` - Listar todos los planetas (Lambda: listPlanets)
- **GET** `/planets/{id}` - Obtener planeta por ID (Lambda: getPlanet)
- **POST** `/planets` - Crear nuevo planeta (Lambda: createPlanet)
- **PUT** `/planets/{id}` - Actualizar planeta (Lambda: updatePlanet)
- **DELETE** `/planets/{id}` - Eliminar planeta (Lambda: deletePlanet)

## Ejemplos de Datos

### Crear Planeta (POST)
```json
{
  "name": "Tierra",
  "type": "terrestre",
  "diameter_km": 12742,
  "distance_from_sun_km": 149597870,
  "description": "El planeta donde se originó la vida conocida.",
  "has_rings": false,
  "number_of_moons": 1,
  "discovered_year": null
}
```

### Actualizar Planeta (PUT)
```json
{
  "name": "Tierra-actualizada",
  "type": "terrestre",
  "diameter_km": 12742,
  "distance_from_sun_km": 149597870,
  "description": "El planeta más habitado por ahora.",
  "has_rings": false,
  "number_of_moons": 2,
  "discovered_year": null
}
```

## Autenticación

Si API requiere autenticación con API Key:
- El header `x-api-key` está configurado en todas las requests
- Usa la variable `{{api_key}}` en el environment
- Si no usas API Key, puedes desactivar este header en cada request

## Flujo de Pruebas Sugerido

1. **List All Planets** - Verifica que la API responde
2. **Get Planet by ID** - Prueba con ID = 1
3. **Create Planet** - Crea un nuevo planeta
4. **List All Planets** - Verifica que el nuevo planeta aparece
5. **Update Planet** - Actualiza el planeta que creaste
6. **Get Planet by ID** - Verifica los cambios
7. **Delete Planet** - Elimina el planeta de prueba
8. **List All Planets** - Confirma la eliminación


## Recursos Adicionales

- [Postman Documentation](https://learning.postman.com/docs)
- [AWS API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
