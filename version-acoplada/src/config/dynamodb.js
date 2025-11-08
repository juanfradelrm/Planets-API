// src/config/dynamodb.js
const AWS = require('aws-sdk');

// Configurar AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'planets-shared';

module.exports = {
  dynamoDB,
  TABLE_NAME
};