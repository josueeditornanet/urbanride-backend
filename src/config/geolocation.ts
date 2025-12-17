import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

class GeolocationService {
  private apiKey: string;
  private geocodeBaseUrl: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.geocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    if (!this.apiKey) {
      console.warn('⚠️ GOOGLE_MAPS_API_KEY não está definida nas variáveis de ambiente');
    }
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não está configurada');
      }

      console.log('📍 Geocoding:', address); // Debug log
      console.log('🔑 API Key (primeiros 10 caracteres):', this.apiKey.substring(0, 10) + '...'); // Debug log

      const response = await axios.get(this.geocodeBaseUrl, {
        params: {
          address,
          key: this.apiKey
        }
      });

      console.log('📊 Resposta da API:', response.data.status); // Debug log

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        console.log('✅ Geocoding bem-sucedido'); // Debug log
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address
        };
      } else {
        console.log('❌ Status da API:', response.data.status); // Debug log
        console.log('❌ Detalhes:', response.data.error_message); // Debug log
      }

      return null;
    } catch (error: any) {
      console.error('💥 Erro ao geocodificar endereço:', error.message);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não está configurada');
      }

      const response = await axios.get(this.geocodeBaseUrl, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Erro ao fazer reverse geocoding:', error);
      throw error;
    }
  }

  async getDistanceMatrix(origins: string[], destinations: string[]): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não está configurada');
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: origins.join('|'),
          destinations: destinations.join('|'),
          mode: 'driving',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter matriz de distância:', error);
      throw error;
    }
  }
}

export const geolocationService = new GeolocationService();