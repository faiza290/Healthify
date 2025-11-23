// src/__tests__/SignUp.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignUpPage from '../components/SignUpPage'; // Adjust path if needed

// Mock fetch
global.fetch = jest.fn();
const mockNavigate = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SignUpPage Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    global.alert = jest.fn();
  });

  test('renders sign up form with all fields', () => {
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    expect(screen.getByAltText('Healthify Logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();

    expect(screen.getByText('Full Name:')).toBeInTheDocument();
    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
    expect(screen.getByText('Contact Number:')).toBeInTheDocument();
    expect(screen.getByText('Password:')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password:')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    const fullNameInput = allInputs[0];
    const emailInput = allInputs[1];
    // allInputs[2] is dob (date)
    const contactInput = allInputs[3];
    const passwordInput = allInputs[4];
    const confirmPasswordInput = allInputs[5];

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(contactInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'secret123' } });

    expect(fullNameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(contactInput.value).toBe('1234567890');
    expect(passwordInput.value).toBe('secret123');
    expect(confirmPasswordInput.value).toBe('secret123');
  });

  test('shows alert when passwords do not match', () => {
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');
    const passwordInputs = allInputs.slice(-2); // Last two are passwords

    fireEvent.change(passwordInputs[0], { target: { value: 'pass123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different' } });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(global.alert).toHaveBeenCalledWith('Passwords do not match');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('successful signup', async () => {
    fetch.mockResolvedValueOnce({
      status: 201,
      json: async () => ({ message: 'User registered successfully' }),
    });

    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    fireEvent.change(allInputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(allInputs[1], { target: { value: 'john@test.com' } });
    fireEvent.change(allInputs[2], { target: { value: '1990-01-01' } }); // dob
    fireEvent.change(allInputs[3], { target: { value: '1234567890' } });
    fireEvent.change(allInputs[4], { target: { value: 'pass123' } });
    fireEvent.change(allInputs[5], { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(global.alert).toHaveBeenCalledWith('User registered successfully');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('failed signup shows alert', async () => {
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ error: 'User already exists' }),
    });

    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    fireEvent.change(allInputs[0], { target: { value: 'John' } });
    fireEvent.change(allInputs[1], { target: { value: 'j@j.com' } });
    fireEvent.change(allInputs[2], { target: { value: '1990-01-01' } }); // dob
    fireEvent.change(allInputs[3], { target: { value: '1234567890' } });
    fireEvent.change(allInputs[4], { target: { value: 'pass123' } });
    fireEvent.change(allInputs[5], { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Error during signup'));
  });

  test('navigates to login page when login button is clicked', () => {
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});