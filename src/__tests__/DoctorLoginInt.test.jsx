import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import DoctorLogin from '../components/DoctorLogin';

// Mock fetch and localStorage
global.fetch = jest.fn();
const mockNavigate = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe('DoctorLogin Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders doctor login form with all fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    await user.type(emailInput, 'doctor@test.com');
    await user.type(passwordInput, 'doctor123');

    expect(emailInput).toHaveValue('doctor@test.com');
    expect(passwordInput).toHaveValue('doctor123');
  });

  test('successful doctor login updates storage and navigates', async () => {
    const user = userEvent.setup();
    const mockDoctor = {
      doctor_id: 'D123',
      full_name: 'Dr. John Smith',
      specialization: 'Cardiology',
      contact_number: '1234567890'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doctor: mockDoctor })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByPlaceholderText(/email/i), 'doctor@test.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'doctor123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3002/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'doctor@test.com',
          password: 'doctor123'
        })
      });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'doctor',
        JSON.stringify(mockDoctor)
      );
      expect(mockNavigate).toHaveBeenCalledWith('/doctor/D123');
    });
  });

  test('failed doctor login shows alert', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    global.alert = jest.fn();

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByPlaceholderText(/email/i), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3002/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@test.com',
          password: 'wrongpass'
        })
      });
      expect(global.alert).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});