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
import ComprehensiveDashboard from './pages/main/ComprehensiveDashboard';
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
import BillingDashboard from './pages/billing/BillingDashboard';
import BillingList from './pages/billing/BillingList';
import BillingSearch from './pages/billing/BillingSearch';
import BillingView from './pages/billing/BillingView';
import BillingCreate from './pages/billing/BillingCreate';
import BillingEdit from './pages/billing/BillingEdit';
import BillingCollect from './pages/billing/BillingCollect';
import BillingRegistration from './pages/billing/BillingRegistration';
import BillingReports from './pages/billing/BillingReports';
import BillingReportsDetail from './pages/billing/BillingReportsDetail';
import BillingReportsAuthorize from './pages/billing/BillingReportsAuthorize';
import ReportAuthorization from './pages/billing/ReportAuthorization';
import InvoiceManagement from './pages/billing/InvoiceManagement';
import AIAnalytics from './pages/billing/AIAnalytics';
import DueAmountManagement from './pages/billing/DueAmountManagement';
import RefundManagement from './pages/billing/RefundManagement';
import BillCancel from './pages/billing/BillCancel';
import Collection from './pages/billing/Collection';

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
import MasterDataNew from './pages/admin/MasterDataNew';
import TechnicalMasterData from './pages/admin/TechnicalMasterData';
import UnifiedTestResultMasterPage from './pages/admin/UnifiedTestResultMasterPage';
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
import MobileTestPage from './pages/admin/MobileTestPage';
import GSTConfigMaster from './pages/admin/GSTConfigMaster';
import AccessManagement from './pages/admin/AccessManagement';
import SignatureManagement from './pages/admin/SignatureManagement';
import ProtectedRoute from './components/common/ProtectedRoute';

// Sample Routing Pages
import SampleRoutingDashboard from './pages/samples/routing/SampleRoutingDashboard';
import RoutingWorkflow from './pages/samples/routing/RoutingWorkflow';
import RoutingChat from './pages/samples/routing/RoutingChat';
import RoutingHistory from './pages/samples/routing/RoutingHistory';

// Not Found Page
import NotFound from './pages/NotFound';
import SampleEdit from './pages/sample/SampleEdit';
import FranchiseView from './pages/admin/FranchiseView';
import FranchiseEdit from './pages/admin/FranchiseEdit';
import ProfileMaster from './pages/ProfileMaster';


// Simple Protected Route Component for basic authentication
const SimpleProtectedRoute = ({ children }) => {
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
        <SimpleProtectedRoute>
          <MainLayout />
        </SimpleProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<ComprehensiveDashboard />} />
        <Route path="/dashboard/legacy" element={<Dashboard />} />
        <Route path="/modules" element={<Modules />} />

        {/* Patient Routes */}
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/create" element={<PatientCreate />} />
        <Route path="/patients/:id" element={<PatientView />} />
        <Route path="/patients/:id/edit" element={<PatientEdit />} />

        {/* Sample Routes */}
        <Route path="/samples" element={<SampleList />} />
        <Route path="/samples/create" element={<SampleCreate />} />
        <Route path="/samples/routing" element={<SampleRoutingDashboard />} />
        <Route path="/samples/routing/create" element={<SampleTransferCreate />} />
        <Route path="/samples/routing/:id" element={<RoutingWorkflow />} />
        <Route path="/samples/routing/:id/chat" element={<RoutingChat />} />
        <Route path="/samples/routing/:id/history" element={<RoutingHistory />} />
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
        <Route path="/billing" element={<BillingDashboard />} />
        <Route path="/billing/list" element={<BillingList />} />
        <Route path="/billing/search" element={<BillingSearch />} />
        <Route path="/billing/management" element={<InvoiceManagement />} />
        <Route path="/billing/create" element={<BillingCreate />} />
        <Route path="/billing/registration" element={<BillingRegistration />} />
        <Route path="/billing/reports" element={<BillingReports />} />
        <Route path="/billing/reports/authorize" element={<ReportAuthorization />} />
        <Route path="/billing/reports/:reportId/authorize" element={<BillingReportsAuthorize />} />
        <Route path="/billing/reports/:sid" element={<BillingReportsDetail />} />
        <Route path="/billing/analytics" element={<AIAnalytics />} />
        <Route path="/billing/:id" element={<BillingView />} />
        <Route path="/billing/:id/edit" element={<BillingEdit />} />
        <Route path="/billing/:id/collect" element={<BillingCollect />} />
        <Route path="/billing/due-close" element={<DueAmountManagement />} />
        <Route path="/billing/refund" element={<RefundManagement />} />
        <Route path="/billing/cancel" element={<BillCancel />} />
        <Route path="/billing/collection" element={<Collection />} />

        {/* Lab Routes */}
        <Route path="/lab" element={<LabDashboard />} />
        <Route path="/lab/process" element={<LabProcess />} />
        <Route path="/lab/quality-control" element={<QualityControl />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={
          <ProtectedRoute requiredModule="INVENTORY">
            <InventoryList />
          </ProtectedRoute>
        } />
        <Route path="/inventory/create" element={
          <ProtectedRoute requiredModule="INVENTORY">
            <InventoryCreate />
          </ProtectedRoute>
        } />
        <Route path="/inventory/:id" element={
          <ProtectedRoute requiredModule="INVENTORY">
            <InventoryView />
          </ProtectedRoute>
        } />
        <Route path="/inventory/:id/edit" element={
          <ProtectedRoute requiredModule="INVENTORY">
            <InventoryEdit />
          </ProtectedRoute>
        } />
        <Route path="/inventory/:id/transactions" element={
          <ProtectedRoute requiredModule="INVENTORY">
            <InventoryTransactions />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredModule="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute requiredModule="ADMIN">
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requiredModule="USER_MANAGEMENT">
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/create" element={
          <ProtectedRoute requiredModule="USER_MANAGEMENT">
            <UserCreate />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/:id" element={
          <ProtectedRoute requiredModule="USER_MANAGEMENT">
            <UserView />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/:id/edit" element={
          <ProtectedRoute requiredModule="USER_MANAGEMENT">
            <UserEdit />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute requiredModule="SETTINGS">
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/admin/master-data" element={
          <ProtectedRoute requiredModule="MASTER_DATA">
            <MasterData />
          </ProtectedRoute>
        } />
        <Route path="/admin/master-data-new" element={
          <ProtectedRoute requiredModule="MASTER_DATA">
            <MasterDataNew />
          </ProtectedRoute>
        } />
        <Route path="/admin/technical-master-data" element={
          <ProtectedRoute requiredModule="MASTER_DATA">
            <TechnicalMasterData />
          </ProtectedRoute>
        } />
        <Route path="/admin/unified-test-result-master" element={
          <ProtectedRoute requiredModule="MASTER_DATA">
            <UnifiedTestResultMasterPage />
          </ProtectedRoute>
        } />
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
        <Route path="/admin/mobile-test" element={<MobileTestPage />} />
        <Route path="/admin/gst-config" element={<GSTConfigMaster />} />
        <Route path="/admin/access-management" element={
          <ProtectedRoute requiredRole="hub_admin">
            <AccessManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/signature-management" element={
          <ProtectedRoute requiredModule="ADMIN">
            <SignatureManagement />
          </ProtectedRoute>
        } />

      </Route>


      <Route path="/profile" element={<ProfileMaster />} />
     
      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
