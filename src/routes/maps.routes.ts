import { Router } from 'express';
import { geolocationService } from '../config/geolocation';

const mapsRouter = Router();

// Endpoint para busca de locais no mapa
mapsRouter.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro de busca "q" é obrigatório'
      });
    }

    // Usar o serviço de geolocalização para buscar locais
    // Nota: A API do Google Maps não tem um endpoint direto de busca de texto livre
    // Vamos usar o geocoding com o texto de busca
    const result = await geolocationService.geocodeAddress(query);

    if (result) {
      // Retornar uma resposta no formato esperado pelo frontend
      return res.json({
        success: true,
        results: [
          {
            place_id: query,
            formatted_address: result.formatted_address,
            geometry: {
              location: {
                lat: result.lat,
                lng: result.lng
              }
            }
          }
        ]
      });
    } else {
      // Caso a geolocalização falhe, retornar uma lista vazia
      return res.json({
        success: true,
        results: []
      });
    }
  } catch (error: any) {
    console.error('Erro na busca de locais:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar locais'
    });
  }
});

export { mapsRouter };