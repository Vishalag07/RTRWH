import { GroundwaterData } from './types';
import { api } from '../services/api';

export default async function fetchGroundwaterData(lat: number, lon: number): Promise<GroundwaterData> {
  try {
    const res = await api.get('/groundwater', { params: { lat, lon } });
    // Adjust the mapping below to match your backend response structure
    return res.data as GroundwaterData;
  } catch (err: any) {
    // Optionally, add fallback or error transformation here
    throw new Error(err?.response?.data?.detail || err.message || 'Failed to fetch groundwater data');
  }
}
