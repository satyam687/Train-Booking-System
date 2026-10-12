import api from './client';

export const trainsApi = {
  getStations: (search = '') =>
    api.get(`/stations/${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getTrains: (params = {}) =>
    api.get('/trains/', { params }),

  searchTrains: (searchParams) =>
    api.get('/trains/search/', { params: searchParams }),

  getTrainDetail: (id) =>
    api.get(`/trains/${id}/`),

  getLiveStatus: (id, date = '') =>
    api.get(`/trains/${id}/status/${date ? `?date=${date}` : ''}`),

  getAvailability: (trainId, date, classCode = '') =>
    api.get('/trains/availability/', {
      params: { train_id: trainId, date, class: classCode },
    }),

  getFare: (params) =>
    api.get('/fares/', { params }),

  requestFareQuote: (payload) =>
    api.post('/fares/quote/', payload),
};
