# Planets API

## Descripción general

**Planets API** es una aplicación desarrollada como parte de la práctica **“Diseño de Aplicaciones en la Nube”** de la asignatura **Computación en la Nube**.  
El objetivo del proyecto es diseñar, desplegar y comparar dos arquitecturas distintas en Amazon Web Services (AWS) que implementan una **API RESTful** para la gestión de información sobre planetas.

La API permite realizar operaciones **CRUD (Create, Read, Update, Delete)** sobre datos de planetas almacenados en **Amazon DynamoDB**, siguiendo las mejores prácticas de diseño REST.

---

## Objetivos del proyecto

1. Implementar una API REST completa sobre una entidad de negocio (planetas).  
2. Diseñar y desplegar dos arquitecturas diferentes:
   - **Arquitectura Acoplada:** basada en contenedores ECS Fargate.  
   - **Arquitectura Desacoplada:** basada en funciones AWS Lambda.  
3. Utilizar servicios gestionados de AWS para base de datos, computación y gestión de APIs.  
4. Implementar **Infraestructura como Código (IaC)** mediante AWS CloudFormation.  
5. Analizar y comparar el coste y rendimiento de ambas arquitecturas.

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|-----------|-------------|
| **POST** | `/planets` | Crear un nuevo planeta |
| **GET** | `/planets/{id}` | Obtener un planeta por su ID |
| **GET** | `/planets` | Listar todos los planetas |
| **PUT** | `/planets/{id}` | Actualizar un planeta existente |
| **DELETE** | `/planets/{id}` | Eliminar un planeta del sistema |

La autenticación se realiza mediante **API Keys** configuradas en **Amazon API Gateway**, y la API soporta **CORS** para permitir el acceso desde aplicaciones web externas.

---

## Arquitecturas implementadas

### 1. Arquitectura Acoplada (ECS Fargate)

- Aplicación **Express.js** empaquetada en una imagen **Docker**.
- Despliegue en **Amazon ECS Fargate**.
- Comunicación a través de **Amazon API Gateway** (HTTP Proxy Integration).
- Base de datos **Amazon DynamoDB** compartida.
- Infraestructura desplegada mediante **CloudFormation**.

**Ventajas:**
- Desarrollo y debugging más sencillos.
- Latencia constante sin *cold starts*.

**Desventajas:**
- Costes fijos independientemente del tráfico.
- Punto único de fallo.

---

### 2. Arquitectura Desacoplada (AWS Lambda)

- Cinco funciones Lambda independientes, una por operación CRUD.
- Cada función empaquetada como imagen Docker en **ECR**.
- Integración directa con **API Gateway** (AWS Proxy Integration).
- Base de datos compartida en **DynamoDB**.
- Infraestructura gestionada mediante **CloudFormation**.

**Ventajas:**
- Escalabilidad independiente por función.
- Pago solo por ejecución.
- Alta resiliencia.

**Desventajas:**
- Mayor complejidad operativa.
- Posibles *cold starts* en funciones poco usadas.

---

## Infraestructura como Código

Toda la infraestructura está definida mediante **AWS CloudFormation**:

- `shared/dynamodb.yml`: crea la tabla `planets-shared`.  
- `version-acoplada/main.yml`: despliega la arquitectura basada en ECS Fargate.  
- `version-desacoplada/lambdas.yml`: despliega las funciones Lambda y API Gateway.  

### Scripts de automatización
- `shared/deploy-dynamodb.py`: despliega la base de datos compartida.  
- `version-acoplada/deploy-acoplada.py`: automatiza el despliegue ECS.  
- `version-desacoplada/deploy-desacoplada.py`: automatiza el despliegue Lambda y frontend S3.

---

## Tecnologías utilizadas

| Componente | Servicio / Tecnología |
|-------------|-----------------------|
| Base de datos | Amazon DynamoDB |
| Contenedores | Amazon ECS Fargate |
| Funciones serverless | AWS Lambda |
| Registro de imágenes | Amazon ECR |
| API Management | Amazon API Gateway |
| IaC | AWS CloudFormation |
| Logging | Amazon CloudWatch |
| Lenguajes | Node.js, Python |
| Infraestructura Docker | Docker |

---

## Despliegue

### Prerrequisitos

- **AWS CLI 2.x**  
- **Docker 20.x**  
- **Python 3.8+**  
- **Git 2.x**  
- Credenciales AWS con permisos para CloudFormation, DynamoDB, ECR, ECS, Lambda, API Gateway, S3 e IAM.

---

### Despliegue de la arquitectura acoplada

```bash
cd shared/
python3 deploy-dynamodb.py

cd ../version-acoplada/
python3 deploy-acoplada.py
```

Una vez finalizado, se mostrará la URL de la API y la API Key generada.

---

### Despliegue de la arquitectura desacoplada

```bash
cd shared/
python3 deploy-dynamodb.py

cd ../version-desacoplada/
# Editar el nombre del bucket S3 en el script antes de ejecutar
python3 deploy-desacoplada.py
```

El script desplegará las cinco funciones Lambda, el API Gateway y el frontend en S3.

---

## Análisis de costes

| Escenario | Arquitectura ECS | Arquitectura Lambda | Ahorro (%) |
|------------|------------------|----------------------|-------------|
| Bajo (100K req/mes) | $30.27 | $0.52 | 98.3% |
| Medio (1M req/mes) | $42.84 | $4.88 | 88.6% |
| Alto (10M req/mes) | $111.74 | $48.68 | 56.4% |

**Conclusión:**  
La arquitectura **desacoplada (Lambda)** ofrece una reducción de costes significativa (hasta 98%), siendo ideal para tráfico variable o impredecible.  
La arquitectura **acoplada (ECS)** resulta más rentable para cargas constantes y predecibles.

---

## Autor

**Juan Francisco Del Rosario Machín**  
_Proyecto desarrollado el 10 de noviembre de 2025 para la asignatura “Computación en la Nube”._
