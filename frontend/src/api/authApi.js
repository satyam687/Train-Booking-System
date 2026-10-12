import api from './client';

export const authApi = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),

  register: (userData) =>
    api.post('/auth/register/', userData),

  getProfile: () =>
    api.get('/auth/profile/'),

  updateProfile: (profileData) =>
    api.put('/auth/profile/', profileData),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    }),
};
