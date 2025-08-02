import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }
  };
};
