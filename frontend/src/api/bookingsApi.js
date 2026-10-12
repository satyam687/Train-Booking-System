import api from './client';

export const bookingsApi = {
  createBooking: (bookingData) =>
    api.post('/bookings/', bookingData),

  getMyBookings: () =>
    api.get('/bookings/'),

  getBookingDetail: (reference) =>
    api.get(`/bookings/${reference}/`),

  cancelBooking: (reference) =>
    api.post(`/bookings/${reference}/cancel/`),
};
