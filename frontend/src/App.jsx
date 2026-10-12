import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';

// 18 Page Imports
import { HomePage } from './pages/HomePage';
import { TrainSearchPage } from './pages/TrainSearchPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TrainDetailsPage } from './pages/TrainDetailsPage';
import { PassengerBookingPage } from './pages/PassengerBookingPage';
import { PaymentDemoPage } from './pages/PaymentDemoPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { ETicketPage } from './pages/ETicketPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LiveStatusPage } from './pages/LiveStatusPage';
import { AiRecommendationsPage } from './pages/AiRecommendationsPage';
import { DemandAnalyticsPage } from './pages/DemandAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<TrainSearchPage />} />
              <Route path="/results" element={<SearchResultsPage />} />
              <Route path="/trains/:id" element={<TrainDetailsPage />} />
              <Route path="/booking/new" element={<PassengerBookingPage />} />
              <Route path="/payment/:reference" element={<PaymentDemoPage />} />
              <Route path="/booking/confirmed/:reference" element={<BookingConfirmationPage />} />
              <Route path="/ticket/:reference" element={<ETicketPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/bookings/:reference" element={<BookingDetailsPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/live-status" element={<LiveStatusPage />} />
              <Route path="/ai-recommendations" element={<AiRecommendationsPage />} />
              <Route path="/analytics" element={<DemandAnalyticsPage />} />
              <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
