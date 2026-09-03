import apiClient from './client';
export const addUser = ({ email, isAdmin, name, city }) =>
  apiClient.post('/admin/users', { email, isAdmin, name, city });

export const listUsers = () => apiClient.get('/admin/users');

export const deleteUser = (id) => apiClient.delete(`/admin/users/${id}`);