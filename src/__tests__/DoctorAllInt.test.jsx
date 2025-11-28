// src/__tests__/DoctorAll.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import Consultation from '../components/Consultation';
import DoctorProfile from '../components/DoctorProfile';        
import DoctorProfilePage from '../components/DoctorProfile7';
import MySchedule from '../components/MySchedule';
import ViewPatients from '../components/ViewPatients';
import Footer from '../components/DFooter';
import Header from '../components/DHeader';
import PatientHistory from '../components/PatientHistory';
// Mocks
global.fetch = jest.fn();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Proper sessionStorage mock
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Mock console methods properly
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Doctor Components - Integration Tests', () => {
  let user;
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    fetch.mockReset();
    mockNavigate.mockReset();
    sessionStorageMock.clear();
    // Default logged-in doctor
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ doctor_id: 'D101', user_id: 'U101', full_name: 'Dr. Test' });
      return null;
    });
  });

  test('renders Consultation and handles patient selection + prescription', async () => {
    const patients = [{ 
      patient_id: 'P001', 
      full_name: 'John Doe', 
      date_of_birth: '1990-01-01',
      profile: 'patient1'
    }];
    
    fetch.mockResolvedValueOnce({ ok: true, json: async () => patients });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Consultation />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const selectButtons = screen.getAllByRole('button', { name: /Select/i });
    await user.click(selectButtons[0]);
    
    await waitFor(() => expect(screen.getByText(/Consultation with John Doe/i)).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Medicine'), 'Paracetamol');
    await user.type(screen.getByPlaceholderText('Dosage'), '500mg');
    await user.type(screen.getByPlaceholderText('Duration'), '5 days');
    await user.type(screen.getByPlaceholderText('Diagnosis'), 'Viral Fever');

    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Prescription saved' }) });
    await user.click(screen.getByRole('button', { name: 'Save Prescription' }));

    await waitFor(() => 
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/prescriptions'),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  test('DoctorHome (DoctorProfile.jsx) - search, reschedule, cancel', async () => {
    const appointments = [{
      appointment_id: 'A99',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00 AM',
      patient_id: 'P001',
      status: 'Scheduled'
    }];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => appointments });

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorProfile />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('P001')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Search patients by id/i), 'P001');

    const rescheduleButtons = screen.getAllByRole('button', { name: 'Reschedule' });
    await user.click(rescheduleButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/doctor/patients', expect.any(Object));

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    await user.click(cancelButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Cancel Appointment')).toBeInTheDocument());
    
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Appointment cancelled' }) });
    await user.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

    await waitFor(() => 
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/A99/cancel'),
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });

  test('DoctorProfilePage (DoctorProfile7.js) - shows profile data', async () => {
    const profile = {
      full_name: 'Dr. Sarah Johnson',
      date_of_birth: '1975-05-20',
      email: 'sarah@hospital.com',
      contact_number: '9876543210',
      password: '*****',
      specialization: 'Neurology',
      hire_date: '2005-03-01',
      salary: '350000'
    };

    fetch.mockResolvedValueOnce({ ok: true, json: async () => profile });

    render(
      <BrowserRouter>
        <AuthProvider>
          <DoctorProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Neurology')).toBeInTheDocument();
      expect(screen.getByText('sarah@hospital.com')).toBeInTheDocument();
    });
  });

  test('MySchedule - reschedule and cancel appointment', async () => {
    const appointments = [{ 
      appointment_id: 'A5', 
      patient_id: 'P002', 
      appointment_time: '14:00', 
      status: 'Scheduled' 
    }];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => appointments });

    render(
      <BrowserRouter>
        <AuthProvider>
          <MySchedule />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('P002')).toBeInTheDocument());

    const rescheduleButtons = screen.getAllByRole('button', { name: 'Reschedule' });
    await user.click(rescheduleButtons[0]);
    expect(mockNavigate).toHaveBeenCalled();

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    await user.click(cancelButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Confirm Cancelation')).toBeInTheDocument());
    
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Appointment cancelled' }) });
    await user.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

    await waitFor(() => 
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/A5/cancel'),
        expect.any(Object)
      )
    );
  });

  test('ViewPatients - search, view history, edit patient', async () => {
    const patients = [{ 
      patient_id: 'P003', 
      full_name: 'Alice Brown',
      date_of_birth: '1985-05-15',
      appointment_time: '10:00 AM',
      status: 'Confirmed', 
      contact_number: '1234567890',
      profile: 'patient2',
      medicalSummary: 'General checkup',
      notes: 'No allergies',
      appointment_id: 'A100'
    }];
    
    const history = [{ 
      diagnosis_id: 10, 
      diagnosis_date: '2025-01-01', 
      description: 'Migraine' 
    }];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => patients })
      .mockResolvedValueOnce({ ok: true, json: async () => history });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ViewPatients />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Alice Brown')).toBeInTheDocument());

    const viewHistoryButtons = screen.getAllByRole('button', { name: /View History/i });
    await user.click(viewHistoryButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Patient History')).toBeInTheDocument());

    
    const closeButtons = screen.getAllByRole('button', { name: '×' });
    if (closeButtons.length > 0) {
      await user.click(closeButtons[0]);
    }

    const editButtons = screen.getAllByRole('button', { name: /Edit Info/i });
    await user.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/Edit Patient/i) || screen.getByText(/Alice Brown/i)).toBeInTheDocument();
    });
  });

  test('DFooter renders', () => {
    render(<Footer />);
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
  });

  test('DHeader renders with navigation links', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Healthify')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Patients/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Consultations/i })).toBeInTheDocument();
  });

    //PatientHistory Tests
  test('renders PatientHistory and displays patient list', async () => {
    const mockPatients = [
      { patient_id: 'P001', full_name: 'John Doe', profile: 'patient1' },
      { patient_id: 'P002', full_name: 'Jane Smith', profile: 'patient2' }
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPatients });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Patient History')).toBeInTheDocument();
      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('PatientHistory handles patient selection and fetches history', async () => {
    const mockPatients = [
      { patient_id: 'P001', full_name: 'John Doe', profile: 'patient1' }
    ];

    const mockHistory = [
      { date: '2024-01-15', diagnosis: 'Common Cold', prescription: 'Rest and fluids' },
      { date: '2024-03-20', diagnosis: 'Flu', prescription: 'Tamiflu' }
    ];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPatients })
      .mockResolvedValueOnce({ ok: true, json: async () => mockHistory });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

    await waitFor(() => {
      // Check for the partial text in the heading
      expect(screen.getByText('History of')).toBeInTheDocument();
      // Check for the actual history data
      expect(screen.getByText('Common Cold')).toBeInTheDocument();
      expect(screen.getByText('Rest and fluids')).toBeInTheDocument();
      expect(screen.getByText('Flu')).toBeInTheDocument();
      expect(screen.getByText('Tamiflu')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3002/api/prescriptions/P001');
  });

  test('PatientHistory shows loading state when fetching history', async () => {
    const mockPatients = [
      { patient_id: 'P001', full_name: 'John Doe', profile: 'patient1' }
    ];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPatients })
      .mockResolvedValueOnce(new Promise(() => {}));

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  test('PatientHistory shows no history message when no data available', async () => {
    const mockPatients = [
      { patient_id: 'P001', full_name: 'John Doe', profile: 'patient1' }
    ];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPatients })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

    await waitFor(() => {
      expect(screen.getByText('No history available')).toBeInTheDocument();
    });
  });

  test('PatientHistory handles API error when fetching patients', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Patient History')).toBeInTheDocument();
      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    });
  });

  test('PatientHistory handles API error when fetching history', async () => {
    const mockPatients = [
      { patient_id: 'P001', full_name: 'John Doe', profile: 'patient1' }
    ];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPatients })
      .mockResolvedValueOnce({ ok: false });

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientHistory />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

  
    await waitFor(() => {
      expect(screen.getByText('No history available')).toBeInTheDocument();
    });
  });
  
});