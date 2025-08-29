import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faEye, faEdit, faFlask
} from '@fortawesome/free-solid-svg-icons';
import { patientAPI } from '../../services/api';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import '../../styles/PatientList.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Table columns configuration
  const columns = [
    {
      key: 'patient_id',
      label: 'ID',
      minWidth: '100px'
    },
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => `${row.first_name} ${row.last_name}`,
      minWidth: '150px'
    },
    {
      key: 'gender',
      label: 'Gender',
      minWidth: '80px'
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      minWidth: '120px'
    },
    {
      key: 'phone',
      label: 'Phone',
      minWidth: '120px'
    },
    {
      key: 'created_at',
      label: 'Registration Date',
      type: 'date',
      minWidth: '140px'
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (patient) => `${patient.first_name} ${patient.last_name}`,
    subtitle: (patient) => patient.patient_id,
    primaryField: 'phone',
    secondaryField: 'gender'
  };

  // Handle patient actions
  const handleViewPatient = (patient) => {
    window.location.href = `/patients/${patient.id}`;
  };

  // Add custom action column for samples
  const enhancedColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      render: (value, patient) => (
        <div className="d-flex gap-1">
          <Link to={`/patients/${patient.id}`} className="btn btn-info btn-sm" title="View">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          <Link to={`/patients/${patient.id}/edit`} className="btn btn-primary btn-sm" title="Edit">
            <FontAwesomeIcon icon={faEdit} />
          </Link>
          <Link to={`/samples?patient_id=${patient.id}`} className="btn btn-success btn-sm" title="Samples">
            <FontAwesomeIcon icon={faFlask} />
          </Link>
        </div>
      ),
      minWidth: '150px'
    }
  ];

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (searchQuery) {
          response = await patientAPI.searchPatients(searchQuery);
        } else {
          response = await patientAPI.getAllPatients();
        }

        setPatients(response.data.items || response.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [searchQuery]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="patient-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-primary">Patients</h1>
        <Link to="/patients/create" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          New Patient
        </Link>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Patients</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, ID, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading patients...</p>
        </div>
      )}

      {/* Responsive Patient Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Patient List
              <span className="badge bg-primary float-end">
                {patients.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <ResponsiveDataTable
              data={patients}
              columns={enhancedColumns}
              onViewDetails={handleViewPatient}
              loading={loading}
              emptyMessage="No patients found."
              mobileCardConfig={mobileCardConfig}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PatientList;
