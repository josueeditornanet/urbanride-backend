import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Erro de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Erro customizado
  if ('statusCode' in err) {
    return res.status((err as any).statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
};