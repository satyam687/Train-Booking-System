import api from './client';

export const dashboardApi = {
  getSummary: () =>
    api.get('/dashboard/summary/'),

  getBookingAnalytics: () =>
    api.get('/dashboard/booking-analytics/'),

  getDemandAnalytics: () =>
    api.get('/dashboard/demand-analytics/'),
};
