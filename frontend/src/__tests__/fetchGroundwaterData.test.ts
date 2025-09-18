import fetchGroundwaterData from '../components/fetchGroundwaterData';
import { api } from '../services/api';

// Mock the API module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('fetchGroundwaterData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mock groundwater data structure', async () => {
    // Mock API response
    const mockResponse = {
      data: {
        aquiferDepth: 42,
        aquiferProfile: [
          { depth: 0, waterTable: 10 },
          { depth: 10, waterTable: 15 },
          { depth: 20, waterTable: 25 }
        ],
        soilLayers: [
          { depth: 0, type: 'topsoil', thickness: 2 },
          { depth: 2, type: 'clay', thickness: 8 },
          { depth: 10, type: 'sand', thickness: 15 }
        ],
        boreWells: [
          { id: 1, depth: 30, yield: 50 },
          { id: 2, depth: 25, yield: 40 }
        ]
      }
    };

    mockedApi.get.mockResolvedValue(mockResponse);

    const data = await fetchGroundwaterData(12.9, 77.5);
    
    expect(data).toHaveProperty('aquiferDepth');
    expect(data).toHaveProperty('aquiferProfile');
    expect(data).toHaveProperty('soilLayers');
    expect(data).toHaveProperty('boreWells');
    expect(Array.isArray(data.aquiferProfile)).toBe(true);
    expect(Array.isArray(data.soilLayers)).toBe(true);
    expect(Array.isArray(data.boreWells)).toBe(true);
    
    // Verify API was called with correct parameters
    expect(mockedApi.get).toHaveBeenCalledWith('/groundwater', {
      params: { lat: 12.9, lon: 77.5 }
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockedApi.get.mockRejectedValue(new Error('Network Error'));

    await expect(fetchGroundwaterData(12.9, 77.5)).rejects.toThrow('Network Error');
  });
});
