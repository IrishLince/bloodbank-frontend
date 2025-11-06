import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import favicon from './assets/Logo.png'; // Replace with your actual logo path
import { isAuthenticated, validateTokenWithBackend } from './utils/auth';


import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/Forgotpassword';
import AboutUs from './components/aboutus';
import SuccessfulLogin from './components/SuccesfulLogin';
import DonationCenter from './components/Donor/DonationCenter';
import Schedule from './components/Donor/Schedule';
import EligibilityCheck from './components/Donor/EligibilityCheck';
import EligibilityCheck2 from './components/Donor/EligibilityCheck2';
import EligibilityCheck3 from './components/Donor/EligibilityCheck3';
import ConfirmAppointment from './components/Donor/ConfirmAppointment';
import AppointmentDetails from './components/Donor/AppointmentDetails';
import RewardsSystem from './components/Donor/RewardsSystem';

import BloodRequestForm from './components/Hospital/BloodRequestForm'
import SuccessfulRequest from './components/Hospital/SuccessfulRequest';
import HospitalProfile from './components/Hospital/Profile';
import HospitalRewards from './components/Hospital/HospitalRewards';
import HospitalDemo from './components/Hospital/HospitalDemo';
import HospitalListWithCover from './components/Hospital/HospitalListWithCover';

import { Layout } from './components/Layout';
import DonorProfile from './components/Donor/Profile';
import FAQs from './components/FAQS'
import DonationHistory from './components/Donor/DonationHistory'; 
import ListOfAppointments from './components/Donor/ListOfAppointments'
import DonorSettings from './components/Donor/Settings'
import ArchivedAccountGuard from './components/Donor/ArchivedAccountGuard';

import 'react-datepicker/dist/react-datepicker.css';


import HospitalList from './components/Bloodbank/HospitalList';
import RequestList from './components/Bloodbank/RequestList';
import ScheduleBloodbank from './components/Bloodbank/Schedule';
import RequestSheet from './components/Bloodbank/RequestSheet';
import AdminProfile from './components/Bloodbank/Profile';
import Inventory from './components/Bloodbank/Inventory';
import AdminDonationList from './components/Bloodbank/AdminDonationList';
import RequestStatus from './components/Hospital/RequestStatus';
import DeliveryStatus from './components/Hospital/DeliveryStatus';
import BloodBankRewards from './components/Bloodbank/BloodBankRewards';
import AllInventories from './components/Admin/AllInventories';

// Admin components
import AdminDashboard from './components/Admin/AdminDashboard';
import RegisterHospital from './components/Admin/RegisterHospital';
import RegisterBloodBank from './components/Admin/RegisterBloodBank';
import HospitalsList from './components/Admin/HospitalsList';
import BloodBanksList from './components/Admin/BloodBanksList';
import Logging from './components/Admin/Logging';
import AllRequests from './components/Admin/AllRequests';
import AllDeliveries from './components/Admin/AllDeliveries';
import AllDonations from './components/Admin/AllDonations';
import AllRewardRedemptions from './components/Admin/AllRewardRedemptions';
import ManageRewards from './components/Admin/ManageRewards';

import 'react-datepicker/dist/react-datepicker.css';

const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    // Set favicon
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = favicon;
    document.getElementsByTagName('head')[0].appendChild(link);

    // Update title based on route
    const pathToTitleMap = {
      '/homepage': 'RedSource - Home',
      '/login': 'RedSource - Login',
      '/signup': 'RedSource - Signup',
      '/forgot-password': 'RedSource - Reset Password',
      '/about-us': 'RedSource - About Us',

      '/donation-center': 'RedSource - Donation Centers',
      '/schedule': 'RedSource - Schedule Donation',
      '/eligibility': 'RedSource - Eligibility Check',
      '/eligibility-step2': 'RedSource - Medical History',
      '/eligibility-step3': 'RedSource - Donor Interview',
      '/profile-page': 'RedSource - My Profile',
      '/settings': 'RedSource - Settings',
      '/rewards': 'RedSource - Reward Points',
      '/faqs': 'RedSource - FAQs',
      '/hospital': 'RedSource - Hospital Dashboard',
      '/requests': 'RedSource - Blood Requests',
      '/request-status': 'RedSource - Request Status',
      '/delivery-status': 'RedSource - Delivery Status',
      '/hospital-rewards': 'RedSource - Hospital Rewards',
      '/bloodbank/rewards': 'RedSource - Blood Bank Rewards',
      
      // Admin routes
      '/admin/dashboard': 'RedSource - Admin Dashboard',
      '/admin/register-hospital': 'RedSource - Register Hospital',
      '/admin/register-bloodbank': 'RedSource - Register Blood Bank',
      '/admin/hospitals': 'RedSource - Hospitals List',
      '/admin/bloodbanks': 'RedSource - Blood Banks List',
      '/admin/logging': 'RedSource - System Logging',
      '/admin/logging/requests': 'RedSource - All Requests',
      '/admin/logging/deliveries': 'RedSource - All Deliveries',
      '/admin/logging/donations': 'RedSource - All Donations',
      '/admin/logging/redemptions': 'RedSource - All Reward Redemptions',
      '/admin/rewards': 'RedSource - Manage Rewards',
      '/admin/inventories': 'RedSource - All Inventories'
    };

    document.title = pathToTitleMap[location.pathname] || 'RedSource';
  }, [location]);

  return null;
};

