import { Router } from 'express';
import { geolocationService } from '../config/geolocation';
import { query } from '../config/database';

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
            address: result.formatted_address,
            coords: {
              lat: result.lat,
              lng: result.lng,
              address: result.formatted_address
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

// Endpoint para cálculo de rota
mapsRouter.post('/calculate-route', async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origem e destino são obrigatórios'
      });
    }

    // Converter origem e destino em coordenadas se forem endereços
    let originCoords: { lat: number; lng: number } | null = null;
    let destinationCoords: { lat: number; lng: number } | null = null;

    if (typeof origin === 'string') {
      const originResult = await geolocationService.geocodeAddress(origin);
      if (originResult) {
        originCoords = { lat: originResult.lat, lng: originResult.lng };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível encontrar a localização da origem'
        });
      }
    } else {
      originCoords = origin;
    }

    if (typeof destination === 'string') {
      const destinationResult = await geolocationService.geocodeAddress(destination);
      if (destinationResult) {
        destinationCoords = { lat: destinationResult.lat, lng: destinationResult.lng };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível encontrar a localização do destino'
        });
      }
    } else {
      destinationCoords = destination;
    }

    // Verificar se as coordenadas não são nulas antes de usar
    if (!originCoords || !destinationCoords) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível obter as coordenadas de origem ou destino'
      });
    }

    // Obter distância e duração entre os pontos
    const distanceResult = await geolocationService.getDistanceMatrix([
      `${originCoords.lat},${originCoords.lng}`
    ], [
      `${destinationCoords.lat},${destinationCoords.lng}`
    ]);

    if (distanceResult && distanceResult.rows && distanceResult.rows[0].elements[0].status === 'OK') {
      const element = distanceResult.rows[0].elements[0];
      const distanceValue = element.distance.value / 1000; // Converter para km
      const distanceText = element.distance.text;
      const durationValue = Math.ceil(element.duration.value / 60); // Converter para minutos
      const durationText = element.duration.text;

      // Calcular preço estimado baseado na distância
      const basePrice = 5.00; // Preço base
      const pricePerKm = 2.00; // Preço por km
      const estimatedPrice = basePrice + (distanceValue * pricePerKm);

      // Retornar detalhes da rota no formato esperado pelo frontend
      return res.json({
        success: true,
        data: {
          polyline: [originCoords, destinationCoords], // Simulação de polilinha
          distanceText,
          distanceValue,
          durationText,
          durationValue,
          price: parseFloat(estimatedPrice.toFixed(2))
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível calcular a rota entre os pontos'
      });
    }
  } catch (error: any) {
    console.error('Erro no cálculo da rota:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao calcular rota'
    });
  }
});

// Endpoint para geocodificação reversa
mapsRouter.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "lat" e "lng" são obrigatórios'
      });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "lat" e "lng" devem ser números válidos'
      });
    }

    const address = await geolocationService.reverseGeocode(latNum, lngNum);

    if (address) {
      return res.json({
        success: true,
        data: address
      });
    } else {
      return res.json({
        success: true,
        data: 'Localização desconhecida'
      });
    }
  } catch (error: any) {
    console.error('Erro na geocodificação reversa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao converter coordenadas em endereço'
    });
  }
});

export { mapsRouter };