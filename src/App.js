import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout Components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Dashboard from './pages/main/Dashboard';
import Modules from './pages/main/Modules';

// Patient Pages
import PatientList from './pages/patient/PatientList';
import PatientView from './pages/patient/PatientView';
import PatientCreate from './pages/patient/PatientCreate';
import PatientEdit from './pages/patient/PatientEdit';

// Sample Pages
import SampleList from './pages/sample/SampleList';
import SampleView from './pages/sample/SampleView';
import SampleCreate from './pages/sample/SampleCreate';
import SampleRouting from './pages/sample/SampleRouting';
import SampleTransferCreate from './pages/sample/SampleTransferCreate';
import SampleDispatch from './pages/sample/SampleDispatch';
import SampleTransferView from './pages/sample/SampleTransferView';

// Result Pages
import ResultList from './pages/result/ResultList';
import ResultView from './pages/result/ResultView';
import ResultCreate from './pages/result/ResultCreate';
import ResultEdit from './pages/result/ResultEdit';
import ResultReports from './pages/result/ResultReports';
import ResultReportDetail from './pages/results/ResultReportDetail';
import ResultReportPrint from './pages/results/ResultReportPrint';
import ResultReportDownload from './pages/results/ResultReportDownload';
import ResultReportEmail from './pages/results/ResultReportEmail';
import ResultReportWhatsApp from './pages/results/ResultReportWhatsApp';

// Billing Pages
import BillingList from './pages/billing/BillingList';
import BillingView from './pages/billing/BillingView';
import BillingCreate from './pages/billing/BillingCreate';
import BillingEdit from './pages/billing/BillingEdit';
import BillingCollect from './pages/billing/BillingCollect';

// Lab Pages
import LabDashboard from './pages/lab/LabDashboard';
import LabProcess from './pages/lab/LabProcess';
import QualityControl from './pages/lab/QualityControl';

// Inventory Pages
import InventoryList from './pages/inventory/InventoryList';
import InventoryView from './pages/inventory/InventoryView';
import InventoryCreate from './pages/inventory/InventoryCreate';
import InventoryEdit from './pages/inventory/InventoryEdit';
import InventoryTransactions from './pages/inventory/InventoryTransactions';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import UserView from './pages/admin/UserView';
import UserCreate from './pages/admin/UserCreate';
import UserEdit from './pages/admin/UserEdit';
import Settings from './pages/admin/Settings';
import MasterData from './pages/admin/MasterData';
import TechnicalMasterData from './pages/admin/TechnicalMasterData';
import Analytics from './pages/admin/Analytics';
import WhatsAppConfig from './pages/admin/WhatsAppConfig';
import WhatsAppMessages from './pages/admin/WhatsAppMessages';
import DoctorManagement from './pages/admin/DoctorManagement';
import DoctorCreate from './pages/admin/DoctorCreate';
import TestCategoryManagement from './pages/admin/TestCategoryManagement';
import TestCreate from './pages/admin/TestCreate';
import TestPanelManagement from './pages/admin/TestPanelManagement';
import ContainerManagement from './pages/admin/ContainerManagement';
import FranchiseCreate from './pages/admin/FranchiseCreate';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';
import SampleTypeManagement from './pages/admin/SampleTypeManagement';
import TestManagement from './pages/admin/TestManagement';

// Not Found Page
import NotFound from './pages/NotFound';
import SampleEdit from './pages/sample/SampleEdit';
import FranchiseView from './pages/admin/FranchiseView';
import FranchiseEdit from './pages/admin/FranchiseEdit';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modules" element={<Modules />} />

        {/* Patient Routes */}
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/create" element={<PatientCreate />} />
        <Route path="/patients/:id" element={<PatientView />} />
        <Route path="/patients/:id/edit" element={<PatientEdit />} />

        {/* Sample Routes */}
        <Route path="/samples" element={<SampleList />} />
        <Route path="/samples/create" element={<SampleCreate />} />
        <Route path="/samples/routing" element={<SampleRouting />} />
        <Route path="/samples/routing/create" element={<SampleTransferCreate />} />
        <Route path="/samples/routing/:id" element={<SampleTransferView />} />
        <Route path="/samples/routing/:id/dispatch" element={<SampleDispatch />} />
        <Route path="/samples/:id" element={<SampleView />} />
        <Route path="/samples/:id/edit" element={<SampleEdit />} />

        {/* Result Routes */}
        <Route path="/results" element={<ResultList />} />
        <Route path="/results/create" element={<ResultCreate />} />
        <Route path="/results/reports" element={<ResultReports />} />
        <Route path="/results/reports/:id" element={<ResultReportDetail />} />
        <Route path="/results/reports/:id/print" element={<ResultReportPrint />} />
        <Route path="/results/reports/:id/download" element={<ResultReportDownload />} />
        <Route path="/results/reports/:id/email" element={<ResultReportEmail />} />
        <Route path="/results/reports/:id/whatsapp" element={<ResultReportWhatsApp />} />
        <Route path="/results/:id" element={<ResultView />} />
        <Route path="/results/:id/edit" element={<ResultEdit />} />

        {/* Billing Routes */}
        <Route path="/billing" element={<BillingList />} />
        <Route path="/billing/create" element={<BillingCreate />} />
        <Route path="/billing/:id" element={<BillingView />} />
        <Route path="/billing/:id/edit" element={<BillingEdit />} />
        <Route path="/billing/:id/collect" element={<BillingCollect />} />

        {/* Lab Routes */}
        <Route path="/lab" element={<LabDashboard />} />
        <Route path="/lab/process" element={<LabProcess />} />
        <Route path="/lab/quality-control" element={<QualityControl />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/create" element={<InventoryCreate />} />
        <Route path="/inventory/:id" element={<InventoryView />} />
        <Route path="/inventory/:id/edit" element={<InventoryEdit />} />
        <Route path="/inventory/:id/transactions" element={<InventoryTransactions />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/create" element={<UserCreate />} />
        <Route path="/admin/users/:id" element={<UserView />} />
        <Route path="/admin/users/:id/edit" element={<UserEdit />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/master-data" element={<MasterData />} />
        <Route path="/admin/technical-master-data" element={<TechnicalMasterData />} />
        <Route path="/admin/whatsapp/config" element={<WhatsAppConfig />} />
        <Route path="/admin/whatsapp/messages" element={<WhatsAppMessages />} />
        <Route path="/admin/doctors" element={<DoctorManagement />} />
        <Route path="/admin/doctors/create" element={<DoctorCreate />} />
        <Route path="/admin/test-categories" element={<TestCategoryManagement />} />
        <Route path="/admin/tests/create" element={<TestCreate />} />
        <Route path="/admin/test-panels" element={<TestPanelManagement />} />
        <Route path="/admin/containers" element={<ContainerManagement />} />
        <Route path="/admin/franchises/create" element={<FranchiseCreate />} />
        <Route path="/admin/franchises/:id" element={<FranchiseView />} />
        <Route path="/admin/franchises/:id/edit" element={<FranchiseEdit />} />
        <Route path="/admin/roles" element={<RoleManagement />} />
        <Route path="/admin/permissions" element={<PermissionManagement />} />
        <Route path="/admin/sample-types" element={<SampleTypeManagement />} />
        <Route path="/admin/tests" element={<TestManagement />} />
      </Route>

      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
