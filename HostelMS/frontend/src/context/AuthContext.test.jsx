import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authAPI } from '../services/api';

jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

function TestConsumer({ onReady }) {
  const { login } = useAuth();
  React.useEffect(() => {
    onReady(login);
  }, [login, onReady]);
  return null;
}

describe('AuthProvider login', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('rejects backend authentication failures without creating a demo login session', async () => {
    authAPI.login.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    let loginFn;
    render(
      <AuthProvider>
        <TestConsumer onReady={(fn) => { loginFn = fn; }} />
      </AuthProvider>
    );

    await expect(
      act(async () => {
        await loginFn('admin@hostel.com', 'password123');
      })
    ).rejects.toMatchObject({
      response: {
        data: { message: 'Invalid credentials' },
      },
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
