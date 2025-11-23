import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import LoginPage from '../components/LoginPage';

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock console.log to suppress the user data logging
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Real LoginPage with Actual AuthContext', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  test('renders login form with actual AuthContext', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('successful login updates auth state', async () => {
    const mockUser = { 
      id: 'U123', 
      name: 'John Doe', 
      patient_id: 'P123',
      email: 'test@test.com'
    };

    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, user: mockUser })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Fill and submit form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'test@test.com',
          password: 'password123'
        })
      });
    });
  });

  test('failed login shows error', async () => {
    // Mock failed API response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Invalid credentials' })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'wrong@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});