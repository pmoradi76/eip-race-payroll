import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TrustBadges } from './components/TrustBadges';
import { HowItWorks } from './components/HowItWorks';
import { UseCasesByRole } from './components/UseCasesByRole';
import { DemoPreview } from './components/DemoPreview';
import { KeyFeatures } from './components/KeyFeatures';
import { SecuritySection } from './components/SecuritySection';
import { Footer } from './components/Footer';
import { SignInPage } from './components/SignInPage';
import { LoginForm } from './components/LoginForm';
import { EmployeeSignUp } from './components/auth/EmployeeSignUp';
import { OrganisationSignUp } from './components/auth/OrganisationSignUp';
import { EmployeeDashboardPage } from './components/dashboards/EmployeeDashboardPage';
import { OrganisationDashboardWrapper } from './components/dashboards/OrganisationDashboardWrapper';
import { AdminDashboardWrapper } from './components/dashboards/AdminDashboardWrapper';

type View = 'landing' | 'signin' | 'login' | 'signup' | 'employee' | 'organisation' | 'admin';
type UserType = 'employee' | 'organisation' | 'admin' | null;

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

  const handleSignIn = () => {
    setCurrentView('signin');
  };

  const handleSelectUserType = (userType: 'employee' | 'organisation' | 'admin') => {
    setSelectedUserType(userType);
    setCurrentView('login');
  };

  const handleLogin = () => {
    if (selectedUserType) {
      setCurrentView(selectedUserType);
    }
  };

  const handleBackToSignIn = () => {
    setSelectedUserType(null);
    setCurrentView('signin');
  };

  const handleBackToLanding = () => {
    setSelectedUserType(null);
    setCurrentView('landing');
  };

  const handleLogout = () => {
    setSelectedUserType(null);
    setCurrentView('landing');
  };

  const handleSignUp = () => {
    setCurrentView('signup');
  };

  const handleSignUpSuccess = () => {
    setCurrentView('login');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  const handleEmployeeClick = () => {
    setSelectedUserType('employee');
    setCurrentView('login');
  };

  const handleOrganisationClick = () => {
    setSelectedUserType('organisation');
    setCurrentView('login');
  };

  const handleAdminClick = () => {
    setSelectedUserType('admin');
    setCurrentView('login');
  };

  return (
    <>
      {currentView === 'landing' && (
        <div className="min-h-screen bg-white">
          <Header onSignIn={handleSignIn} />
          <main>
            <HeroSection 
              onEmployeeClick={handleEmployeeClick}
              onOrganisationClick={handleOrganisationClick}
              onAdminClick={handleAdminClick}
            />
            <TrustBadges />
            <HowItWorks />
            <UseCasesByRole />
            <DemoPreview />
            <KeyFeatures />
            <SecuritySection />
          </main>
          <Footer />
        </div>
      )}
      
      {currentView === 'signin' && (
        <SignInPage 
          onSelectUserType={handleSelectUserType}
          onBackToLanding={handleBackToLanding}
        />
      )}

      {currentView === 'login' && selectedUserType && (
        <LoginForm 
          userType={selectedUserType}
          onLogin={handleLogin}
          onBack={handleBackToSignIn}
          onSignUp={handleSignUp}
        />
      )}
      
      {currentView === 'signup' && selectedUserType && (
        <>
          {selectedUserType === 'employee' && (
            <EmployeeSignUp 
              onSignUpSuccess={handleSignUpSuccess} 
              onBack={handleBackToSignIn}
              onSwitchToLogin={handleBackToLogin}
            />
          )}
          {selectedUserType === 'organisation' && (
            <OrganisationSignUp 
              onSignUpSuccess={handleSignUpSuccess}
              onBack={handleBackToSignIn}
              onSwitchToLogin={handleBackToLogin}
            />
          )}
        </>
      )}
      
      {currentView === 'employee' && <EmployeeDashboardPage onLogout={handleLogout} />}
      {currentView === 'organisation' && <OrganisationDashboardWrapper onLogout={handleLogout} />}
      {currentView === 'admin' && <AdminDashboardWrapper onLogout={handleLogout} />}
    </>
  );
}