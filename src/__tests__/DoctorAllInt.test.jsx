// src/__tests__/DoctorAll.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import Consultation from '../components/Consultation';
import DoctorProfile from '../components/DoctorProfile';        
import DoctorProfilePage from '../components/DoctorProfile7';    //This is the actual profile page
import MySchedule from '../components/MySchedule';
import ViewPatients from '../components/ViewPatients';
import Footer from '../components/DFooter';
import Header from '../components/DHeader';

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
  beforeEach(() => {
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

    // Click the Select button instead of the patient name
    const selectButtons = screen.getAllByRole('button', { name: /Select/i });
    fireEvent.click(selectButtons[0]);
    
    // Check for consultation section (it shows "Consultation with John Doe")
    await waitFor(() => expect(screen.getByText(/Consultation with John Doe/i)).toBeInTheDocument());

    // Fill prescription
    fireEvent.change(screen.getByPlaceholderText('Medicine'), { target: { value: 'Paracetamol' } });
    fireEvent.change(screen.getByPlaceholderText('Dosage'), { target: { value: '500mg' } });
    fireEvent.change(screen.getByPlaceholderText('Duration'), { target: { value: '5 days' } });
    fireEvent.change(screen.getByPlaceholderText('Diagnosis'), { target: { value: 'Viral Fever' } });

    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Prescription saved' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Save Prescription' }));

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

    fireEvent.change(screen.getByPlaceholderText(/Search patients by id/i), { target: { value: 'P001' } });

    const rescheduleButtons = screen.getAllByRole('button', { name: 'Reschedule' });
    fireEvent.click(rescheduleButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/doctor/patients', expect.any(Object));

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Cancel Appointment')).toBeInTheDocument());
    
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Appointment cancelled' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

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
    fireEvent.click(rescheduleButtons[0]);
    expect(mockNavigate).toHaveBeenCalled();

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Confirm Cancelation')).toBeInTheDocument());
    
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Appointment cancelled' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

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
    fireEvent.click(viewHistoryButtons[0]);
    
    await waitFor(() => expect(screen.getByText('Patient History')).toBeInTheDocument());

    // Close the history modal and test edit
    const closeButtons = screen.getAllByRole('button', { name: '×' });
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
    }

    const editButtons = screen.getAllByRole('button', { name: /Edit Info/i });
    fireEvent.click(editButtons[0]);
    
    // The EditPatient component might show different text, adjust as needed
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
});