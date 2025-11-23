// src/setupTests.js
import '@testing-library/jest-dom';

// Global mocks for all tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '1' }),
  useLocation: () => ({ pathname: '/' }),
}));

jest.mock('./components/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    logout: jest.fn(),
  }),
}));