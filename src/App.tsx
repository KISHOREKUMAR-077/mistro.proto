import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home.tsx';
import Login from './Pages/Login.tsx';
import Signup from './Pages/Signup.tsx';
import Booking from './Pages/Booking.tsx';
import WorkerRegister from './Pages/WorkerRegister.tsx';
import WorkerLogin from './Pages/WorkerLogin.tsx';
import WorkerDashboard from './Pages/WorkerDashboard.tsx';
import AdminDashboard from './Pages/AdminDashboard.tsx';
import IntroGateway from './Pages/IntroGateway.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portal" element={<IntroGateway />} />
        <Route path="/intro" element={<IntroGateway />} />
        <Route path="/gateway" element={<IntroGateway />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/worker/register" element={<WorkerRegister />} />
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
