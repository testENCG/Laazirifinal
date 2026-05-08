import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChauffeurDashboard from './pages/ChauffeurDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer />
        <Navbar />
        <main style={{ minHeight: '80vh' }}>
          <Routes>
            {/* Routes Publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />

            {/* Routes Protégées - Client */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Routes Protégées - Agence */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['agence']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Routes Protégées - Chauffeur */}
            <Route 
              path="/chauffeur/*" 
              element={
                <ProtectedRoute allowedRoles={['chauffeur']}>
                  <ChauffeurDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
