import { apiClient } from './client';

export interface LoginRequest {
  username: string; // 实际上传邮箱
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

// 注册
export const register = async (data: RegisterRequest) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

// 登录
export const login = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const response = await apiClient.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token } = response.data;
  localStorage.setItem('access_token', access_token);
  return response.data;
};

// 获取当前用户
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// 退出登录
export const logout = () => {
  localStorage.removeItem('access_token');
};
