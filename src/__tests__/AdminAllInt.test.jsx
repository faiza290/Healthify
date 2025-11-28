import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext'; 
import AdminHeader from '../components/AdminHeader';
import AdminHome from '../components/AdminHome';
import ManageStock from '../components/ManageStock';
import ManageUsers from '../components/ManageUsers';
import AdminProfile from '../components/AdminProfile';
import Footer from '../components/AFooter';

// Mocks
global.fetch = jest.fn();
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock sessionStorage properly
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock AuthContext logout
const mockLogout = jest.fn();

// Mock useAuth
jest.mock('../components/AuthContext', () => ({
  ...jest.requireActual('../components/AuthContext'),
  useAuth: () => ({
    logout: mockLogout,
  }),
}));


beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

describe('Admin Components - Integration Tests', () => {
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    fetch.mockClear();
    mockNavigate.mockClear();
    mockLogout.mockClear();
    sessionStorageMock.clear.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    console.log.mockClear();
  });

  // AdminHeader Tests
  test('renders header with logo, title, and navigation links', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHeader />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByAltText('Healthify Logo')).toBeInTheDocument();
    expect(screen.getByText('Healthify')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /update stock/i })).toBeInTheDocument();
  });

  test('toggles popup on profile icon click', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHeader />
        </AuthProvider>
      </BrowserRouter>
    );

    const profileIcon = container.querySelector('svg');
    await user.click(profileIcon);
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    await user.click(profileIcon); // Toggle off
    expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
  });

  test('handles logout', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHeader />
        </AuthProvider>
      </BrowserRouter>
    );

    const profileIcon = container.querySelector('svg');
    await user.click(profileIcon);
    await user.click(screen.getByText('Logout'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  // AdminHome Tests
  test('renders dashboard with cards and buttons', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHome />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('View and manage all user profiles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Users' })).toBeInTheDocument();

    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Update the stock of medicines')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Stock' })).toBeInTheDocument();
  });

  test('navigates to manage users on button click', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Manage Users' }));
    expect(mockNavigate).toHaveBeenCalledWith('/manage-users');
  });

  test('navigates to manage stock on button click', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Manage Stock' }));
    expect(mockNavigate).toHaveBeenCalledWith('/manage-stock');
  });

  // ManageStock Tests
  test('fetches medicines and renders list, handles stock changes, add, and delete', async () => {
    const mockMedicines = [
      { medicine_id: 1, name: 'Med1', category: 'Cat1', description: 'Desc1', stock: 50, price: 10, expiry_date: '2025-01-01' },
      { medicine_id: 2, name: 'Med2', category: 'Cat2', description: 'Desc2', stock: 20, price: 15, expiry_date: '2025-02-01' },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMedicines });
    fetch.mockResolvedValueOnce({ ok: true });
    fetch.mockResolvedValueOnce({ ok: true });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Medicine added successfully' }) }); // Add

    render(
      <BrowserRouter>
        <AuthProvider>
          <ManageStock />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Med1')).toBeInTheDocument();
      expect(screen.getByText('Med2')).toBeInTheDocument();
    });

    //increasing stock
    await user.click(screen.getAllByRole('button', { name: /Restock \+10/i })[0]);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stock'), expect.objectContaining({ method: 'PUT' })));

   //deleting
    await user.click(screen.getAllByRole('button', { name: /Delete/i })[0]);
    expect(screen.getByText('Are you sure you want to delete this medicine?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/medicines/'), expect.objectContaining({ method: 'DELETE' })));

    //adding
    await user.type(screen.getByPlaceholderText('Medicine Name'), 'New Med');
    await user.type(screen.getByPlaceholderText('Category'), 'New Cat');
    await user.type(screen.getByPlaceholderText('Description'), 'New Desc');
    await user.type(screen.getByPlaceholderText('Stock (e.g., 50)'), '100');
    await user.type(screen.getByPlaceholderText('Price (e.g., 20)'), '25');
    await user.type(screen.getByPlaceholderText('Expiry Date'), '2025-12-31');

    await user.click(screen.getByRole('button', { name: 'Add Medicine' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/medicinesadd'), expect.objectContaining({ method: 'POST' })));
  });

  // ManageUsers Tests
  test('fetches users and handles edit and delete', async () => {
    const mockUsers = [
      { user_id: 1, full_name: 'User One', email: 'user1@example.com' },
      { user_id: 2, full_name: 'User Two', email: 'user2@example.com' },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockUsers }); // Fetch users
    fetch.mockResolvedValueOnce({ ok: true }); // Delete

    render(
      <BrowserRouter>
        <AuthProvider>
          <ManageUsers />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });

    // Edit
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/edit-user/1');

    // Delete
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getByText('Delete User')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/'), expect.objectContaining({ method: 'DELETE' })));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Deleted user with ID:'));
  });

  // AdminProfile Tests
  test('fetches and displays profile data', async () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ user_id: 1 }));

    const mockProfile = {
      full_name: 'Admin User',
      date_of_birth: '1990-01-01',
      email: 'admin@example.com',
      contact_number: '1234567890',
      password: 'adminpass',
      hire_date: '2020-01-01',
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminProfile />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3003/api/admin-profile/1');
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('adminpass')).toBeInTheDocument();
      expect(screen.getByText('2020-01-01')).toBeInTheDocument();
    });
  });

  test('renders footer with contact info', () => {
    render(<Footer />);

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});