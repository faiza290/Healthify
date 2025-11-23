import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Real DoctorLogin Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    localStorage.setItem.mockClear();
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

  test('handles form input changes', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'doctor@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'doctor123' } });

    expect(emailInput.value).toBe('doctor@test.com');
    expect(passwordInput.value).toBe('doctor123');
  });

  test('successful doctor login', async () => {
    const mockDoctor = {
      doctor_id: 'D123',
      full_name: 'Dr. John Smith',
      specialization: 'Cardiology',
      contact_number: '1234567890'
    };

    // Mock successful API response
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

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'doctor@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'doctor123' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3002/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'doctor@test.com',
          password: 'doctor123'
        })
      });
    });

    // Verify localStorage was called
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'doctor',
        JSON.stringify(mockDoctor)
      );
    });

    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/doctor/D123');
    });
  });

  test('failed doctor login shows alert', async () => {
    // Mock failed API response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    // Mock window.alert
    global.alert = jest.fn();

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorLogin />
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
      expect(global.alert).toHaveBeenCalledWith('Invalid credentials');
    });
  });


});