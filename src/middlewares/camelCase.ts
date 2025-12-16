import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  // Para permitir modificações no objeto de resposta
}

export const camelCaseMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  // Armazena a função original de res.json
  const originalJson = res.json;

  // Substitui res.json com uma versão que converte para camelCase
  res.json = function (data: any) {
    // Converte as chaves do objeto para camelCase apenas em ambientes que não sejam produção
    if (process.env.NODE_ENV !== 'production') {
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

      data = convertToCamelCase(data);
    }

    // Chama a função original de res.json
    return originalJson.call(this, data);
  };

  next();
};