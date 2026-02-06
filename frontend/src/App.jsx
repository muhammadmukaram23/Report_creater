import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SchemeDetails from './pages/SchemeDetails';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 text-slate-800">
        <Toaster position="top-right" />
        <Navbar />
        <main className="container mx-auto" style={{ maxWidth: '1400px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheme/:gs_no"
              element={
                <ProtectedRoute>
                  <SchemeDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <footer className="py-8 text-center text-slate-400 text-xs">
          <p>Made by Muhammad Mukaram Happy Coding! 😊</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
