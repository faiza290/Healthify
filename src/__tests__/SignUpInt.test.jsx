import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignUpPage from '../components/SignUpPage'; 

// Mock fetch and navigation
global.fetch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SignUpPage Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  test('renders sign up form with all fields', () => {
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    expect(screen.getByAltText('Healthify Logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    await user.type(allInputs[0], 'John Doe');
    await user.type(allInputs[1], 'john@example.com');
    await user.type(allInputs[3], '1234567890');
    await user.type(allInputs[4], 'secret123');
    await user.type(allInputs[5], 'secret123');

    expect(allInputs[0]).toHaveValue('John Doe');
    expect(allInputs[1]).toHaveValue('john@example.com');
    expect(allInputs[3]).toHaveValue('1234567890');
    expect(allInputs[4]).toHaveValue('secret123');
    expect(allInputs[5]).toHaveValue('secret123');
  });

  test('shows alert when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');
    const passwordInputs = allInputs.slice(-2);

    await user.type(passwordInputs[0], 'pass123');
    await user.type(passwordInputs[1], 'different');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(global.alert).toHaveBeenCalledWith('Passwords do not match');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('successful signup', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      status: 201,
      json: async () => ({ message: 'User registered successfully' }),
    });

    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    await user.type(allInputs[0], 'John Doe');
    await user.type(allInputs[1], 'john@test.com');
    await user.type(allInputs[2], '1990-01-01'); 
    await user.type(allInputs[3], '1234567890');
    await user.type(allInputs[4], 'pass123');
    await user.type(allInputs[5], 'pass123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(global.alert).toHaveBeenCalledWith('User registered successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('failed signup shows alert', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ error: 'User already exists' }),
    });

    render(<BrowserRouter><SignUpPage /></BrowserRouter>);

    const allInputs = screen.getAllByDisplayValue('');

    await user.type(allInputs[0], 'John');
    await user.type(allInputs[1], 'j@j.com');
    await user.type(allInputs[2], '1990-01-01');
    await user.type(allInputs[3], '1234567890');
    await user.type(allInputs[4], 'pass123');
    await user.type(allInputs[5], 'pass123');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error during signup');
    });
  });

  test('navigates to login page when login button is clicked', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><SignUpPage /></BrowserRouter>);
    
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});