import apiClient from './client';

export const addUser = (email, isAdmin) => apiClient.post('/admin/users', { email, isAdmin });
export const listUsers = () => apiClient.get('/admin/users');
