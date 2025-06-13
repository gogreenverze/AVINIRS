import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle, faTachometerAlt, faUser, faVial,
  faExchangeAlt, faFlask, faClipboardCheck, faFileAlt,
  faFileInvoiceDollar, faBoxes, faChartBar, faCogs, faBars,
  faSignOutAlt, faThLarge, faDatabase
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/MainLayout.css';
import logo from "./logo.png"

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const { tenantData } = useTenant();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  

  // Check if user has access to admin features
  const hasAdminAccess = () => {
    return ['admin', 'hub_admin', 'franchise_admin'].includes(currentUser?.role);
  };

  // Check if user has full system access (admin/hub_admin)
  const hasFullSystemAccess = () => {
    return ['admin', 'hub_admin'].includes(currentUser?.role);
  };

  // Get role display name
  const getRoleDisplayName = () => {
    const roleMap = {
      'admin': 'System Admin',
      'hub_admin': 'Hub Admin',
      'franchise_admin': 'Franchise Admin',
      'lab_tech': 'Lab Technician',
      'doctor': 'Doctor',
      'receptionist': 'Receptionist',
      'billing': 'Billing Staff'
    };
    return roleMap[currentUser?.role] || currentUser?.role;
  };

  return (
    <div className="content-wrapper">
      {/* User Info Header */}
      <div className="user-info-header">
        <div className="user-info-content">
          <FontAwesomeIcon icon={faUserCircle} className="me-2" />
          <span>
            User: {currentUser?.first_name} {currentUser?.last_name} ({getRoleDisplayName()}) |
            Site: {tenantData?.name}
          </span>
          <button
            className="btn btn-sm btn-outline-light ms-3"
            onClick={logout}
            title="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
        <Link to="/dashboard" className="sidebar-brand d-flex align-items-center justify-content-center" onClick={closeSidebar}>
          <div className="sidebar-brand-icon me-2">
            <img src={logo} alt="AVINI LABS" height="40" />
          </div>
          <div className="sidebar-brand-text">
            <span className="fw-bold text-white">AVINI</span>
          </div>
        </Link>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Main</div>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="fa-fw" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/modules"
              className={`nav-link ${location.pathname === '/modules' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faThLarge} className="fa-fw" />
              <span>Modules</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Pre-analytical</div>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/patients"
              className={`nav-link ${location.pathname.startsWith('/patients') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faUser} className="fa-fw" />
              <span>Patients</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/samples"
              className={`nav-link ${location.pathname.startsWith('/samples') && location.pathname !== '/samples/routing' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faVial} className="fa-fw" />
              <span>Samples</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/samples/routing"
              className={`nav-link ${location.pathname === '/samples/routing' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="fa-fw" />
              <span>Sample Routing</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Analytical</div>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/lab"
              className={`nav-link ${location.pathname.startsWith('/lab') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faFlask} className="fa-fw" />
              <span>Laboratory</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Post-analytical</div>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/results"
              className={`nav-link ${location.pathname === '/results' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faClipboardCheck} className="fa-fw" />
              <span>Results</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/results/reports"
              className={`nav-link ${location.pathname === '/results/reports' ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faFileAlt} className="fa-fw" />
              <span>Reports</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/billing"
              className={`nav-link ${location.pathname.startsWith('/billing') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-fw" />
              <span>Billing</span>
            </Link>
          </li>
        </ul>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Cross-functional</div>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/inventory"
              className={`nav-link ${location.pathname.startsWith('/inventory') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FontAwesomeIcon icon={faBoxes} className="fa-fw" />
              <span>Inventory</span>
            </Link>
          </li>
          {hasFullSystemAccess() && (
            <li className="nav-item">
              <Link
                to="/admin/analytics"
                className={`nav-link ${location.pathname === '/admin/analytics' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faChartBar} className="fa-fw" />
                <span>Analytics</span>
              </Link>
            </li>
          )}
          {hasAdminAccess() && (
            <li className="nav-item">
              <Link
                to="/admin"
                className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faCogs} className="fa-fw" />
                <span>Administration</span>
              </Link>
            </li>
          )}
          {hasAdminAccess() && (
            <li className="nav-item">
              <Link
                to="/admin/users"
                className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faUserCircle} className="fa-fw" />
                <span>User Management</span>
              </Link>
            </li>
          )}
          {hasAdminAccess() && (
            <li className="nav-item">
              <Link
                to="/admin/settings"
                className={`nav-link ${location.pathname === '/admin/settings' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faCogs} className="fa-fw" />
                <span>Settings</span>
              </Link>
            </li>
          )}
          {hasFullSystemAccess() && (
            <li className="nav-item">
              <Link
                to="/admin/master-data"
                className={`nav-link ${location.pathname === '/admin/master-data' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faDatabase} className="fa-fw" />
                <span>Master Data</span>
              </Link>
            </li>
          )}
          {hasFullSystemAccess() && (
            <li className="nav-item">
              <Link
                to="/admin/technical-master-data"
                className={`nav-link ${location.pathname === '/admin/technical-master-data' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faChartBar} className="fa-fw" />
                <span>Technical Master Data</span>
              </Link>
            </li>
          )}
        </ul>

        <hr className="sidebar-divider" />

        <ul className="nav flex-column mt-auto">
          <li className="nav-item">
            <button
              className="nav-link btn btn-link text-left"
              onClick={() => {
                logout();
                closeSidebar();
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="fa-fw" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Mobile Menu Button */}
      <div className="mobile-menu-button" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </div>

      {/* Main Content */}
      <div className="content">
        <Outlet />
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav">
        <div className="mobile-nav-content">
          <Link
            to="/dashboard"
            className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faTachometerAlt} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/patients"
            className={`mobile-nav-item ${location.pathname.startsWith('/patients') ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Patients</span>
          </Link>
          <Link
            to="/samples"
            className={`mobile-nav-item ${location.pathname.startsWith('/samples') ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faVial} />
            <span>Samples</span>
          </Link>
          <Link
            to="/results"
            className={`mobile-nav-item ${location.pathname.startsWith('/results') ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faClipboardCheck} />
            <span>Results</span>
          </Link>
          <button
            className="mobile-nav-item btn btn-link"
            onClick={toggleSidebar}
            style={{ border: 'none', background: 'none', color: 'inherit' }}
          >
            <FontAwesomeIcon icon={faBars} />
            <span>More</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
