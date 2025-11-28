// src/__tests__/PatientAllInt.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useParams } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import AmbulanceHomePage from '../components/AmbulanceHomePage';
import BookAppointment from '../components/BookAppointment';
import ArticlePage from '../components/ArticlePage';
import ConfirmAppointment from '../components/ConfirmAppointment';
import MedicineCheckout from '../components/MedicineCheckout';
import BookLabTest from '../components/BookLabTest';
import ArticlesHomePage from '../components/ArticlesHomePage';
import MedicineHomePage from '../components/MedicineHomePage';
import AmbulanceConfirmation from '../components/AmbulanceConfirmation';
import PatientAppointmentsHome from '../components/PatientAppointmentsHome';
import PatientProfile from '../components/PatientProfile';
import RescheduleLabTest from '../components/RescheduleLabTest';
import RescheduleAppointment from '../components/RescheduleAppointment';
import ViewLabReportsHome from '../components/ViewLabReportsHome';
import PatientLabTests from '../components/PatientLabTests';
import PatientLabTestReport from '../components/PatientLabTestReport';
import PatientReport from '../components/PatientReport';
import HomePage from '../components/HomePage';

// Mocks
global.fetch = jest.fn();
const mockNavigate = jest.fn();

// Mock useParams for different components
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock sessionStorage
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

// Mock toast
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Patient Components - Integration Tests', () => {
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    fetch.mockReset();
    mockNavigate.mockReset();
    sessionStorageMock.clear();

    // Default patient session
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ patient_id: 'P101', user_id: 'U101' });
      return null;
    });

    // Default useLocation mock
    require('react-router-dom').useLocation.mockReturnValue({
      search: '',
      pathname: '/test'
    });
  });

  //AmbulanceHomePage Tests
  test('renders AmbulanceHomePage and handles ambulance call', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        call_id: 'C001',
        date: '2025-01-01',
        time: '10:00 AM'
      })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AmbulanceHomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter address here/i);
    await user.type(addressInput, '123 Main St');

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Ambulance is on the way!/i)).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('AmbulanceHomePage handles API failure', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AmbulanceHomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter address here/i);
    await user.type(addressInput, '123 Main St');

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  

  //BookAppointment Tests
  test('renders BookAppointment and filters doctors', async () => {
    const mockDoctors = [
      { full_name: 'Dr. Alice', specialization: 'Cardiology', doctor_id: 'D001' },
      { full_name: 'Dr. Bob', specialization: 'Neurology', doctor_id: 'D002' },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockDoctors });

    render(
      <BrowserRouter>
        <AuthProvider>
          <BookAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Dr. Alice')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search for doctors/i);
    await user.type(searchInput, 'Alice');

    expect(screen.getByText('Dr. Alice')).toBeInTheDocument();
    expect(screen.queryByText('Dr. Bob')).not.toBeInTheDocument();
  });



  test('BookAppointment handles no doctors found', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <BrowserRouter>
        <AuthProvider>
          <BookAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No doctors found/i)).toBeInTheDocument();
    });
  });

  // ArticlePage Tests 
  test('renders ArticlePage with specific article content', () => {
    require('react-router-dom').useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ArticlePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/The Role of Antibiotics in Treating Infections/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr Rameen Rafiq/i)).toBeInTheDocument();
  });

  test('ArticlePage handles invalid article ID', () => {
    require('react-router-dom').useParams.mockReturnValue({ id: '999' });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ArticlePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Article not found/i)).toBeInTheDocument();
  });

  //ConfirmAppointment Tests 
  test('renders ConfirmAppointment and handles booking', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'D001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?doctor=Dr.%20Test&special=Cardiology',
      pathname: '/test'
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        start_time: '08:00:00',
        end_time: '17:00:00'
      })
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        appointment_id: 'A001'
      })
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ConfirmAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const dateInput = document.querySelector('input[type="date"]');
    await user.type(dateInput, '2025-01-01');

    const submitButton = screen.getByRole('button', { name: /Confirm Appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/confirmApp',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  //PatientReport Tests 
test('renders PatientReport and displays pending reports', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <PatientReport />
      </AuthProvider>
    </BrowserRouter>
  );

  expect(screen.getByText('Pending Reports')).toBeInTheDocument();
  expect(screen.getByText('Maham Farooqi')).toBeInTheDocument();
  expect(screen.getByText('Rameen Rafiq')).toBeInTheDocument();
  expect(screen.getByText('2024-11-25')).toBeInTheDocument();
  expect(screen.getByText('2024-11-26')).toBeInTheDocument();
});

