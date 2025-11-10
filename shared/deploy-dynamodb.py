#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script: deploy-dynamodb.py
Descripción: Despliega la DB compartida entre ambas versiones
"""

import boto3
import sys

REGION = "us-east-1"
STACK_NAME = "planets-shared"
TEMPLATE_FILE = "dynamodb.yml"

cf = boto3.client("cloudformation", region_name=REGION)

def deploy_stack(stack_name, template_file):
    try:
        with open(template_file, "r") as f:
            template_body = f.read()

        try:
            cf.describe_stacks(StackName=stack_name)
            stack_exists = True
        except cf.exceptions.ClientError:
            stack_exists = False

        if stack_exists:
            print(f"Stack {stack_name} ya existe, actualizando...")
            try:
                cf.update_stack(
                    StackName=stack_name,
                    TemplateBody=template_body,
                    Capabilities=["CAPABILITY_NAMED_IAM"]
                )
                waiter = cf.get_waiter('stack_update_complete')
                print("Esperando actualización...")
                waiter.wait(StackName=stack_name)
                print(f"Stack {stack_name} actualizado correctamente.")
            except cf.exceptions.ClientError as e:
                if "No updates are to be performed" in str(e):
                    print(f"Stack {stack_name} ya está actualizado, sin cambios.")
                else:
                    raise
        else:
            print(f"Creando stack {stack_name}...")
            cf.create_stack(
                StackName=stack_name,
                TemplateBody=template_body,
                Capabilities=["CAPABILITY_NAMED_IAM"]
            )
            waiter = cf.get_waiter('stack_create_complete')
            print("Esperando creación...")
            waiter.wait(StackName=stack_name)
            print(f"Stack {stack_name} creado correctamente.")

    except Exception as e:
        print(f"Error al desplegar stack {stack_name}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("========== DEPLOY DB COMPARTIDA ==========")
    deploy_stack(STACK_NAME, TEMPLATE_FILE)
    
    response = cf.describe_stacks(StackName=STACK_NAME)
    table_name = next(
        o['OutputValue'] for o in response['Stacks'][0]['Outputs'] 
        if o['OutputKey'] == 'TableName'
    )
    
    print("="*50)
    print(f"tabla DynamoDB: {table_name}")
    print("="*50)