
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PartsPage from './pages/PartsPage';
import MontajPage from "./pages/MontajPage";
import InventoryList from './pages/InventoryList';
import Navbar from './components/Navbar';
import { login,getCurrentUser } from './services/authService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="loading">Yükleniyor...</div>;
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    return (
      <>
        <Navbar user={user} setUser={setUser} />
        {children}
      </>
    );
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/parts" element={
          <ProtectedRoute>
            <PartsPage user={user} />
          </ProtectedRoute>
        } />
        
        <Route path="/assembly" element={
          <ProtectedRoute>
            <MontajPage user={user} />
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute>
            <InventoryList />
          </ProtectedRoute>
        } />
        


        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;