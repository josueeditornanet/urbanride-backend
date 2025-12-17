import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';

const uploadDocumentSchema = z.object({
  type: z.enum(['cnh', 'crlv', 'profile'])
});

export class DriverDocumentController {
  async uploadDocument(req: Request, res: Response) {
    try {
      const data = uploadDocumentSchema.parse(req.body);

      // Verificar se o usuário é um motorista
      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'DRIVER') {
        return res.status(403).json({
          success: false,
          message: 'Apenas motoristas podem enviar documentos'
        });
      }

      // Em um ambiente real, aqui salvaríamos o arquivo em um serviço de armazenamento
      // como AWS S3, Google Cloud Storage, etc.
      // Por enquanto, vamos apenas simular o armazenamento
      
      if (!req.file && !req.body.fileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo é obrigatório'
        });
      }

      // Atualizar informações do usuário com o documento
      let updateField = '';
      switch (data.type) {
        case 'cnh':
          updateField = 'cnh_document';
          break;
        case 'crlv':
          updateField = 'crlv_document';
          break;
        case 'profile':
          updateField = 'profile_photo';
          break;
      }

      await query(
        `UPDATE users SET ${updateField} = $1 WHERE id = $2`,
        [req.body.fileUrl || 'mock_file_path', req.user.id]
      );

      return res.json({
        success: true,
        message: 'Documento enviado com sucesso'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      throw error;
    }
  }

  async submitForReview(req: Request, res: Response) {
    try {
      // Verificar se o usuário é um motorista
      const userResult = await query(
        'SELECT role, cnh_document, crlv_document FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'DRIVER') {
        return res.status(403).json({
          success: false,
          message: 'Apenas motoristas podem solicitar verificação'
        });
      }

      const user = userResult.rows[0];

      // Verificar se os documentos necessários foram enviados
      if (!user.cnh_document || !user.crlv_document) {
        return res.status(400).json({
          success: false,
          message: 'É necessário enviar CNH e CRLV antes de solicitar verificação'
        });
      }

      // Atualizar status de verificação
      await query(
        `UPDATE users SET verification_status = 'PENDING' WHERE id = $1`,
        [req.user.id]
      );

      return res.json({
        success: true,
        message: 'Solicitação de verificação enviada com sucesso'
      });
    } catch (error) {
      throw error;
    }
  }
}