// Protected Route for Eligibility Steps
const ProtectedEligibilityRoute = ({ stepRequired, children }) => {
  const currentStep = Number(localStorage.getItem('eligibilityStep')) || -1;

  // Redirect to donation-center if step is not yet reached
  if (currentStep < stepRequired) {
    return <Navigate to="/donation-center" replace />;
  }

  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [eligibilityStep, setEligibilityStep] = useState(0);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('userToken');
      const role = localStorage.getItem('userRole');
      const savedStep = localStorage.getItem('eligibilityStep');
      
      if (token) {
        // Enhanced authentication check with backend validation
        const isValidToken = await validateTokenWithBackend();
        if (isValidToken) {
          setIsLoggedIn(true);
          setUserRole(role || '');
        } else {
          // Token is invalid, clear everything
          setIsLoggedIn(false);
          setUserRole('');
          localStorage.clear(); // Clear invalid tokens
        }
      } else {
        setIsLoggedIn(false);
        setUserRole('');
      }

      if (savedStep) {
        setEligibilityStep(Number(savedStep));
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('eligibilityStep', eligibilityStep);
  }, [eligibilityStep]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <TitleUpdater />
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-600"></div>
          </div>
        }>
          <Routes>
            {/* Default route based on login status */}
            <Route
              path="/"
              element={isLoggedIn ? (
                userRole?.toLowerCase().includes('donor') ? (
                  <ArchivedAccountGuard><SuccessfulLogin /></ArchivedAccountGuard>
                ) : (
                  <SuccessfulLogin />
                )
              ) : (
                <Navigate to="/homepage" />
              )}
            />

            <Route path="/homepage" element={<Home />} />
            <Route 
              path="/login" 
              element={isLoggedIn ? <Navigate to="/" /> : <Login setIsLoggedIn={setIsLoggedIn} />} 
            />
            <Route path="/faqs" element={<FAQs />} />
            <Route 
              path="/signup" 
              element={isLoggedIn ? <Navigate to="/" /> : <Signup />} 
            />
            <Route 
              path="/forgot-password" 
              element={isLoggedIn ? <Navigate to="/" /> : <ForgotPassword />} 
            />
            <Route path="/about-us" element={<AboutUs />} />
            
            {/* Demo Routes - Hospital Cover Components */}
            <Route path="/hospital-demo" element={<HospitalDemo />} />
            <Route path="/hospital-list-demo" element={<HospitalListWithCover />} />
            

            {/* Protected routes */}
            {isLoggedIn ? (
              <>
                {/* Common routes for all authenticated users */}

                <Route path="/about-us" element={<AboutUs />} />
                

                               {/* Donor-specific routes */}
{userRole?.toLowerCase().includes('donor') && (
  <>
    {/* STEP -1: Donation Center */}
    <Route
      path="/donation-center"
      element={
        <ArchivedAccountGuard>
          <ProtectedEligibilityRoute stepRequired={-1}>
            <DonationCenter />
          </ProtectedEligibilityRoute>
        </ArchivedAccountGuard>
      }
    />

    {/* STEP 0: Schedule */}
    <Route
      path="/schedule"
      element={
        <ArchivedAccountGuard>
          <ProtectedEligibilityRoute stepRequired={0}>
            <Schedule />
          </ProtectedEligibilityRoute>
        </ArchivedAccountGuard>
      }
    />

    {/* STEP 1: EligibilityCheck */}
    <Route
      path="/eligibility"
      element={
        <ArchivedAccountGuard>
          <ProtectedEligibilityRoute stepRequired={1}>
            <EligibilityCheck />
          </ProtectedEligibilityRoute>
        </ArchivedAccountGuard>
      }
    />

    {/* STEP 2: EligibilityCheck2 */}
    <Route
      path="/eligibility-step2"
      element={
        <ArchivedAccountGuard>
          <ProtectedEligibilityRoute stepRequired={2}>
            <EligibilityCheck2 setEligibilityStep={setEligibilityStep} />
          </ProtectedEligibilityRoute>
        </ArchivedAccountGuard>
      }
    />

    {/* STEP 3: EligibilityCheck3 */}
    <Route
      path="/eligibility-step3"
      element={
        <ArchivedAccountGuard>
          <ProtectedEligibilityRoute stepRequired={3}>
            <EligibilityCheck3 setEligibilityStep={setEligibilityStep} />
          </ProtectedEligibilityRoute>
        </ArchivedAccountGuard>
      }
    />
                    <Route path="/confirm-appointment" element={<ArchivedAccountGuard><ConfirmAppointment /></ArchivedAccountGuard>} />
                    <Route path="/appointment-details" element={<ArchivedAccountGuard><AppointmentDetails /></ArchivedAccountGuard>} />
                    <Route path="/donation-history" element={<ArchivedAccountGuard><DonationHistory /></ArchivedAccountGuard>} />
                    <Route path="/list-of-appointments" element={<ArchivedAccountGuard><ListOfAppointments /></ArchivedAccountGuard>} />
                    <Route path="/rewards" element={<ArchivedAccountGuard><RewardsSystem /></ArchivedAccountGuard>} />
                    <Route path="/profile-page" element={<ArchivedAccountGuard><DonorProfile /></ArchivedAccountGuard>} />
                    <Route path="/settings" element={<ArchivedAccountGuard><DonorSettings /></ArchivedAccountGuard>} />
                  </>
                )}

                {/* Hospital-specific routes */}
                {(userRole === 'Hospital' || userRole === 'ROLE_HOSPITAL') && (
                  <>
                    <Route path="/hospital" element={<BloodRequestForm />} />
                    <Route path="/successful-request" element={<SuccessfulRequest />} />
                    <Route path="/welcome-message" element={<BloodRequestForm />} /> 
                    <Route path="/profile-page" element={<HospitalProfile />} />
                    <Route path="/request-status" element={<RequestStatus />} />
                    <Route path="/delivery-status" element={<DeliveryStatus />} />
                    <Route path="/hospital-rewards" element={<HospitalRewards />} />
                  </>
                )}

                {/* BloodBankAdmin-specific routes */}
                {(userRole === 'BloodBankAdmin' || userRole === 'ROLE_BLOODBANK') && (
                  <>
                    <Route path="/hospital" element={<HospitalList />} />
                    <Route path="/requests" element={<RequestList />} />
                    <Route path="/schedule" element={<ScheduleBloodbank />} />
                    <Route path="/request-sheet" element={<RequestSheet />} />
                    <Route path="/profile-page" element={<AdminProfile />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/list-of-donation" element={<AdminDonationList />} />
                    <Route path="/bloodbank/rewards" element={<BloodBankRewards />} />
                  </>
                )}

                {/* Admin-specific routes */}
                {(userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') && (
                  <>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/register-hospital" element={<RegisterHospital />} />
                    <Route path="/admin/register-bloodbank" element={<RegisterBloodBank />} />
                    <Route path="/admin/hospitals" element={<HospitalsList />} />
                    <Route path="/admin/bloodbanks" element={<BloodBanksList />} />
                    <Route path="/admin/logging" element={<Logging />} />
                    <Route path="/admin/logging/requests" element={<AllRequests />} />
                    <Route path="/admin/logging/deliveries" element={<AllDeliveries />} />
                    <Route path="/admin/logging/donations" element={<AllDonations />} />
                    <Route path="/admin/logging/redemptions" element={<AllRewardRedemptions />} />
                    <Route path="/admin/rewards" element={<ManageRewards />} />
                    <Route path="/admin/inventories" element={<AllInventories />} />
                  </>
                )}
              </>
            ) : (
              // Redirect to login if trying to access protected routes while not logged in
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
