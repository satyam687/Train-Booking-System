import api from './client';

export const paymentsApi = {
  processDemoPayment: (bookingReference, paymentMethod = 'UPI') =>
    api.post('/payments/demo/', {
      booking_reference: bookingReference,
      payment_method: paymentMethod,
    }),

  getPaymentDetail: (reference) =>
    api.get(`/payments/${reference}/`),
};
