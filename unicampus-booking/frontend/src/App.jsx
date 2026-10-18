import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './context/BrandContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Analytics from './pages/Analytics';
import SpacesCatalog from './pages/spaces/SpacesCatalog';
import SpaceSchedule from './pages/spaces/SpaceSchedule';
import SpaceApplyForm from './pages/spaces/SpaceApplyForm';
import RecreationCatalog from './pages/recreation/RecreationCatalog';
import RecreationSuccess from './pages/recreation/RecreationSuccess';

export default function App() {
  return (
    <BrandProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/spaces" element={<SpacesCatalog />} />
              <Route path="/spaces/:id/schedule" element={<SpaceSchedule />} />
              <Route path="/spaces/:id/apply" element={<SpaceApplyForm />} />
              <Route path="/recreation" element={<RecreationCatalog />} />
              <Route path="/recreation/success/:id" element={<RecreationSuccess />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </BrandProvider>
  );
}