test('PatientReport handles report click and shows report details', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <PatientReport />
      </AuthProvider>
    </BrowserRouter>
  );

  const viewButtons = screen.getAllByRole('button', { name: /View Report/i });
  await user.click(viewButtons[0]);

  expect(screen.getByText(/Lab Test Report: Maham Farooqi/i)).toBeInTheDocument();
  expect(screen.getByText('P1')).toBeInTheDocument();
  expect(screen.getByText('D18')).toBeInTheDocument();
  expect(screen.getByText('L7')).toBeInTheDocument();
  expect(screen.getByText('Maham Farooqi')).toBeInTheDocument();
  expect(screen.getByText('Female')).toBeInTheDocument();
});

test('PatientReport displays test results correctly', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <PatientReport />
      </AuthProvider>
    </BrowserRouter>
  );

  const viewButtons = screen.getAllByRole('button', { name: /View Report/i });
  await user.click(viewButtons[0]);

  expect(screen.getByText('DNA Description')).toBeInTheDocument();
  expect(screen.getByText(/DNA sequencing revealed a trinucleotide repeat expansion/i)).toBeInTheDocument();
  expect(screen.getByText('Protein Description')).toBeInTheDocument();
  expect(screen.getByText(/Observed a missense mutation/i)).toBeInTheDocument();
});

test('PatientReport handles back button click', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <PatientReport />
      </AuthProvider>
    </BrowserRouter>
  );
  const viewButtons = screen.getAllByRole('button', { name: /View Report/i });
  await user.click(viewButtons[0]);
  expect(screen.getByText(/Lab Test Report: Maham Farooqi/i)).toBeInTheDocument();

  const backButton = screen.getByRole('button', { name: /Back to Reports/i });
  await user.click(backButton);

  expect(screen.getByText('Pending Reports')).toBeInTheDocument();
});

