import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from './components/common/Toast';
import AppRouter from './routes/AppRouter';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
