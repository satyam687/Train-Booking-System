import api from './client';

export const mlApi = {
  predictDemand: (payload) =>
    api.post('/ml/demand-prediction/', payload),

  getRecommendations: (payload) =>
    api.post('/ml/recommendations/', payload),

  getModelInfo: () =>
    api.get('/ml/model-info/'),

  getFareInsights: (route = 'NDLS-MMCT', baseFare = 1500) =>
    api.get(`/ml/fare-insights/?route=${encodeURIComponent(route)}&base_fare=${baseFare}`),
};
