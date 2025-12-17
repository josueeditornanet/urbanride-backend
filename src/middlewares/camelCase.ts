import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  // Para permitir modificações no objeto de resposta
}

// Função para converter de camelCase para snake_case
const convertToSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Converte camelCase para snake_case
    const snakeCaseKey = key.replace(/([A-Z])/g, (g) => `_${g[0].toLowerCase()}`);
    converted[snakeCaseKey] = convertToSnakeCase(value);
  }

  return converted;
};

// Função para converter de snake_case para camelCase
const convertToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCase);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Converte snake_case para camelCase
    const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    converted[camelCaseKey] = convertToCamelCase(value);
  }

  return converted;
};

export const camelCaseMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  // Converter body de camelCase para snake_case para uso interno
  if (req.body && typeof req.body === 'object') {
    req.body = convertToSnakeCase(req.body);
  }

  // Converter query de camelCase para snake_case
  if (req.query && typeof req.query === 'object') {
    req.query = convertToSnakeCase(req.query);
  }

  // Converter params de camelCase para snake_case
  if (req.params && typeof req.params === 'object') {
    req.params = convertToSnakeCase(req.params);
  }

  // Armazena a função original de res.json
  const originalJson = res.json;

  // Substitui res.json com uma versão que converte de snake_case para camelCase na saída
  res.json = function (data: any) {
    // Converte as chaves do objeto de snake_case para camelCase em todos os ambientes
    data = convertToCamelCase(data);

    // Chama a função original de res.json
    return originalJson.call(this, data);
  };

  next();
};