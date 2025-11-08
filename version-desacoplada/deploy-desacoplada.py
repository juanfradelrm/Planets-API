#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script: deploy_desacoplada.py
Descripción: Despliega la infraestructura desacoplada de la API de Planetas en AWS
Componentes:
  1. ECR Repository desacoplado
  2. Lambdas + API Gateway REST
  3. Frontend en S3
Requisitos previos:
  - AWS CLI configurado o credenciales en ~/.aws/credentials
  - Docker instalado
  - Permisos de CloudFormation, ECR, Lambda, S3, DynamoDB
"""

import boto3
import subprocess
import sys
import os
import json

REGION = "us-east-1"
STACK_NAME = "planetas-lambdas-api"
TEMPLATE_FILE = "./lambdas.yml"
TABLE_NAME = "planets-shared"

# ECR desacoplado
ECR_STACK = "planets-ecr-repo-desacoplada"
ECR_TEMPLATE = "./ecr.yml"
ECR_OUTPUT_KEY = "RepositoryUri"

LAMBDA_NAMES = ["create-planet", "get-all-planets", "get-planet-by-id", "update-planet", "delete-planet"]
LAMBDA_DIR = "./lambdas"
FRONT_DIR = "./public"
S3_BUCKET = "planetas-front-bucket-juanfran-2025"

cf = boto3.client("cloudformation", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.client("dynamodb", region_name=REGION)

def run(cmd, cwd=None, input=None):
    result = subprocess.run(cmd, shell=True, cwd=cwd, input=input, text=True, capture_output=True)
    if result.returncode != 0:
        print(f"Error ejecutando: {cmd}\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def deploy_stack(name, template, parameters=None):
    with open(template, "r") as f:
        body = f.read()

    try:
        cf.describe_stacks(StackName=name)
        print(f"Actualizando stack {name}...")
        cf.update_stack(
            StackName=name,
            TemplateBody=body,
            Capabilities=["CAPABILITY_NAMED_IAM"],
            Parameters=parameters or []
        )
        waiter = cf.get_waiter('stack_update_complete')
    except cf.exceptions.ClientError as e:
        if "does not exist" in str(e):
            print(f"Creando stack {name}...")
            cf.create_stack(
                StackName=name,
                TemplateBody=body,
                Capabilities=["CAPABILITY_NAMED_IAM"],
                Parameters=parameters or []
            )
            waiter = cf.get_waiter('stack_create_complete')
        elif "No updates are to be performed" in str(e):
            print(f"Stack {name} sin cambios.")
            return
        else:
            print(f"Error: {e}")
            sys.exit(1)

    print("Esperando despliegue...")
    waiter.wait(StackName=name)
    print(f"Stack {name} desplegado.\n")

print("========== DEPLOY LAMBDAS DESACOPLADAS ==========\n")

# Verificar tabla DynamoDB
print(f"Verificando tabla '{TABLE_NAME}'...")
try:
    dynamodb.describe_table(TableName=TABLE_NAME)
    print(f"Tabla encontrada.\n")
except dynamodb.exceptions.ResourceNotFoundException:
    print(f"Error: La tabla '{TABLE_NAME}' no existe.")
    sys.exit(1)

# 1. Desplegar stack ECR desacoplado
deploy_stack(ECR_STACK, ECR_TEMPLATE)

# 2. Obtener URI del repositorio ECR
response = cf.describe_stacks(StackName=ECR_STACK)
repo_uri = next(
    o['OutputValue'] for o in response['Stacks'][0]['Outputs'] if o['OutputKey'] == ECR_OUTPUT_KEY
)
registry = repo_uri.split("/")[0]

# Login en ECR
print("Login en ECR...")
password = run(f"aws ecr get-login-password --region {REGION}")
run(f"docker login --username AWS --password-stdin {registry}", input=password)

# 3. Construir y subir imágenes de Lambdas
print("\nConstruyendo Lambdas...\n")
image_params = []

for name in LAMBDA_NAMES:
    path = os.path.abspath(os.path.join(LAMBDA_DIR, name))
    dockerfile_path = os.path.join(path, "Dockerfile")
    image_tag = f"{repo_uri}:{name}"

    print(f"Lambda: {name}")

    if not os.path.exists(dockerfile_path):
        print(f"   Dockerfile no encontrado\n")
        continue

    run(f"docker buildx build --platform linux/amd64 --provenance=false --output type=docker -t {image_tag} .", cwd=path)
    run(f"docker push {image_tag}")
    print(f"   Subida correctamente\n")

    # Parámetro para stack
    param_key = ''.join(word.capitalize() for word in name.split('-')) + 'Image'
    image_params.append({
        "ParameterKey": param_key,
        "ParameterValue": image_tag
    })

# Añadir parámetros adicionales
image_params.append({"ParameterKey": "TableName", "ParameterValue": TABLE_NAME})
image_params.append({"ParameterKey": "FrontendBucketName", "ParameterValue": S3_BUCKET})

# 4. Desplegar Lambdas + API Gateway
deploy_stack(STACK_NAME, TEMPLATE_FILE, image_params)

# 5. Configurar bucket S3 para frontend
print("Configurando S3...")
try:
    s3.head_bucket(Bucket=S3_BUCKET)
except:
    if REGION == "us-east-1":
        s3.create_bucket(Bucket=S3_BUCKET)
    else:
        s3.create_bucket(
            Bucket=S3_BUCKET,
            CreateBucketConfiguration={"LocationConstraint": REGION}
        )

s3.put_public_access_block(
    Bucket=S3_BUCKET,
    PublicAccessBlockConfiguration={
        "BlockPublicAcls": False,
        "IgnorePublicAcls": False,
        "BlockPublicPolicy": False,
        "RestrictPublicBuckets": False
    }
)

s3.put_bucket_website(
    Bucket=S3_BUCKET,
    WebsiteConfiguration={
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }
)

policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{S3_BUCKET}/*"]
        }
    ]
}
s3.put_bucket_policy(Bucket=S3_BUCKET, Policy=json.dumps(policy))

# 6. Subir frontend
print("Subiendo frontend...")
run(f"aws s3 sync {FRONT_DIR} s3://{S3_BUCKET} --delete")

# Obtener URL de la API
response = cf.describe_stacks(StackName=STACK_NAME)
api_url = None
for output in response['Stacks'][0]['Outputs']:
    if output['OutputKey'] == 'ApiUrl':
        api_url = output['OutputValue']
        break

# --- Resultados finales ---
print("\n" + "="*60)
print("DESPLIEGUE COMPLETADO")
print("="*60)
print(f"Frontend:  http://{S3_BUCKET}.s3-website-{REGION}.amazonaws.com")
if api_url:
    print(f"API:       {api_url}")
print(f"DynamoDB:  {TABLE_NAME}")
print("="*60)
