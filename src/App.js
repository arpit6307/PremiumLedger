// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase'; // Import auth for state change listener
import { onAuthStateChanged } from 'firebase/auth'; // Import for auth state listener
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CustomerDetails from './components/CustomerDetails';
import Ledger from './components/Ledger';
import Footer from './components/Footer';
import CustomNavbar from './components/CustomNavbar';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage'; 
import Reports from './components/Reports';
import CustomLoader from './components/CustomLoader'; // NEW IMPORT
import './App.css'; 

function App() {
  // NEW STATE: To track if Firebase authentication state check is complete
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // The presence of a user object means auth check is complete, 
      // regardless of whether the user is logged in or not.
      setIsAuthReady(true);
      // We don't set user state here as components will check auth.currentUser directly.
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show the custom loader until the Firebase auth check is complete
  if (!isAuthReady) {
    return <CustomLoader />;
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        
        <CustomNavbar /> 
        
        <div className="flex-grow-1 content-spacer"> 
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customer/:id" element={<CustomerDetails />} />
            <Route path="/ledger/:customerId/:policyId" element={<Ledger />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;