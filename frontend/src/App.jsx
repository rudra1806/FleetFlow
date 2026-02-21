import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import './components/layout/Layout.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* 🔓 Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 🔐 Dashboard + Profile - All Logged Users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* 🚛 Vehicles — All roles can view, Manager can CRUD */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['manager', 'dispatcher', 'safety_officer', 'financial_analyst']} />
            }
          >
            <Route path="/vehicles" element={<Vehicles />} />
          </Route>

          {/* 🚛 Drivers, Trips — Manager + Dispatcher */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['manager', 'dispatcher']} />
            }
          >
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
          </Route>

          {/* 🛠 Maintenance
              Manager + Safety Officer */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['manager', 'safety_officer']} />
            }
          >
            <Route path="/maintenance" element={<Maintenance />} />
          </Route>

          {/* 💰 Expenses + Analytics
              Manager + Financial Analyst */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['manager', 'financial_analyst']} />
            }
          >
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          {/* 🔁 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;