test('PatientReport displays all patient information in report details', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <PatientReport />
      </AuthProvider>
    </BrowserRouter>
  );

  const viewButtons = screen.getAllByRole('button', { name: /View Report/i });
  await user.click(viewButtons[0]);

  // Check all patient data fields
  expect(screen.getByText('Patient ID:')).toBeInTheDocument();
  expect(screen.getByText('P1')).toBeInTheDocument();
  expect(screen.getByText('Diagnosis ID:')).toBeInTheDocument();
  expect(screen.getByText('D18')).toBeInTheDocument();
  expect(screen.getByText('Lab Staff ID:')).toBeInTheDocument();
  expect(screen.getByText('L7')).toBeInTheDocument();
  expect(screen.getByText('Patient Name:')).toBeInTheDocument();
  expect(screen.getByText('Maham Farooqi')).toBeInTheDocument();
  expect(screen.getByText('Gender:')).toBeInTheDocument();
  expect(screen.getByText('Female')).toBeInTheDocument();
  expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
  expect(screen.getByText('15-07-2003')).toBeInTheDocument();
  expect(screen.getByText('Age:')).toBeInTheDocument();
  expect(screen.getByText('21')).toBeInTheDocument();
});

  test('ConfirmAppointment handles booking failure', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'D001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?doctor=Dr.%20Test&special=Cardiology',
      pathname: '/test'
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        start_time: '08:00:00',
        end_time: '17:00:00'
      })
    });

    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ConfirmAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const dateInput = document.querySelector('input[type="date"]');
    await user.type(dateInput, '2025-01-01');

    const submitButton = screen.getByRole('button', { name: /Confirm Appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // MedicineCheckout Tests 
  test('renders MedicineCheckout and handles order completion', async () => {
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?item=' + encodeURIComponent(JSON.stringify({
        id: 1, name: 'Medicine A', price: 10, quantity: 1
      })),
      pathname: '/checkout'
    });

    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineCheckout />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter your address/i);
    await user.type(addressInput, '123 Main St');

    const completeButton = screen.getByRole('button', { name: /Complete Order/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('MedicineCheckout handles empty address', async () => {
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?item=' + encodeURIComponent(JSON.stringify({
        id: 1, name: 'Medicine A', price: 10, quantity: 1
      })),
      pathname: '/checkout'
    });

    global.alert = jest.fn();

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineCheckout />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const completeButton = screen.getByRole('button', { name: /Complete Order/i });
    await user.click(completeButton);

    expect(global.alert).toHaveBeenCalledWith('Please enter your address before placing the order.');
  });

  test('MedicineCheckout handles order failure', async () => {
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?item=' + encodeURIComponent(JSON.stringify({
        id: 1, name: 'Medicine A', price: 10, quantity: 1
      })),
      pathname: '/checkout'
    });

    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineCheckout />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter your address/i);
    await user.type(addressInput, '123 Main St');

    const completeButton = screen.getByRole('button', { name: /Complete Order/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('MedicineCheckout handles empty cart', () => {
    require('react-router-dom').useLocation.mockReturnValue({
      search: '',
      pathname: '/checkout'
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineCheckout />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
  });

  //BookLabTest Tests 
  test('renders BookLabTest and handles lab test booking', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'P101' });

    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <BrowserRouter>
        <AuthProvider>
          <BookLabTest />
        </AuthProvider>
      </BrowserRouter>
    );

    const testTypeSelect = screen.getByDisplayValue(/Select test type/i);
    const dateInput = document.querySelector('input[type="date"]');
    const timeSelect = screen.getByDisplayValue(/Select time/i);

    await user.selectOptions(testTypeSelect, 'Blood Test');
    await user.type(dateInput, '2025-01-01');
    await user.selectOptions(timeSelect, '08:00:00');

    const submitButton = screen.getByRole('button', { name: /Book Lab Test/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/confirmtest',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('BookLabTest handles booking failure', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'P101' });

    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <BookLabTest />
        </AuthProvider>
      </BrowserRouter>
    );

    const testTypeSelect = screen.getByDisplayValue(/Select test type/i);
    const dateInput = document.querySelector('input[type="date"]');
    const timeSelect = screen.getByDisplayValue(/Select time/i);

    await user.selectOptions(testTypeSelect, 'Blood Test');
    await user.type(dateInput, '2025-01-01');
    await user.selectOptions(timeSelect, '08:00:00');

    const submitButton = screen.getByRole('button', { name: /Book Lab Test/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  //  ArticlesHomePage Tests 
  test('renders ArticlesHomePage and filters articles', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ArticlesHomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/The Role of Antibiotics in Treating Infections/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search for article/i);
    await user.type(searchInput, 'Stress');

    expect(screen.getByText(/The Impact of Stress on Mental Health/i)).toBeInTheDocument();
  });

  test('ArticlesHomePage shows no articles message', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ArticlesHomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search for article/i);
    await user.type(searchInput, 'Nonexistent Article');

    expect(screen.getByText(/No articles found/i)).toBeInTheDocument();
  });

  //  MedicineHomePage Tests 
  test('renders MedicineHomePage and displays medicines', async () => {
    const mockMedicines = [
      { medicine_id: 1, name: 'Paracetamol', category: 'Painkiller', description: 'Pain relief', stock: 100, price: 5 },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMedicines });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineHomePage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());
  });

  test('MedicineHomePage handles add to cart functionality', async () => {
    const mockMedicines = [
      { medicine_id: 1, name: 'Paracetamol', category: 'Painkiller', description: 'Pain relief', stock: 100, price: 5 },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMedicines });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineHomePage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    const addToCartButton = screen.getByRole('button', { name: /Add to Cart/i });
    await user.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText('Stock: 100')).toBeInTheDocument();
    });
  });

  test('MedicineHomePage handles cart operations', async () => {
    const mockMedicines = [
      { medicine_id: 1, name: 'Paracetamol', category: 'Painkiller', description: 'Pain relief', stock: 100, price: 5 },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMedicines });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineHomePage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    // Test view cart button
    const viewCartButton = screen.getByRole('button', { name: /View Cart/i });
    await user.click(viewCartButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Cart/i)).toBeInTheDocument();
    });
  });

  test('MedicineHomePage handles no medicines found', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <MedicineHomePage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No medicines found/i)).toBeInTheDocument();
    });
  });

  //  AmbulanceConfirmation Tests 
  test('renders AmbulanceConfirmation with static data', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AmbulanceConfirmation />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Your Ambulance is on the way!/i)).toBeInTheDocument();
    expect(screen.getByText(/C1/i)).toBeInTheDocument();
  });

  //  PatientAppointmentsHome Tests 
  test('renders PatientAppointmentsHome and displays appointments', async () => {
    const mockAppointments = [
      {
        appointment_id: 1,
        appointment_date: '2025-01-01',
        appointment_time: '10:00',
        status: 'Scheduled',
        full_name: 'Dr. Smith'
      },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockAppointments });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientAppointmentsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('2025-01-01')).toBeInTheDocument());
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  test('PatientAppointmentsHome handles appointment cancellation', async () => {
    const mockAppointments = [
      {
        appointment_id: 1,
        appointment_date: '2025-01-01',
        appointment_time: '10:00',
        status: 'Scheduled',
        full_name: 'Dr. Smith'
      },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockAppointments });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Appointment cancelled' }) });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientAppointmentsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to cancel this appointment?/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/appointments/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  test('PatientAppointmentsHome handles cancellation failure', async () => {
    const mockAppointments = [
      {
        appointment_id: 1,
        appointment_date: '2025-01-01',
        appointment_time: '10:00',
        status: 'Scheduled',
        full_name: 'Dr. Smith'
      },
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockAppointments });
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Error' }) });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientAppointmentsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[0]);

    const confirmButton = screen.getByRole('button', { name: /Yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('PatientAppointmentsHome handles no appointments', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientAppointmentsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Appointment ID/i)).toBeInTheDocument();
    });
  });

  //  PatientProfile Tests 
  test('renders PatientProfile and displays fetched profile', async () => {
    const mockProfile = {
      full_name: 'John Doe',
      date_of_birth: '1990-01-01',
      email: 'john@example.com',
      contact_number: '1234567890',
      status: 'Active',
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientProfile />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('PatientProfile handles no user ID', () => {
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return null;
      return null;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientProfile />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/User ID not found/i)).toBeInTheDocument();
  });


  //  RescheduleLabTest Tests 
  test('renders RescheduleLabTest with correct ID', () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'L001' });

    render(
      <BrowserRouter>
        <AuthProvider>
          <RescheduleLabTest />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/L001/i)).toBeInTheDocument();
  });

  test('RescheduleLabTest handles form submission', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'L001' });
    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <BrowserRouter>
        <AuthProvider>
          <RescheduleLabTest />
        </AuthProvider>
      </BrowserRouter>
    );

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      await user.type(dateInput, '2025-01-01');
    }

    const submitButton = screen.getByRole('button', { name: /Reschedule Lab Test/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/reshedulelab',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('RescheduleLabTest handles submission failure', async () => {
  const { toast } = require('react-toastify');
  
  require('react-router-dom').useParams.mockReturnValue({ id: 'L001' });
  fetch.mockResolvedValueOnce({ ok: false });

  render(
    <BrowserRouter>
      <AuthProvider>
        <RescheduleLabTest />
      </AuthProvider>
    </BrowserRouter>
  );

  const dateInput = document.querySelector('input[type="date"]');
  if (dateInput) {
    await user.type(dateInput, '2025-01-01');
  }

  const submitButton = screen.getByRole('button', { name: /Reschedule Lab Test/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Unable to reschedule!");
    expect(toast.success).not.toHaveBeenCalled();
  });
});

  //  RescheduleAppointment Tests 
  test('renders RescheduleAppointment with correct ID', () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'A001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?doctor=Dr.%20Smith',
      pathname: '/test'
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <RescheduleAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/A001/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Smith/i)).toBeInTheDocument();
  });

  test('RescheduleAppointment handles form submission', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'A001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?doctor=Dr.%20Smith',
      pathname: '/test'
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        start_time: '08:00:00',
        end_time: '17:00:00'
      })
    });
    fetch.mockResolvedValueOnce({ ok: true });

    render(
      <BrowserRouter>
        <AuthProvider>
          <RescheduleAppointment />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      await user.type(dateInput, '2025-01-01');
    }

    const submitButton = screen.getByRole('button', { name: /Reschedule Appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/resheduleApp',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  //  ViewLabReportsHome Tests 
  test('renders ViewLabReportsHome and displays lab reports', async () => {
    const mockReports = {
      readyReports: [
        { labreport_id: 'R001', result_date: '2025-01-01', test_type: 'Blood Test' }
      ],
      inProgressReports: [
        { labreport_id: 'R002', result_date: '2025-01-02', test_type: 'Genetic Test' }
      ]
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockReports });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ViewLabReportsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
      expect(screen.getByText('Blood Test')).toBeInTheDocument();
      expect(screen.getByText('Ready to View Reports')).toBeInTheDocument();
      expect(screen.getByText('Reports In Progress')).toBeInTheDocument();
    });
  });

  test('ViewLabReportsHome handles no reports', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ readyReports: [], inProgressReports: [] }) });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ViewLabReportsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ready to View Reports')).toBeInTheDocument();
      expect(screen.getByText('Reports In Progress')).toBeInTheDocument();
    });
  });

  test('ViewLabReportsHome handles fetch error', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ViewLabReportsHome />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  //  PatientLabTests Tests 
  test('renders PatientLabTests and displays lab tests', async () => {
    const mockLabTests = [
      {
        labtest_id: 'LT001',
        test_type: 'Blood Test',
        test_date: '2025-01-01',
        test_time: '10:00'
      }
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockLabTests });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTests />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LT001')).toBeInTheDocument();
      expect(screen.getByText('Blood Test')).toBeInTheDocument();
      expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    });
  });

  test('PatientLabTests handles lab test cancellation', async () => {
    const mockLabTests = [
      {
        labtest_id: 'LT001',
        test_type: 'Blood Test',
        test_date: '2025-01-01',
        test_time: '10:00'
      }
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockLabTests });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Lab test cancelled' }) });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTests />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Blood Test')).toBeInTheDocument());

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to cancel this test?/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/lab/LT001',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  test('PatientLabTests handles no lab tests', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTests />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Lab Test ID/i)).toBeInTheDocument();
    });
  });

  //  PatientLabTestReport Tests 
  test('renders PatientLabTestReport with lab test data', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'R001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?description=Blood%20Test',
      pathname: '/test'
    });

    const mockLabData = {
      gender: 'Male',
      dob: '1990-01-01',
      age: '33',
      bloodType: 'O+',
      hemoglobin: '14.5',
      plateletsCount: '250,000'
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockLabData });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTestReport />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lab Test Report')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    });
  });

  test('PatientLabTestReport handles no data', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'R001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?description=Blood%20Test',
      pathname: '/test'
    });

    fetch.mockResolvedValueOnce({ ok: true, json: async () => null });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTestReport />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });
  });

  test('PatientLabTestReport handles loading state', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: 'R001' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?description=Blood%20Test',
      pathname: '/test'
    });

    // Don't resolve the fetch immediately to test loading state
    fetch.mockReturnValueOnce(new Promise(() => { }));

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientLabTestReport />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  //  Error Handling Tests 
  test('PatientProfile handles fetch error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientProfile />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

    //  HomePage Tests 
  test('renders HomePage with all main sections', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Among the/i)).toBeInTheDocument();
    expect(screen.getByText(/nation's/i)).toBeInTheDocument();
    expect(screen.getByText(/best/i)).toBeInTheDocument();
    expect(screen.getByText(/Accurate results/i)).toBeInTheDocument();
    expect(screen.getByText(/in less time/i)).toBeInTheDocument();
  });

  test('HomePage navigation buttons are present', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Schedule your appointment now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book a Lab Test/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Call an ambulance now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Order medicines now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Read articles now/i })).toBeInTheDocument();
  });

  test('HomePage displays all service images', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByAltText('Healthcare Hero')).toBeInTheDocument();
    expect(screen.getByAltText('Icon 1')).toBeInTheDocument();
    expect(screen.getByAltText('Icon 2')).toBeInTheDocument();
    expect(screen.getByAltText('Ambulance')).toBeInTheDocument();
    expect(screen.getByAltText('Medicines')).toBeInTheDocument();
    expect(screen.getByAltText('Articles')).toBeInTheDocument();
  });

  test('HomePage handles appointment navigation', async () => {
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const appointmentButton = screen.getByRole('button', { name: /Schedule your appointment now/i });
    await user.click(appointmentButton);

    expect(window.location.href).toBe('/appointment');
  });

  test('HomePage handles lab test navigation', async () => {
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const labTestButton = screen.getByRole('button', { name: /Book a Lab Test/i });
    await user.click(labTestButton);

    expect(window.location.href).toBe('/lab-test');
  });

  test('HomePage handles reports navigation', async () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const reportsButton = screen.getByRole('button', { name: /View Reports/i });
    await user.click(reportsButton);

    expect(window.location.href).toBe('/reports');
  });

  test('HomePage handles ambulance navigation', async () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const ambulanceButton = screen.getByRole('button', { name: /Call an ambulance now/i });
    await user.click(ambulanceButton);

    expect(window.location.href).toBe('/ambulance');
  });

  test('HomePage handles medicine navigation', async () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const medicineButton = screen.getByRole('button', { name: /Order medicines now/i });
    await user.click(medicineButton);

    expect(window.location.href).toBe('/ordermedicine');
  });

  test('HomePage handles articles navigation', async () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const articlesButton = screen.getByRole('button', { name: /Read articles now/i });
    await user.click(articlesButton);

    expect(window.location.href).toBe('/articles');
  });
});