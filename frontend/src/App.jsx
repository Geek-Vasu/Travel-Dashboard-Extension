import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import EmailScanner from './pages/EmailScanner';
import Dashboard from './pages/Dashboard';
import TripDetail from './pages/TripDetail';
import ExtractionValidation from './pages/ExtractionValidation';
import ChatButton from './components/ChatButton';
import ChatDrawer from './components/ChatDrawer';

function AppContent() {
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      {/* Sidebar for logged-in user experience */}
      {!isLanding && (
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      )}

      {/* Main content wrapper */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{ paddingLeft: isLanding ? 0 : (sidebarExpanded ? 260 : 80) }}
      >
        {/* Render standard Top Navbar only on landing page */}
        {isLanding && <Navbar />}

        <main className="flex-1 flex flex-col bg-[#F8FAFC]">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/scan" element={<EmailScanner />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trip/:id" element={<TripDetail />} />
            <Route path="/validate" element={<ExtractionValidation />} />
          </Routes>
        </main>


      </div>

      {!isLanding && (
        <>
          <ChatButton onClick={() => setChatOpen(!chatOpen)} isOpen={chatOpen} />
          <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
