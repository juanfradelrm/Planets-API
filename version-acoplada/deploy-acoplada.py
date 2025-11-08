#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script: deploy_acoplada.py
Descripción: Despliega la infraestructura de la API de Planetas en AWS
Componentes:
  1. ECR Repository (planets-ecr-repo-acoplada)
  2. ECS Fargate + API Gateway REST + NLB
Requisitos previos:
  - AWS CLI configurado o credenciales en ~/.aws/credentials
  - Docker instalado
  - Permisos de CloudFormation, ECS, ECR, IAM
"""

import boto3
import shutil
import subprocess
import sys

REGION = "us-east-1"

TEMPLATES = {
    "ECR": "ecr.yml",
    "ECS": "main.yml"
}

# --- Comprobaciones previas ---
if not shutil.which("aws"):
    print("Error: AWS CLI no está instalado.")
    sys.exit(1)

if not shutil.which("docker"):
    print("Error: Docker no está instalado o no está en el PATH.")
    sys.exit(1)

print("========== DEPLOY PLANETAS INFRASTRUCTURE ==========")

ec2 = boto3.client("ec2", region_name=REGION)
cf = boto3.client("cloudformation", region_name=REGION)

# --- Obtener VPC y subredes ---
print("Obteniendo VPC y Subnets por defecto...")

vpcs = ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
if not vpcs["Vpcs"]:
    print("No se encontró una VPC por defecto.")
    sys.exit(1)

vpc_id = vpcs["Vpcs"][0]["VpcId"]

subnets = ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
all_subnets = [s["SubnetId"] for s in subnets["Subnets"]]

EXCLUDED_ZONES = {"us-east-1e"}  # zonas incompatibles con VPC Link
vpc_link_subnets = [
    s["SubnetId"]
    for s in subnets["Subnets"]
    if s["AvailabilityZone"] not in EXCLUDED_ZONES
]

if not vpc_link_subnets:
    print("No hay subredes válidas para VPC Link.")
    sys.exit(1)

# --- Función para desplegar stacks ---
def deploy_stack(stack_name, template_file, parameters=None):
    try:
        with open(template_file, "r") as f:
            template_body = f.read()

        try:
            cf.describe_stacks(StackName=stack_name)
            stack_exists = True
        except cf.exceptions.ClientError:
            stack_exists = False

        if stack_exists:
            print(f"Actualizando stack {stack_name}...")
            cf.update_stack(
                StackName=stack_name,
                TemplateBody=template_body,
                Capabilities=["CAPABILITY_NAMED_IAM"],
                Parameters=parameters or []
            )
            waiter = cf.get_waiter('stack_update_complete')
        else:
            print(f"Creando stack {stack_name}...")
            cf.create_stack(
                StackName=stack_name,
                TemplateBody=template_body,
                Capabilities=["CAPABILITY_NAMED_IAM"],
                Parameters=parameters or []
            )
            waiter = cf.get_waiter('stack_create_complete')

        print("Esperando a que el stack termine de desplegarse...")
        waiter.wait(StackName=stack_name)
        print(f"{stack_name} desplegado correctamente.")

    except cf.exceptions.ClientError as e:
        if "No updates are to be performed" in str(e):
            print(f"{stack_name} ya está actualizado, sin cambios.")
        else:
            print(f"Error al desplegar stack {stack_name}: {e}")
            sys.exit(1)

# --- 1. Desplegar ECR ---
deploy_stack("planetas-ecr-acoplada", TEMPLATES["ECR"])

# --- 2. Subir imagen Docker ---
response = cf.describe_stacks(StackName="planetas-ecr-acoplada")
repository_uri = next(
    o['OutputValue'] for o in response['Stacks'][0]['Outputs'] if o['OutputKey'] == 'RepositoryUri'
)

print(f"Repositorio ECR: {repository_uri}")
print("Iniciando sesión en ECR...")

# Login en ECR
login_cmd = ["aws", "ecr", "get-login-password", "--region", REGION]
login_proc = subprocess.run(login_cmd, capture_output=True, text=True)
if login_proc.returncode != 0:
    print(f"Error en login ECR: {login_proc.stderr}")
    sys.exit(1)

docker_login_cmd = ["docker", "login", "--username", "AWS", "--password-stdin", repository_uri.split("/")[0]]
docker_login_proc = subprocess.run(docker_login_cmd, input=login_proc.stdout, text=True)
if docker_login_proc.returncode != 0:
    print(f"Error en docker login: {docker_login_proc.stderr}")
    sys.exit(1)

# Build + Push
print("Construyendo y subiendo imagen Docker...")
subprocess.run(["docker", "build", "-t", "planetas-api:latest", "."], check=True)
subprocess.run(["docker", "tag", "planetas-api:latest", f"{repository_uri}:latest"], check=True)
subprocess.run(["docker", "push", f"{repository_uri}:latest"], check=True)

print("Imagen Docker subida correctamente.")

# --- 3. Desplegar ECS + API Gateway REST + NLB ---
deploy_stack(
    "planetas-ecs-api-acoplada",
    TEMPLATES["ECS"],
    parameters=[
        {"ParameterKey": "VpcId", "ParameterValue": vpc_id},
        {"ParameterKey": "SubnetIds", "ParameterValue": ",".join(all_subnets)},
        {"ParameterKey": "VpcLinkSubnetIds", "ParameterValue": ",".join(vpc_link_subnets)},
        {"ParameterKey": "ImageUri", "ParameterValue": f"{repository_uri}:latest"}
    ]
)

# --- 4. Mostrar resultados ---
response = cf.describe_stacks(StackName="planetas-ecs-api-acoplada")
api_url = next(
    (o['OutputValue'] for o in response['Stacks'][0]['Outputs'] if o['OutputKey'] == 'ApiUrl'),
    None
)

print("======================================================")
print("Despliegue completado exitosamente.")
if api_url:
    print(f"URL de la API: {api_url}")
print("======================================================")
