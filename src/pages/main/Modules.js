import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faVial, faExchangeAlt, faFlask, faVials,
  faClipboardCheck, faFileAlt, faFileInvoiceDollar,
  faBoxes, faChartBar, faCogs, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/Modules.css';

const Modules = () => {
  // Define all modules with their lifecycle stages and access requirements
  const modules = [
    // Pre-analytical modules
    {
      name: 'Patient Management',
      description: 'Register patients and manage their information',
      icon: faUser,
      url: '/patients',
      lifecycle: 'Pre-analytical',
      color: '#4e73df' // Blue
    },
    {
      name: 'Sample Collection',
      description: 'Collect and accession patient samples',
      icon: faVial,
      url: '/samples',
      lifecycle: 'Pre-analytical',
      color: '#4e73df' // Blue
    },
    {
      name: 'Sample Routing',
      description: 'Transfer samples between sites',
      icon: faExchangeAlt,
      url: '/samples/routing',
      lifecycle: 'Pre-analytical',
      color: '#4e73df' // Blue
    },

    // Analytical modules
    {
      name: 'Laboratory Workflow',
      description: 'Process samples and run tests',
      icon: faFlask,
      url: '/lab',
      lifecycle: 'Analytical',
      color: '#1cc88a' // Green
    },
    {
      name: 'Quality Control',
      description: 'Manage quality control procedures',
      icon: faVials,
      url: '/lab/quality-control',
      lifecycle: 'Analytical',
      color: '#1cc88a' // Green
    },

    // Post-analytical modules
    {
      name: 'Results',
      description: 'Review and validate test results',
      icon: faClipboardCheck,
      url: '/results',
      lifecycle: 'Post-analytical',
      color: '#f6c23e' // Yellow
    },
    {
      name: 'Reports',
      description: 'Generate and share patient reports',
      icon: faFileAlt,
      url: '/results/reports',
      lifecycle: 'Post-analytical',
      color: '#f6c23e' // Yellow
    },
    {
      name: 'Billing',
      description: 'Manage invoices and payments',
      icon: faFileInvoiceDollar,
      url: '/billing',
      lifecycle: 'Post-analytical',
      color: '#f6c23e' // Yellow
    },

    // Cross-functional modules
    {
      name: 'Inventory Management',
      description: 'Track reagents, supplies, and equipment',
      icon: faBoxes,
      url: '/inventory',
      lifecycle: 'Cross-functional',
      color: '#36b9cc' // Cyan
    },
    {
      name: 'Analytics',
      description: 'View reports and statistics',
      icon: faChartBar,
      url: '/admin/analytics',
      lifecycle: 'Cross-functional',
      color: '#36b9cc' // Cyan
    },
    {
      name: 'Administration',
      description: 'Manage system settings and users',
      icon: faCogs,
      url: '/admin',
      lifecycle: 'Cross-functional',
      color: '#36b9cc' // Cyan
    }
  ];

  // Filter modules by lifecycle
  const preAnalyticalModules = modules.filter(module => module.lifecycle === 'Pre-analytical');
  const analyticalModules = modules.filter(module => module.lifecycle === 'Analytical');
  const postAnalyticalModules = modules.filter(module => module.lifecycle === 'Post-analytical');
  const crossFunctionalModules = modules.filter(module => module.lifecycle === 'Cross-functional');

  // Module card component
  const ModuleCard = ({ module }) => (
    <Col xl={4} md={6} className="mb-4">
      <Card className={`module-card ${module.lifecycle.toLowerCase().replace('-', '')} h-100`}>
        <Card.Body>
          <FontAwesomeIcon
            icon={module.icon}
            className="module-icon"
            style={{ color: module.color }}
          />
          <h5 className="module-title">{module.name}</h5>
          <p className="module-description">{module.description}</p>
          <span className="module-lifecycle">{module.lifecycle}</span>
        </Card.Body>
        <Card.Footer>
          <Link
            to={module.url}
            className={`btn btn-sm w-100 ${
              module.lifecycle === 'Pre-analytical' ? 'btn-primary' :
              module.lifecycle === 'Analytical' ? 'btn-success' :
              module.lifecycle === 'Post-analytical' ? 'btn-warning' :
              'btn-info'
            }`}
          >
            <FontAwesomeIcon icon={faArrowRight} /> Open Module
          </Link>
        </Card.Footer>
      </Card>
    </Col>
  );

  return (
    <div className="modules-container">
      <h1 className="h3 mb-4 text-gray-800">Modules</h1>

      {/* Pre-analytical Modules */}
      <div className="mb-4">
        <h2 className="h4 mb-3 text-gray-800">Pre-analytical</h2>
        <Row>
          {preAnalyticalModules.map((module, index) => (
            <ModuleCard key={`pre-${index}`} module={module} />
          ))}
        </Row>
      </div>

      {/* Analytical Modules */}
      <div className="mb-4">
        <h2 className="h4 mb-3 text-gray-800">Analytical</h2>
        <Row>
          {analyticalModules.map((module, index) => (
            <ModuleCard key={`ana-${index}`} module={module} />
          ))}
        </Row>
      </div>

      {/* Post-analytical Modules */}
      <div className="mb-4">
        <h2 className="h4 mb-3 text-gray-800">Post-analytical</h2>
        <Row>
          {postAnalyticalModules.map((module, index) => (
            <ModuleCard key={`post-${index}`} module={module} />
          ))}
        </Row>
      </div>

      {/* Cross-functional Modules */}
      <div className="mb-4">
        <h2 className="h4 mb-3 text-gray-800">Cross-functional</h2>
        <Row>
          {crossFunctionalModules.map((module, index) => (
            <ModuleCard key={`cross-${index}`} module={module} />
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Modules;
