import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Table, Badge, Tabs, Tab, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faPlus, faEdit, faTrash, faSearch,
  faFlask, faVial, faFileInvoiceDollar, faUserMd,
  faBoxes, faMicroscope, faEyeDropper, faTruck,
  faRulerHorizontal, faCalculator, faCogs, faFileExcel, faFileImport,
  faUsers, faClipboardList, faBug, faShieldAlt, faCog,
  faPrint, faBuilding, faKey, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import ExcelImportExport from '../../components/admin/ExcelImportExport';
import BulkDataImport from '../../components/admin/BulkDataImport';
import '../../styles/MasterData.css';

const MasterData = () => {
  // State for master data
  const [masterData, setMasterData] = useState({
    // Original categories
    testCategories: [],
    testParameters: [],
    sampleTypes: [],
    departments: [],
    paymentMethods: [],
    containers: [],
    instruments: [],
    reagents: [],
    suppliers: [],
    units: [],
    testMethods: [],
    // New categories from Excel
    patients: [],
    profileMaster: [],
    methodMaster: [],
    antibioticMaster: [],
    organismMaster: [],
    unitOfMeasurement: [],
    specimenMaster: [],
    organismVsAntibiotic: [],
    containerMaster: [],
    mainDepartmentMaster: [],
    departmentSettings: [],
    authorizationSettings: [],
    printOrder: [],
    // Test Master
    testMaster: [],
    // Sub Test Master
    subTestMaster: []
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('testCategories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});

  // Test Master specific state
  const [subTests, setSubTests] = useState([]);
  const [testMasterFormData, setTestMasterFormData] = useState({
    department: '',
    testName: '',
    emrClassification: '',
    shortName: '',
    displayName: '',
    hmsCode: '',
    internationalCode: '',
    method: '',
    primarySpecimen: '',
    specimen: '',
    container: '',
    interpretation: '',
    instructions: '',
    specialReport: '',
    reportName: '',
    // Settings tab
    unacceptableConditions: '',
    minSampleQty: '',
    cutoffTime: '',
    testSuffix: '',
    suffixDesc: '',
    minProcessTime: 0,
    minProcessPeriod: '',
    emergencyProcessTime: 0,
    emergencyProcessPeriod: '',
    expiryTime: 0,
    expiryPeriod: '',
    serviceTime: '',
    applicableTo: 'both',
    reportingDays: 0,
    testDoneOn: {
      sun: false,
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false
    },
    alertSMS: false,
    alertPeriod: '',
    alertMessage: '',
    // Options tab
    options: {
      noSale: false,
      inactive: false,
      noBarCode: false,
      allowDiscount: false,
      hideOnlineReport: false,
      noDiscount: false,
      allowModifySpecimen: false,
      editComment: false,
      accreditedTest: false,
      preferDoctor: false,
      appointment: false,
      allowNegative: false,
      onlineRegistration: false,
      automatedService: false,
      allowIncreaseAmount: false,
      noHouseVisit: false,
      editBill: false,
      noResult: false,
      allowComma: false,
      autoAuthorise: false,
      isCovid: false,
      noLoyalty: false,
      outsourced: false,
      editQuantity: false,
      attachServiceDoctor: false,
      noSMS: false,
      noMembershipDiscount: false,
      noAppDiscount: false,
      printInsideBox: false
    },
    is_active: true
  });

  // Profile Data specific state
  const [profileDataSubTab, setProfileDataSubTab] = useState('testSubProcess');
  const [showTestMasterForm, setShowTestMasterForm] = useState(false);

  // Test Master sub-tabs state
  const [testMasterSubTab, setTestMasterSubTab] = useState('basic');

  // Profile Master sub-tabs state
  const [profileMasterSubTab, setProfileMasterSubTab] = useState('basic');

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.getMasterData();
        setMasterData(response.data);
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await adminAPI.deleteMasterDataItem(activeTab, itemToDelete.id);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: (prevData[activeTab] || []).filter(item => item.id !== itemToDelete.id)
      }));

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting item:', err);
      setErrorMessage('Failed to delete item. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Handle add button click
  const handleAddClick = () => {
    // Initialize form data based on active tab
    switch (activeTab) {
      case 'testCategories':
        setFormData({
          name: '',
          description: '',
          is_active: true
        });
        break;
      case 'testParameters':
        setFormData({
          name: '',
          unit: '',
          reference_range: '',
          category_id: '',
          is_active: true
        });
        break;
      case 'sampleTypes':
        setFormData({
          name: '',
          description: '',
          storage_instructions: '',
          validity_days: 7,
          is_active: true
        });
        break;
      case 'department':
        setFormData({
          name: '',
          description: '',
          is_active: true
        });
        break;
      case 'paymentMethods':
        setFormData({
          name: '',
          description: '',
          is_online: false,
          is_active: true
        });
        break;
      case 'containers':
        setFormData({
          name: '',
          type: '',
          volume: '',
          unit: '',
          color: '',
          additive: '',
          is_active: true
        });
        break;
      case 'instruments':
        setFormData({
          name: '',
          model: '',
          manufacturer: '',
          serial_number: '',
          installation_date: '',
          calibration_due: '',
          is_active: true
        });
        break;
      case 'reagents':
        setFormData({
          name: '',
          lot_number: '',
          expiry_date: '',
          manufacturer: '',
          storage_temperature: '',
          is_active: true
        });
        break;
      case 'suppliers':
        setFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          is_active: true
        });
        break;
      case 'units':
        setFormData({
          name: '',
          symbol: '',
          type: '',
          conversion_factor: 1,
          is_active: true
        });
        break;
      case 'testMethods':
        setFormData({
          name: '',
          description: '',
          principle: '',
          procedure: '',
          is_active: true
        });
        break;
      case 'patients':
        setFormData({
          his_no: '',
          patient_name: '',
          mobile: '',
          whatsapp_no: '',
          uid_no: '',
          is_active: true
        });
        break;
      case 'profileMaster':
        setFormData({
          code: '',
          procedure_code: '',
          test_profile: '',
          test_price: 0,
          is_active: true
        });
        break;
      case 'methodMaster':
        setFormData({
          code: '',
          method: '',
          is_active: true
        });
        break;
      case 'antibioticMaster':
        setFormData({
          antibiotic_code: '',
          antibiotic_group: '',
          antibiotic_description: '',
          antibiotic_content: '',
          order: 0,
          is_active: true
        });
        break;
      case 'organismMaster':
        setFormData({
          code: '',
          description: '',
          no_growth: false,
          is_active: true
        });
        break;
      case 'unitOfMeasurement':
        setFormData({
          code: '',
          description: '',
          technical: '',
          inventory: '',
          is_active: true
        });
        break;
      case 'specimenMaster':
        setFormData({
          code: '',
          specimen: '',
          container: '',
          disposable: '',
          is_active: true
        });
        break;
      case 'organismVsAntibiotic':
        setFormData({
          organism: '',
          antibiotic_group: '',
          is_active: true
        });
        break;
      case 'containerMaster':
        setFormData({
          code: '',
          description: '',
          short_name: '',
          color: '',
          is_active: true
        });
        break;
      case 'mainDepartmentMaster':
        setFormData({
          major_department: '',
          code: '',
          department: '',
          order: 0,
          short_name: '',
          queue: '',
          is_active: true
        });
        break;
      case 'departmentSettings':
        setFormData({
          main: '',
          code: '',
          sub_name: '',
          service_time: 0,
          room: '',
          order: 0,
          dept_amt: 0,
          short: '',
          collect: '',
          process_receive: '',
          receive: '',
          no: '',
          pending: '',
          dept: '',
          barcode: '',
          appt: '',
          is_active: true
        });
        break;
      case 'authorizationSettings':
        setFormData({
          main: '',
          code: '',
          sub_name: '',
          service_time: 0,
          authorization: '',
          authorization_type: '',
          email_at: '',
          report_type: '',
          specimen: '',
          staging: '',
          hide_sign: false,
          is_active: true
        });
        break;
      case 'printOrder':
        setFormData({
          item: '',
          order: 0,
          is_active: true
        });
        break;
      case 'subTestMaster':
        setFormData({
          sub_test_name: '',
          department_id: '',
          description: '',
          is_active: true
        });
        break;
      case 'profileData':
        setFormData({
          code: '',
          procedure_code: '',
          test_profile: '',
          test_price: 0,
          is_active: true
        });
        break;
      default:
        setFormData({});
    }

    setShowAddModal(true);
  };

  // Handle edit button click
  const handleEditClick = (item) => {
    setItemToEdit(item);
    setFormData(item);
    setShowEditModal(true);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Test Master form field changes
  const handleTestMasterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('testDoneOn.')) {
      const day = name.split('.')[1];
      setTestMasterFormData(prevData => ({
        ...prevData,
        testDoneOn: {
          ...prevData.testDoneOn,
          [day]: checked
        }
      }));
    } else if (name.startsWith('options.')) {
      const option = name.split('.')[1];
      setTestMasterFormData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          [option]: checked
        }
      }));
    } else {
      setTestMasterFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle Test Master form submission
  const handleTestMasterSubmit = async () => {
    try {
      const testMasterData = {
        ...testMasterFormData,
        subTests: subTests
      };

      const response = await adminAPI.addMasterDataItem('testMaster', testMasterData);

      setMasterData(prevData => ({
        ...prevData,
        testMaster: [...(prevData.testMaster || []), response.data]
      }));

      // Clear form
      handleTestMasterClear();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error adding test master:', err);
      setErrorMessage('Failed to add test master. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle Test Master form clear
  const handleTestMasterClear = () => {
    setTestMasterFormData({
      department: '',
      testName: '',
      emrClassification: '',
      shortName: '',
      displayName: '',
      hmsCode: '',
      internationalCode: '',
      method: '',
      primarySpecimen: '',
      specimen: '',
      container: '',
      interpretation: '',
      instructions: '',
      specialReport: '',
      reportName: '',
      unacceptableConditions: '',
      minSampleQty: '',
      cutoffTime: '',
      testSuffix: '',
      suffixDesc: '',
      minProcessTime: 0,
      minProcessPeriod: '',
      emergencyProcessTime: 0,
      emergencyProcessPeriod: '',
      expiryTime: 0,
      expiryPeriod: '',
      serviceTime: '',
      applicableTo: 'both',
      reportingDays: 0,
      testDoneOn: {
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false
      },
      alertSMS: false,
      alertPeriod: '',
      alertMessage: '',
      options: {
        noSale: false,
        inactive: false,
        noBarCode: false,
        allowDiscount: false,
        hideOnlineReport: false,
        noDiscount: false,
        allowModifySpecimen: false,
        editComment: false,
        accreditedTest: false,
        preferDoctor: false,
        appointment: false,
        allowNegative: false,
        onlineRegistration: false,
        automatedService: false,
        allowIncreaseAmount: false,
        noHouseVisit: false,
        editBill: false,
        noResult: false,
        allowComma: false,
        autoAuthorise: false,
        isCovid: false,
        noLoyalty: false,
        outsourced: false,
        editQuantity: false,
        attachServiceDoctor: false,
        noSMS: false,
        noMembershipDiscount: false,
        noAppDiscount: false,
        printInsideBox: false
      },
      is_active: true
    });
    setSubTests([]);
  };

  // Handle add form submission
  const handleAddSubmit = async () => {
    try {
      const response = await adminAPI.addMasterDataItem(activeTab, formData);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: [...(prevData[activeTab] || []), response.data]
      }));

      setShowAddModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error adding item:', err);
      setErrorMessage('Failed to add item. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    try {
      const response = await adminAPI.updateMasterDataItem(activeTab, itemToEdit.id, formData);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: (prevData[activeTab] || []).map(item =>
          item.id === itemToEdit.id ? response.data : item
        )
      }));

      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating item:', err);
      setErrorMessage('Failed to update item. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const data = masterData[activeTab] || [];

    if (!searchQuery) {
      return data;
    }

    return data.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.testName && item.testName.toLowerCase().includes(searchLower)) ||
        (item.sub_test_name && item.sub_test_name.toLowerCase().includes(searchLower)) ||
        (item.code && item.code.toLowerCase().includes(searchLower)) ||
        (item.test_profile && item.test_profile.toLowerCase().includes(searchLower)) ||
        (item.procedure_code && item.procedure_code.toLowerCase().includes(searchLower))
      );
    });
  };

  // Handle Excel import success
  const handleImportSuccess = async () => {
    try {
      const response = await adminAPI.getMasterData();
      setMasterData(response.data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error refreshing data after import:', err);
      setErrorMessage('Data imported but failed to refresh. Please reload the page.');
      setShowErrorModal(true);
    }
  };



  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading master data...</p>
      </div>
    );
  }

  return (
    <div className="master-data-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faDatabase} className="me-2" />
          Master Data Management
        </h1>
        <div>
          <Button
            variant="info"
            className="me-2"
            onClick={() => setShowBulkImportModal(true)}
          >
            <FontAwesomeIcon icon={faFileImport} className="me-2" />
            Bulk Import
          </Button>
          <Button
            variant="success"
            className="me-2"
            onClick={() => setShowExcelModal(true)}
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-2" />
            Excel Import/Export
          </Button>
          <Button variant="primary" onClick={handleAddClick}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-0"
          >
            <Tab
              eventKey="testCategories"
              title={<><FontAwesomeIcon icon={faFlask} className="me-2" />Test Categories</>}
            />
            <Tab
              eventKey="testParameters"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Test Parameters</>}
            />
            <Tab
              eventKey="sampleTypes"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Sample Types</>}
            />
            <Tab
              eventKey="departments"
              title={<><FontAwesomeIcon icon={faUserMd} className="me-2" />Test</>}
            />
            <Tab
              eventKey="paymentMethods"
              title={<><FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />Payment Methods</>}
            />
            <Tab
              eventKey="containers"
              title={<><FontAwesomeIcon icon={faBoxes} className="me-2" />Containers</>}
            />
            <Tab
              eventKey="instruments"
              title={<><FontAwesomeIcon icon={faMicroscope} className="me-2" />Instruments</>}
            />
            <Tab
              eventKey="reagents"
              title={<><FontAwesomeIcon icon={faEyeDropper} className="me-2" />Reagents</>}
            />
            <Tab
              eventKey="suppliers"
              title={<><FontAwesomeIcon icon={faTruck} className="me-2" />Suppliers</>}
            />
            <Tab
              eventKey="units"
              title={<><FontAwesomeIcon icon={faRulerHorizontal} className="me-2" />Units</>}
            />
            <Tab
              eventKey="testMethods"
              title={<><FontAwesomeIcon icon={faCogs} className="me-2" />Test Methods</>}
            />
            <Tab
              eventKey="patients"
              title={<><FontAwesomeIcon icon={faUsers} className="me-2" />Patients</>}
            />
            <Tab
              eventKey="profileMaster"
              title={<><FontAwesomeIcon icon={faClipboardList} className="me-2" />Profile Master</>}
            />
            <Tab
              eventKey="methodMaster"
              title={<><FontAwesomeIcon icon={faCogs} className="me-2" />Method Master</>}
            />
            <Tab
              eventKey="antibioticMaster"
              title={<><FontAwesomeIcon icon={faShieldAlt} className="me-2" />Antibiotic Master</>}
            />
            <Tab
              eventKey="organismMaster"
              title={<><FontAwesomeIcon icon={faBug} className="me-2" />Organism Master</>}
            />
            <Tab
              eventKey="unitOfMeasurement"
              title={<><FontAwesomeIcon icon={faRulerHorizontal} className="me-2" />Unit Of Measurement</>}
            />
            <Tab
              eventKey="specimenMaster"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Specimen Master</>}
            />
            <Tab
              eventKey="organismVsAntibiotic"
              title={<><FontAwesomeIcon icon={faLayerGroup} className="me-2" />Organism vs Antibiotic</>}
            />
            <Tab
              eventKey="containerMaster"
              title={<><FontAwesomeIcon icon={faBoxes} className="me-2" />Container Master</>}
            />
            <Tab
              eventKey="mainDepartmentMaster"
              title={<><FontAwesomeIcon icon={faBuilding} className="me-2" />Main Department Master</>}
            />
            <Tab
              eventKey="departmentSettings"
              title={<><FontAwesomeIcon icon={faCog} className="me-2" />Department Settings</>}
            />
            <Tab
              eventKey="authorizationSettings"
              title={<><FontAwesomeIcon icon={faKey} className="me-2" />Authorization Settings</>}
            />
            <Tab
              eventKey="printOrder"
              title={<><FontAwesomeIcon icon={faPrint} className="me-2" />Print Order</>}
            />
            <Tab
              eventKey="testMaster"
              title={<><FontAwesomeIcon icon={faFlask} className="me-2" />Test Master</>}
            />
            <Tab
              eventKey="subTestMaster"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Sub Test Master</>}
            />
          
          </Tabs>
        </Card.Header>
        <div className="card-header-search py-2 px-3 border-bottom">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </InputGroup>
        </div>
        <Card.Body>
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <div className="table-responsive">
              {activeTab === 'testCategories' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>
                          <Badge bg={category.is_active ? 'success' : 'danger'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(category)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(category)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'testParameters' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(parameter => (
                      <tr key={parameter.id}>
                        <td>{parameter.name}</td>
                        <td>{parameter.unit}</td>
                        <td>{parameter.reference_range}</td>
                        <td>
                          {(masterData.testCategories || []).find(c => c.id === parameter.category_id)?.name || 'N/A'}
                        </td>
                        <td>
                          <Badge bg={parameter.is_active ? 'success' : 'danger'}>
                            {parameter.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(parameter)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(parameter)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'sampleTypes' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Validity (Days)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(sampleType => (
                      <tr key={sampleType.id}>
                        <td>{sampleType.name}</td>
                        <td>{sampleType.description}</td>
                        <td>{sampleType.validity_days}</td>
                        <td>
                          <Badge bg={sampleType.is_active ? 'success' : 'danger'}>
                            {sampleType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(sampleType)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(sampleType)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'departments' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Department</th>
                      <th>test_/_profile</th>
                      <th>Test price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(department => (
                      <tr key={department.id}>
                         <td>{department.code}</td>
                        <td>{department.department}</td>
                        <td>{department.test_profile}</td>
                        <td>{department.test_price}</td>
                        <td>
                          <Badge bg={department.is_active ? 'success' : 'danger'}>
                            {department.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(department)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(department)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'paymentMethods' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(method => (
                      <tr key={method.id}>
                        <td>{method.name}</td>
                        <td>{method.description}</td>
                        <td>
                          <Badge bg={method.is_online ? 'info' : 'secondary'}>
                            {method.is_online ? 'Online' : 'Offline'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={method.is_active ? 'success' : 'danger'}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(method)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(method)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'containers' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Volume</th>
                      <th>Color</th>
                      <th>Additive</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(container => (
                      <tr key={container.id}>
                        <td>{container.name}</td>
                        <td>{container.type}</td>
                        <td>{container.volume} {container.unit}</td>
                        <td>
                          <span
                            className="badge"
                            style={{backgroundColor: container.color || '#6c757d'}}
                          >
                            {container.color || 'N/A'}
                          </span>
                        </td>
                        <td>{container.additive || 'None'}</td>
                        <td>
                          <Badge bg={container.is_active ? 'success' : 'danger'}>
                            {container.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(container)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(container)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'instruments' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Model</th>
                      <th>Serial Number</th>
                      <th>Calibration Due</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(instrument => (
                      <tr key={instrument.id}>
                        <td>{instrument.name}</td>
                        <td>{instrument.manufacturer}</td>
                        <td>{instrument.model}</td>
                        <td>{instrument.serial_number}</td>
                        <td>{instrument.calibration_due ? new Date(instrument.calibration_due).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <Badge bg={instrument.is_active ? 'success' : 'danger'}>
                            {instrument.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(instrument)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(instrument)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'reagents' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Lot Number</th>
                      <th>Manufacturer</th>
                      <th>Expiry Date</th>
                      <th>Storage Temp</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(reagent => (
                      <tr key={reagent.id}>
                        <td>{reagent.name}</td>
                        <td>{reagent.lot_number}</td>
                        <td>{reagent.manufacturer}</td>
                        <td>{reagent.expiry_date ? new Date(reagent.expiry_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{reagent.storage_temperature}</td>
                        <td>
                          <Badge bg={reagent.is_active ? 'success' : 'danger'}>
                            {reagent.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(reagent)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(reagent)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'suppliers' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(supplier => (
                      <tr key={supplier.id}>
                        <td>{supplier.name}</td>
                        <td>{supplier.contact_person}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        <td>
                          <Badge bg={supplier.is_active ? 'success' : 'danger'}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(supplier)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(supplier)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'units' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Conversion Factor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(unit => (
                      <tr key={unit.id}>
                        <td>{unit.name}</td>
                        <td><code>{unit.symbol}</code></td>
                        <td>{unit.type}</td>
                        <td>{unit.conversion_factor}</td>
                        <td>
                          <Badge bg={unit.is_active ? 'success' : 'danger'}>
                            {unit.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(unit)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(unit)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'testMethods' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Principle</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(method => (
                      <tr key={method.id}>
                        <td>{method.name}</td>
                        <td>{method.description}</td>
                        <td>{method.principle}</td>
                        <td>
                          <Badge bg={method.is_active ? 'success' : 'danger'}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(method)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(method)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* New Categories Table Views */}
              {activeTab === 'patients' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Mobile</th>
                      <th>gender</th>
                      <th>Blood Group</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(patient => (
                      <tr key={patient.id}>
                        <td>{patient.patient_id}</td>
                        <td>{patient.first_name}</td>
                        <td>{patient.phone}</td>
                        <td>{patient.gender}</td>
                        <td>{patient.blood_group}</td>
                        <td>
                          <Badge bg={patient.is_active ? 'success' : 'danger'}>
                            {patient.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(patient)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(patient)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'profileMaster' && (
                <div>
                  {/* Profile Master Sub-tabs */}
                  <Tabs
                    activeKey={profileMasterSubTab}
                    onSelect={setProfileMasterSubTab}
                    className="mb-3"
                  >
                    <Tab eventKey="basic" title="Basic Information">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Test Profile</th>
                            <th>Procedure Code</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(profile => (
                            <tr key={profile.id}>
                              <td><code>{profile.code}</code></td>
                              <td>{profile.test_profile}</td>
                              <td>{profile.procedure_code || 'N/A'}</td>
                              <td>₹{profile.test_price}</td>
                              <td>
                                <Badge bg={profile.is_active ? 'success' : 'danger'}>
                                  {profile.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(profile)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteConfirm(profile)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="details" title="Profile Details">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Profile Name</th>
                            <th>Department</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(profile => (
                            <tr key={profile.id}>
                              <td>{profile.test_profile}</td>
                              <td>
                                <Badge bg="primary">
                                  {profile.department || 'General'}
                                </Badge>
                              </td>
                              <td>{profile.category || 'Standard'}</td>
                              <td>{profile.description || 'N/A'}</td>
                              <td>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(profile)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="tests" title="Associated Tests">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Profile Name</th>
                            <th>Test Count</th>
                            <th>Test Names</th>
                            <th>Total Price</th>
                            <th>Discount</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(profile => (
                            <tr key={profile.id}>
                              <td>{profile.test_profile}</td>
                              <td>
                                <Badge bg="info">
                                  {profile.test_count || 0} Tests
                                </Badge>
                              </td>
                              <td>
                                <div className="text-truncate" style={{maxWidth: '200px'}}>
                                  {profile.test_names || 'No tests assigned'}
                                </div>
                              </td>
                              <td>₹{profile.test_price}</td>
                              <td>{profile.discount || '0'}%</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(profile)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="pricing" title="Pricing & Billing">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Profile Name</th>
                            <th>Base Price</th>
                            <th>Discount Price</th>
                            <th>Emergency Price</th>
                            <th>Home Visit Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(profile => (
                            <tr key={profile.id}>
                              <td>{profile.test_profile}</td>
                              <td>₹{profile.test_price}</td>
                              <td>₹{profile.discount_price || profile.test_price}</td>
                              <td>₹{profile.emergency_price || (profile.test_price * 1.5).toFixed(2)}</td>
                              <td>₹{profile.home_visit_price || (profile.test_price * 1.2).toFixed(2)}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(profile)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>
                  </Tabs>
                </div>
              )}

              {activeTab === 'methodMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(method => (
                      <tr key={method.id}>
                        <td><code>{method.code}</code></td>
                        <td>{method.method}</td>
                        <td>
                          <Badge bg={method.is_active ? 'success' : 'danger'}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(method)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(method)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'antibioticMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Group</th>
                      <th>Description</th>
                      <th>Content</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(antibiotic => (
                      <tr key={antibiotic.id}>
                        <td><code>{antibiotic.antibiotic_code}</code></td>
                        <td>{antibiotic.antibiotic_group}</td>
                        <td>{antibiotic.antibiotic_description}</td>
                        <td>{antibiotic.antibiotic_content || 'N/A'}</td>
                        <td>{antibiotic.order}</td>
                        <td>
                          <Badge bg={antibiotic.is_active ? 'success' : 'danger'}>
                            {antibiotic.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(antibiotic)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(antibiotic)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'organismMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>No Growth</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(organism => (
                      <tr key={organism.id}>
                        <td><code>{organism.code}</code></td>
                        <td>{organism.description}</td>
                        <td>
                          <Badge bg={organism.no_growth ? 'warning' : 'info'}>
                            {organism.no_growth ? 'No Growth' : 'Growth'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={organism.is_active ? 'success' : 'danger'}>
                            {organism.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(organism)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(organism)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'unitOfMeasurement' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Technical</th>
                      <th>Inventory</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(unit => (
                      <tr key={unit.id}>
                        <td><code>{unit.code}</code></td>
                        <td>{unit.description}</td>
                        <td>{unit.technical || 'N/A'}</td>
                        <td>{unit.inventory || 'N/A'}</td>
                        <td>
                          <Badge bg={unit.is_active ? 'success' : 'danger'}>
                            {unit.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(unit)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(unit)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'specimenMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Specimen</th>
                      <th>Container</th>
                      <th>Disposable</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(specimen => (
                      <tr key={specimen.id}>
                        <td><code>{specimen.code}</code></td>
                        <td>{specimen.specimen}</td>
                        <td>{specimen.container}</td>
                        <td>
                          <Badge bg={specimen.disposable === 'Yes' ? 'success' : 'secondary'}>
                            {specimen.disposable}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={specimen.is_active ? 'success' : 'danger'}>
                            {specimen.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(specimen)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(specimen)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'organismVsAntibiotic' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Organism</th>
                      <th>Antibiotic Group</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(relationship => (
                      <tr key={relationship.id}>
                        <td>{relationship.organism}</td>
                        <td>{relationship.antibiotic_group}</td>
                        <td>
                          <Badge bg={relationship.is_active ? 'success' : 'danger'}>
                            {relationship.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(relationship)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(relationship)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'containerMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Short Name</th>
                      <th>Color</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(container => (
                      <tr key={container.id}>
                        <td><code>{container.code}</code></td>
                        <td>{container.description}</td>
                        <td>{container.short_name}</td>
                        <td>
                          <span
                            className="badge"
                            style={{backgroundColor: container.color || '#6c757d'}}
                          >
                            {container.color || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <Badge bg={container.is_active ? 'success' : 'danger'}>
                            {container.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(container)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(container)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'mainDepartmentMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Major Department</th>
                      <th>Short Name</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(dept => (
                      <tr key={dept.id}>
                        <td><code>{dept.code}</code></td>
                        <td>{dept.department}</td>
                        <td>
                          <Badge bg="primary">{dept.major_department}</Badge>
                        </td>
                        <td>{dept.short_name}</td>
                        <td>{dept.order}</td>
                        <td>
                          <Badge bg={dept.is_active ? 'success' : 'danger'}>
                            {dept.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(dept)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(dept)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'departmentSettings' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Sub Name</th>
                      <th>Main</th>
                      <th>Short</th>
                      <th>Order</th>
                      <th>Dept Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(setting => (
                      <tr key={setting.id}>
                        <td><code>{setting.code}</code></td>
                        <td>{setting.sub_name}</td>
                        <td>{setting.main}</td>
                        <td>{setting.short}</td>
                        <td>{setting.order}</td>
                        <td>₹{setting.dept_amt}</td>
                        <td>
                          <Badge bg={setting.is_active ? 'success' : 'danger'}>
                            {setting.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(setting)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(setting)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'authorizationSettings' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Sub Name</th>
                      <th>Authorization</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Report Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(auth => (
                      <tr key={auth.id}>
                        <td><code>{auth.code}</code></td>
                        <td>{auth.sub_name}</td>
                        <td>{auth.authorization}</td>
                        <td>
                          <Badge bg="info">{auth.authorization_type}</Badge>
                        </td>
                        <td>{auth.email_at}</td>
                        <td>{auth.report_type}</td>
                        <td>
                          <Badge bg={auth.is_active ? 'success' : 'danger'}>
                            {auth.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(auth)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(auth)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'printOrder' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(order => (
                      <tr key={order.id}>
                        <td>{order.item}</td>
                        <td>{order.order}</td>
                        <td>
                          <Badge bg={order.is_active ? 'success' : 'danger'}>
                            {order.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(order)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(order)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'testMaster' && (
                <div>
                  {/* Test Master Sub-tabs */}
                  <Tabs
                    activeKey={testMasterSubTab}
                    onSelect={setTestMasterSubTab}
                    className="mb-3"
                  >
                    <Tab eventKey="basic" title="Basic Information">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Department</th>
                            <th>EMR Classification</th>
                            <th>Short Name</th>
                            <th>Display Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>
                                <Badge bg="primary">
                                  {(masterData.mainDepartmentMaster || []).find(dept => dept.id === parseInt(test.department))?.department || 'N/A'}
                                </Badge>
                              </td>
                              <td>{test.emrClassification || 'N/A'}</td>
                              <td>{test.shortName || 'N/A'}</td>
                              <td>{test.displayName || 'N/A'}</td>
                              <td>
                                <Badge bg={test.is_active ? 'success' : 'danger'}>
                                  {test.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteConfirm(test)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="codes" title="Codes & Classification">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>HMS Code</th>
                            <th>International Code</th>
                            <th>Method</th>
                            <th>Test Suffix</th>
                            <th>Suffix Description</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>{test.hmsCode || 'N/A'}</td>
                              <td>{test.internationalCode || 'N/A'}</td>
                              <td>{test.method || 'N/A'}</td>
                              <td>{test.testSuffix || 'N/A'}</td>
                              <td>{test.suffixDesc || 'N/A'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="specimen" title="Specimen & Container">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Primary Specimen</th>
                            <th>Specimen</th>
                            <th>Container</th>
                            <th>Min Sample Qty</th>
                            <th>Unacceptable Conditions</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>{test.primarySpecimen || 'N/A'}</td>
                              <td>{test.specimen || 'N/A'}</td>
                              <td>{test.container || 'N/A'}</td>
                              <td>{test.minSampleQty || 'N/A'}</td>
                              <td>{test.unacceptableConditions || 'N/A'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="timing" title="Timing & Processing">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Cutoff Time</th>
                            <th>Min Process Time</th>
                            <th>Emergency Process Time</th>
                            <th>Expiry Time</th>
                            <th>Service Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>{test.cutoffTime || 'N/A'}</td>
                              <td>{test.minProcessTime ? `${test.minProcessTime} ${test.minProcessPeriod || ''}` : 'N/A'}</td>
                              <td>{test.emergencyProcessTime ? `${test.emergencyProcessTime} ${test.emergencyProcessPeriod || ''}` : 'N/A'}</td>
                              <td>{test.expiryTime ? `${test.expiryTime} ${test.expiryPeriod || ''}` : 'N/A'}</td>
                              <td>{test.serviceTime || 'N/A'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="reporting" title="Reporting & Instructions">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Interpretation</th>
                            <th>Instructions</th>
                            <th>Special Report</th>
                            <th>Report Name</th>
                            <th>Reporting Days</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>{test.interpretation || 'N/A'}</td>
                              <td>{test.instructions || 'N/A'}</td>
                              <td>{test.specialReport || 'N/A'}</td>
                              <td>{test.reportName || 'N/A'}</td>
                              <td>{test.reportingDays || 'N/A'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>

                    <Tab eventKey="options" title="Options & Settings">
                      <Table className="table-hover">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Applicable To</th>
                            <th>Alert SMS</th>
                            <th>Key Options</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData().map(test => (
                            <tr key={test.id}>
                              <td>{test.testName}</td>
                              <td>
                                <Badge bg="info">{test.applicableTo || 'both'}</Badge>
                              </td>
                              <td>
                                <Badge bg={test.alertSMS ? 'success' : 'secondary'}>
                                  {test.alertSMS ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {test.options?.noSale && <Badge bg="warning" className="small">No Sale</Badge>}
                                  {test.options?.inactive && <Badge bg="danger" className="small">Inactive</Badge>}
                                  {test.options?.allowDiscount && <Badge bg="success" className="small">Allow Discount</Badge>}
                                  {test.options?.accreditedTest && <Badge bg="primary" className="small">Accredited</Badge>}
                                  {test.options?.outsourced && <Badge bg="info" className="small">Outsourced</Badge>}
                                </div>
                              </td>
                              <td>
                                <Badge bg={test.is_active ? 'success' : 'danger'}>
                                  {test.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>
                  </Tabs>
                </div>
              )}

              {/* Test Master Form Modal - moved from inline to modal */}
              {activeTab === 'testMaster' && showTestMasterForm && (
                <div className="test-master-form-modal">
                  {/* This will be implemented in the modal section */}
                </div>
              )}

              {/* Profile Data Tab */}
              {activeTab === 'profileData' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Procedure Code</th>
                      <th>Test/Profile</th>
                      <th>Test Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(profile => (
                      <tr key={profile.id}>
                        <td>{profile.code}</td>
                        <td>{profile.procedure_code || 'N/A'}</td>
                        <td>{profile.test_profile}</td>
                        <td>₹{profile.test_price}</td>
                        <td>
                          <Badge bg={profile.is_active ? 'success' : 'danger'}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(profile)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(profile)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'subTestMaster' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Sub Test Name</th>
                      <th>Department</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(subTest => (
                      <tr key={subTest.id}>
                        <td>{subTest.sub_test_name}</td>
                        <td>
                          <Badge bg="primary">
                            {(masterData.mainDepartmentMaster || []).find(dept => dept.id === subTest.department_id)?.department || 'N/A'}
                          </Badge>
                        </td>
                        <td>{subTest.description || 'N/A'}</td>
                        <td>
                          <Badge bg={subTest.is_active ? 'success' : 'danger'}>
                            {subTest.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(subTest)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(subTest)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {getFilteredData().length === 0 && (
                <Alert variant="info">No items found.</Alert>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Add Modal */}
      <FormModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title={`Add New ${activeTab === 'testCategories' ? 'Test Category' :
                activeTab === 'testParameters' ? 'Test Parameter' :
                activeTab === 'sampleTypes' ? 'Sample Type' :
                activeTab === 'departments' ? 'Department' :
                activeTab === 'paymentMethods' ? 'Payment Method' :
                activeTab === 'containers' ? 'Container' :
                activeTab === 'instruments' ? 'Instrument' :
                activeTab === 'reagents' ? 'Reagent' :
                activeTab === 'suppliers' ? 'Supplier' :
                activeTab === 'units' ? 'Unit' :
                activeTab === 'testMethods' ? 'Test Method' :
                activeTab === 'patients' ? 'Patient' :
                activeTab === 'profileMaster' ? 'Profile' :
                activeTab === 'methodMaster' ? 'Method' :
                activeTab === 'antibioticMaster' ? 'Antibiotic' :
                activeTab === 'organismMaster' ? 'Organism' :
                activeTab === 'unitOfMeasurement' ? 'Unit of Measurement' :
                activeTab === 'specimenMaster' ? 'Specimen' :
                activeTab === 'organismVsAntibiotic' ? 'Organism vs Antibiotic' :
                activeTab === 'containerMaster' ? 'Container Master' :
                activeTab === 'mainDepartmentMaster' ? 'Main Department' :
                activeTab === 'departmentSettings' ? 'Department Setting' :
                activeTab === 'authorizationSettings' ? 'Authorization Setting' :
                activeTab === 'printOrder' ? 'Print Order' :
                activeTab === 'testMaster' ? 'Test Master' :
                activeTab === 'subTestMaster' ? 'Sub Test Master' :
                activeTab === 'testSubProcess' ? 'Test Sub Process' :
                activeTab === 'specialPackage' ? 'Special Package' :
                'Item'}`}
        submitText="Add"
      >
        {activeTab === 'testCategories' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testParameters' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="unit"
              label="Unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <TextInput
              name="reference_range"
              label="Reference Range"
              value={formData.reference_range}
              onChange={handleChange}
              placeholder="e.g., 70-100 mg/dL"
            />
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {(masterData.testCategories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'sampleTypes' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_instructions"
              label="Storage Instructions"
              value={formData.storage_instructions}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <NumberInput
              name="validity_days"
              label="Validity (Days)"
              value={formData.validity_days}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'paymentMethods' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_online"
              name="is_online"
              label="Online Payment Method"
              checked={formData.is_online}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'containers' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Tube, Bottle, Vial"
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="mL, L, etc."
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
              onChange={handleChange}
              placeholder="e.g., EDTA, Heparin, None"
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'instruments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="model"
                  label="Model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="serial_number"
              label="Serial Number"
              value={formData.serial_number}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="installation_date"
                  label="Installation Date"
                  value={formData.installation_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="calibration_due"
                  label="Calibration Due"
                  value={formData.calibration_due}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'reagents' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="lot_number"
                  label="Lot Number"
                  value={formData.lot_number}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="storage_temperature"
                  label="Storage Temperature"
                  value={formData.storage_temperature}
                  onChange={handleChange}
                  placeholder="e.g., 2-8°C, Room temp"
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'suppliers' && (
          <>
            <TextInput
              name="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="contact_person"
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'units' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Milligrams per deciliter"
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
              placeholder="e.g., mg/dL"
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Concentration, Volume, Mass"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
              placeholder="Factor to convert to base unit"
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testMethods' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
              placeholder="Scientific principle behind the method"
            />
            <TextInput
              name="procedure"
              label="Procedure"
              value={formData.procedure}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Step-by-step procedure"
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {/* New Categories Forms */}
        {activeTab === 'patients' && (
          <>
            <TextInput
              name="his_no"
              label="HIS Number"
              value={formData.his_no}
              onChange={handleChange}
              required
            />
            <TextInput
              name="patient_name"
              label="Patient Name"
              value={formData.patient_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="mobile"
                  label="Mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="whatsapp_no"
                  label="WhatsApp Number"
                  value={formData.whatsapp_no}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="uid_no"
              label="UID Number"
              value={formData.uid_no}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'profileMaster' && (
          <>
            {/* Basic Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Profile Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter unique profile code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="procedure_code"
                    label="Procedure Code"
                    value={formData.procedure_code}
                    onChange={handleChange}
                    placeholder="Enter procedure code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <TextInput
                    name="test_profile"
                    label="Profile Name*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter profile name"
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">--- Select Department ---</option>
                      {(masterData.mainDepartmentMaster || []).map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter profile description"
                />
              </Form.Group>
            </div>

            {/* Pricing Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Pricing Information</h6>
              <Row>
                <Col md={3}>
                  <NumberInput
                    name="test_price"
                    label="Base Price*"
                    value={formData.test_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    required
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="discount_price"
                    label="Discount Price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="emergency_price"
                    label="Emergency Price"
                    value={formData.emergency_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="home_visit_price"
                    label="Home Visit Price"
                    value={formData.home_visit_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <NumberInput
                    name="discount"
                    label="Discount (%)"
                    value={formData.discount}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0.0"
                  />
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">--- Select Category ---</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Basic">Basic</option>
                      <option value="Comprehensive">Comprehensive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Test Configuration */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Test Configuration</h6>
              <Row>
                <Col md={6}>
                  <NumberInput
                    name="test_count"
                    label="Number of Tests"
                    value={formData.test_count}
                    onChange={handleChange}
                    min={0}
                    placeholder="0"
                  />
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Test Names</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="test_names"
                      value={formData.test_names}
                      onChange={handleChange}
                      placeholder="Enter test names separated by commas"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'methodMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="method"
              label="Method"
              value={formData.method}
              onChange={handleChange}
              required
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'antibioticMaster' && (
          <>
            <TextInput
              name="antibiotic_code"
              label="Antibiotic Code"
              value={formData.antibiotic_code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="antibiotic_group"
              label="Antibiotic Group"
              value={formData.antibiotic_group}
              onChange={handleChange}
            />
            <TextInput
              name="antibiotic_description"
              label="Description"
              value={formData.antibiotic_description}
              onChange={handleChange}
              required
            />
            <TextInput
              name="antibiotic_content"
              label="Content"
              value={formData.antibiotic_content}
              onChange={handleChange}
            />
            <NumberInput
              name="order"
              label="Order"
              value={formData.order}
              onChange={handleChange}
              min={0}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'organismMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <Form.Check
              type="switch"
              id="no_growth"
              name="no_growth"
              label="No Growth"
              checked={formData.no_growth}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'unitOfMeasurement' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="technical"
                  label="Technical"
                  value={formData.technical}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="inventory"
                  label="Inventory"
                  value={formData.inventory}
                  onChange={handleChange}
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'specimenMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="specimen"
              label="Specimen"
              value={formData.specimen}
              onChange={handleChange}
              required
            />
            <TextInput
              name="container"
              label="Container"
              value={formData.container}
              onChange={handleChange}
            />
            <Form.Group className="mb-3">
              <Form.Label>Disposable</Form.Label>
              <Form.Select
                name="disposable"
                value={formData.disposable}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'organismVsAntibiotic' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Organism</Form.Label>
              <Form.Select
                name="organism"
                value={formData.organism}
                onChange={handleChange}
                required
              >
                <option value="">Select Organism</option>
                {(masterData.organismMaster || []).map(organism => (
                  <option key={organism.id} value={organism.description}>
                    {organism.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="antibiotic_group"
              label="Antibiotic Group"
              value={formData.antibiotic_group}
              onChange={handleChange}
              required
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'containerMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextInput
              name="short_name"
              label="Short Name"
              value={formData.short_name}
              onChange={handleChange}
            />
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'mainDepartmentMaster' && (
          <>
            <TextInput
              name="major_department"
              label="Major Department"
              value={formData.major_department}
              onChange={handleChange}
            />
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="order"
                  label="Order"
                  value={formData.order}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="short_name"
                  label="Short Name"
                  value={formData.short_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="queue"
              label="Queue"
              value={formData.queue}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departmentSettings' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="main"
                  label="Main"
                  value={formData.main}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="code"
                  label="Code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <TextInput
              name="sub_name"
              label="Sub Name"
              value={formData.sub_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-4">
                <NumberInput
                  name="service_time"
                  label="Service Time"
                  value={formData.service_time}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="col-md-4">
                <TextInput
                  name="room"
                  label="Room"
                  value={formData.room}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <NumberInput
                  name="order"
                  label="Order"
                  value={formData.order}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="dept_amt"
                  label="Department Amount"
                  value={formData.dept_amt}
                  onChange={handleChange}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="short"
                  label="Short"
                  value={formData.short}
                  onChange={handleChange}
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'authorizationSettings' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="main"
                  label="Main"
                  value={formData.main}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="code"
                  label="Code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <TextInput
              name="sub_name"
              label="Sub Name"
              value={formData.sub_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="authorization"
                  label="Authorization"
                  value={formData.authorization}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="authorization_type"
                  label="Authorization Type"
                  value={formData.authorization_type}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email_at"
                  label="Email"
                  value={formData.email_at}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="report_type"
                  label="Report Type"
                  value={formData.report_type}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="specimen"
                  label="Specimen"
                  value={formData.specimen}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="staging"
                  label="Staging"
                  value={formData.staging}
                  onChange={handleChange}
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="hide_sign"
              name="hide_sign"
              label="Hide Sign"
              checked={formData.hide_sign}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'printOrder' && (
          <>
            <TextInput
              name="item"
              label="Item"
              value={formData.item}
              onChange={handleChange}
              required
            />
            <NumberInput
              name="order"
              label="Order"
              value={formData.order}
              onChange={handleChange}
              min={0}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testMaster' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Department*</Form.Label>
              <Form.Select
                name="department"
                value={formData.id}
                onChange={handleChange}
                required
              >
                <option value="">--- Select Department ---</option>
                {(masterData.testCategories || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="testName"
              label="Test Name"
              value={formData.testName}
              onChange={handleChange}
              required
            />
            <TextInput
              name="emrClassification"
              label="EMR Classification"
              value={formData.emrClassification}
              onChange={handleChange}
            />
            <TextInput
              name="shortName"
              label="Short Name"
              value={formData.shortName}
              onChange={handleChange}
            />
            <TextInput
              name="displayName"
              label="Display Name"
              value={formData.displayName}
              onChange={handleChange}
            />
            <TextInput
              name="hmsCode"
              label="HMS Code"
              value={formData.hmsCode}
              onChange={handleChange}
            />
            <TextInput
              name="internationalCode"
              label="International Code"
              value={formData.internationalCode}
              onChange={handleChange}
            />
            <Form.Group className="mb-3">
              <Form.Label>Method</Form.Label>
              <Form.Select
                name="method"
                value={formData.method}
                onChange={handleChange}
              >
                <option value="">Select Method</option>
                {(masterData.methodMaster || []).map(method => (
                  <option key={method.id} value={method.id}>
                    {method.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primary Specimen</Form.Label>
              <Form.Select
                name="primarySpecimen"
                value={formData.primarySpecimen}
                onChange={handleChange}
              >
                <option value="">Select Primary Specimen</option>
                {(masterData.specimenMaster || []).map(specimen => (
                  <option key={specimen.id} value={specimen.id}>
                    {specimen.specimen}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Container</Form.Label>
              <Form.Select
                name="container"
                value={formData.container}
                onChange={handleChange}
              >
                <option value="">Select Container</option>
                {(masterData.containerMaster || []).map(container => (
                  <option key={container.id} value={container.id}>
                    {container.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="interpretation"
              label="Interpretation"
              value={formData.interpretation}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <TextInput
              name="instructions"
              label="Instructions"
              value={formData.instructions}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />

            {/* Timing & Processing Fields */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Timing & Processing</h6>
              <Row>
                <Col md={4}>
                  <TextInput
                    name="cutoffTime"
                    label="Cutoff Time"
                    value={formData.cutoffTime}
                    onChange={handleChange}
                    placeholder="e.g., 10:00 AM"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="minProcessTime"
                    label="Min Process Time"
                    value={formData.minProcessTime}
                    onChange={handleChange}
                    min={0}
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Process Period</Form.Label>
                    <Form.Select
                      name="minProcessPeriod"
                      value={formData.minProcessPeriod}
                      onChange={handleChange}
                    >
                      <option value="">Select Period</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <NumberInput
                    name="emergencyProcessTime"
                    label="Emergency Process Time"
                    value={formData.emergencyProcessTime}
                    onChange={handleChange}
                    min={0}
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Emergency Process Period</Form.Label>
                    <Form.Select
                      name="emergencyProcessPeriod"
                      value={formData.emergencyProcessPeriod}
                      onChange={handleChange}
                    >
                      <option value="">Select Period</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="reportingDays"
                    label="Reporting Days"
                    value={formData.reportingDays}
                    onChange={handleChange}
                    min={0}
                  />
                </Col>
              </Row>
            </div>

            {/* Additional Fields */}
            <Row>
              <Col md={6}>
                <TextInput
                  name="specialReport"
                  label="Special Report"
                  value={formData.specialReport}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <TextInput
                  name="reportName"
                  label="Report Name"
                  value={formData.reportName}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applicable To</Form.Label>
                  <Form.Select
                    name="applicableTo"
                    value={formData.applicableTo}
                    onChange={handleChange}
                  >
                    <option value="both">Both</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <TextInput
                  name="serviceTime"
                  label="Service Time"
                  value={formData.serviceTime}
                  onChange={handleChange}
                  placeholder="e.g., 24 hours"
                />
              </Col>
            </Row>

            {/* Test Options */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Test Options</h6>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="checkbox"
                    name="options.noSale"
                    label="No Sale"
                    checked={formData.options?.noSale || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.allowDiscount"
                    label="Allow Discount"
                    checked={formData.options?.allowDiscount || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.accreditedTest"
                    label="Accredited Test"
                    checked={formData.options?.accreditedTest || false}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="checkbox"
                    name="options.outsourced"
                    label="Outsourced"
                    checked={formData.options?.outsourced || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.onlineRegistration"
                    label="Online Registration"
                    checked={formData.options?.onlineRegistration || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.appointment"
                    label="Appointment Required"
                    checked={formData.options?.appointment || false}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="checkbox"
                    name="options.alertSMS"
                    label="Alert SMS"
                    checked={formData.alertSMS || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.noHouseVisit"
                    label="No House Visit"
                    checked={formData.options?.noHouseVisit || false}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="options.isCovid"
                    label="COVID Test"
                    checked={formData.options?.isCovid || false}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </div>

            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'subTestMaster' && (
          <>
            <TextInput
              name="sub_test_name"
              label="Sub Test Name"
              value={formData.sub_test_name}
              onChange={handleChange}
              required
              placeholder="Enter sub test name"
            />
            <Form.Group className="mb-3">
              <Form.Label>Department*</Form.Label>
              <Form.Select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
              >
                <option value="">--- Select Department ---</option>
                {(masterData.mainDepartmentMaster || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Enter description (optional)"
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'profileData' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Enter code"
            />
            <TextInput
              name="procedure_code"
              label="Procedure Code"
              value={formData.procedure_code}
              onChange={handleChange}
              placeholder="Enter procedure code (optional)"
            />
            <TextInput
              name="test_profile"
              label="Test/Profile"
              value={formData.test_profile}
              onChange={handleChange}
              required
              placeholder="Enter test or profile name"
            />
            <NumberInput
              name="test_price"
              label="Test Price"
              value={formData.test_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              placeholder="0.00"
              required
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        title={`Edit ${activeTab === 'testCategories' ? 'Test Category' :
                activeTab === 'testParameters' ? 'Test Parameter' :
                activeTab === 'sampleTypes' ? 'Sample Type' :
                activeTab === 'departments' ? 'Department' :
                activeTab === 'paymentMethods' ? 'Payment Method' :
                activeTab === 'containers' ? 'Container' :
                activeTab === 'instruments' ? 'Instrument' :
                activeTab === 'reagents' ? 'Reagent' :
                activeTab === 'suppliers' ? 'Supplier' :
                activeTab === 'units' ? 'Unit' :
                activeTab === 'testMethods' ? 'Test Method' :
                activeTab === 'patients' ? 'Patient' :
                activeTab === 'profileMaster' ? 'Profile' :
                activeTab === 'methodMaster' ? 'Method' :
                activeTab === 'antibioticMaster' ? 'Antibiotic' :
                activeTab === 'organismMaster' ? 'Organism' :
                activeTab === 'unitOfMeasurement' ? 'Unit of Measurement' :
                activeTab === 'specimenMaster' ? 'Specimen' :
                activeTab === 'organismVsAntibiotic' ? 'Organism vs Antibiotic' :
                activeTab === 'containerMaster' ? 'Container Master' :
                activeTab === 'mainDepartmentMaster' ? 'Main Department' :
                activeTab === 'departmentSettings' ? 'Department Setting' :
                activeTab === 'authorizationSettings' ? 'Authorization Setting' :
                activeTab === 'printOrder' ? 'Print Order' :
                activeTab === 'testMaster' ? 'Test Master' :
                activeTab === 'subTestMaster' ? 'Sub Test Master' :
                activeTab === 'profileData' ? 'Profile Data' :
                'Item'}`}
        submitText="Save Changes"
      >
        {activeTab === 'testCategories' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testParameters' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="unit"
              label="Unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <TextInput
              name="reference_range"
              label="Reference Range"
              value={formData.reference_range}
              onChange={handleChange}
              placeholder="e.g., 70-100 mg/dL"
            />
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {(masterData.testCategories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'sampleTypes' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_instructions"
              label="Storage Instructions"
              value={formData.storage_instructions}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <NumberInput
              name="validity_days"
              label="Validity (Days)"
              value={formData.validity_days}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'paymentMethods' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_online_edit"
              name="is_online"
              label="Online Payment Method"
              checked={formData.is_online}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'containers' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Tube, Bottle, Vial"
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="mL, L, etc."
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
              onChange={handleChange}
              placeholder="e.g., EDTA, Heparin, None"
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'instruments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="model"
                  label="Model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="serial_number"
              label="Serial Number"
              value={formData.serial_number}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="installation_date"
                  label="Installation Date"
                  value={formData.installation_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="calibration_due"
                  label="Calibration Due"
                  value={formData.calibration_due}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'reagents' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="lot_number"
                  label="Lot Number"
                  value={formData.lot_number}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="storage_temperature"
                  label="Storage Temperature"
                  value={formData.storage_temperature}
                  onChange={handleChange}
                  placeholder="e.g., 2-8°C, Room temp"
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'suppliers' && (
          <>
            <TextInput
              name="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="contact_person"
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'units' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Milligrams per deciliter"
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
              placeholder="e.g., mg/dL"
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Concentration, Volume, Mass"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
              placeholder="Factor to convert to base unit"
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testMethods' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
              placeholder="Scientific principle behind the method"
            />
            <TextInput
              name="procedure"
              label="Procedure"
              value={formData.procedure}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Step-by-step procedure"
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'patients' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="first_name"
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="last_name"
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="date_of_birth"
                  label="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  type="date"
                  required
                />
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'profileMaster' && (
          <>
            {/* Basic Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Profile Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter unique profile code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="procedure_code"
                    label="Procedure Code"
                    value={formData.procedure_code}
                    onChange={handleChange}
                    placeholder="Enter procedure code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <TextInput
                    name="test_profile"
                    label="Profile Name*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter profile name"
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">--- Select Department ---</option>
                      {(masterData.mainDepartmentMaster || []).map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter profile description"
                />
              </Form.Group>
            </div>

            {/* Pricing Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Pricing Information</h6>
              <Row>
                <Col md={3}>
                  <NumberInput
                    name="test_price"
                    label="Base Price*"
                    value={formData.test_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    required
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="discount_price"
                    label="Discount Price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="emergency_price"
                    label="Emergency Price"
                    value={formData.emergency_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="home_visit_price"
                    label="Home Visit Price"
                    value={formData.home_visit_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
            </div>

            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'methodMaster' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Method Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'antibioticMaster' && (
          <>
            <TextInput
              name="name"
              label="Antibiotic Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Antibiotic Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="class"
              label="Antibiotic Class"
              value={formData.class}
              onChange={handleChange}
            />
            <TextInput
              name="mechanism"
              label="Mechanism of Action"
              value={formData.mechanism}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'organismMaster' && (
          <>
            <TextInput
              name="name"
              label="Organism Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Organism Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Bacteria">Bacteria</option>
                <option value="Virus">Virus</option>
                <option value="Fungus">Fungus</option>
                <option value="Parasite">Parasite</option>
              </Form.Select>
            </Form.Group>
            <TextInput
              name="gram_stain"
              label="Gram Stain"
              value={formData.gram_stain}
              onChange={handleChange}
              placeholder="Positive/Negative/N/A"
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'unitOfMeasurement' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Measurement Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Volume, Mass, Concentration"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'specimenMaster' && (
          <>
            <TextInput
              name="name"
              label="Specimen Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Specimen Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="collection_method"
              label="Collection Method"
              value={formData.collection_method}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_requirements"
              label="Storage Requirements"
              value={formData.storage_requirements}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'organismVsAntibiotic' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Organism</Form.Label>
              <Form.Select
                name="organism_id"
                value={formData.organism_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Organism</option>
                {(masterData.organismMaster || []).map(organism => (
                  <option key={organism.id} value={organism.id}>
                    {organism.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Antibiotic</Form.Label>
              <Form.Select
                name="antibiotic_id"
                value={formData.antibiotic_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Antibiotic</option>
                {(masterData.antibioticMaster || []).map(antibiotic => (
                  <option key={antibiotic.id} value={antibiotic.id}>
                    {antibiotic.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sensitivity</Form.Label>
              <Form.Select
                name="sensitivity"
                value={formData.sensitivity}
                onChange={handleChange}
                required
              >
                <option value="">Select Sensitivity</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Resistant">Resistant</option>
                <option value="Intermediate">Intermediate</option>
              </Form.Select>
            </Form.Group>
            <NumberInput
              name="mic_value"
              label="MIC Value"
              value={formData.mic_value}
              onChange={handleChange}
              min={0}
              step={0.001}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'containerMaster' && (
          <>
            <TextInput
              name="name"
              label="Container Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Container Type"
              value={formData.type}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'mainDepartmentMaster' && (
          <>
            <TextInput
              name="name"
              label="Department Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Department Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="head_of_department"
              label="Head of Department"
              value={formData.head_of_department}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departmentSettings' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {(masterData.departments || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="setting_key"
              label="Setting Key"
              value={formData.setting_key}
              onChange={handleChange}
              required
            />
            <TextInput
              name="setting_value"
              label="Setting Value"
              value={formData.setting_value}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'authorizationSettings' && (
          <>
            <TextInput
              name="role_name"
              label="Role Name"
              value={formData.role_name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="permission"
              label="Permission"
              value={formData.permission}
              onChange={handleChange}
              required
            />
            <TextInput
              name="resource"
              label="Resource"
              value={formData.resource}
              onChange={handleChange}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Access Level</Form.Label>
              <Form.Select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Access Level</option>
                <option value="Read">Read</option>
                <option value="Write">Write</option>
                <option value="Delete">Delete</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'printOrder' && (
          <>
            <TextInput
              name="name"
              label="Print Order Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <NumberInput
              name="order_sequence"
              label="Order Sequence"
              value={formData.order_sequence}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Print Section</Form.Label>
              <Form.Select
                name="print_section"
                value={formData.print_section}
                onChange={handleChange}
                required
              >
                <option value="">Select Section</option>
                <option value="Header">Header</option>
                <option value="Patient Info">Patient Info</option>
                <option value="Test Results">Test Results</option>
                <option value="Footer">Footer</option>
              </Form.Select>
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testMaster' && (
          <>
            <Form.Group className="mb-3 text-black">
              <Form.Label>Department*</Form.Label>
              <Form.Select
                name="department"
                value={formData.test_profile}
                onChange={handleChange}
                required
              >
                <option value="">--- Select Department ---</option>
                {(masterData.departments || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.test_profile}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="testName"
              label="Test Name"
              value={formData.testName}
              onChange={handleChange}
              required
            />
            <TextInput
              name="emrClassification"
              label="EMR Classification"
              value={formData.emrClassification}
              onChange={handleChange}
            />
            <TextInput
              name="shortName"
              label="Short Name"
              value={formData.shortName}
              onChange={handleChange}
            />
            <TextInput
              name="displayName"
              label="Display Name"
              value={formData.displayName}
              onChange={handleChange}
            />
            <TextInput
              name="hmsCode"
              label="HMS Code"
              value={formData.hmsCode}
              onChange={handleChange}
            />
            <TextInput
              name="internationalCode"
              label="International Code"
              value={formData.internationalCode}
              onChange={handleChange}
            />
            <Form.Group className="mb-3">
              <Form.Label>Method</Form.Label>
              <Form.Select
                name="method"
                value={formData.method}
                onChange={handleChange}
              >
                <option value="">Select Method</option>
                {(masterData.methodMaster || []).map(method => (
                  <option key={method.id} value={method.id}>
                    {method.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primary Specimen</Form.Label>
              <Form.Select
                name="primarySpecimen"
                value={formData.primarySpecimen}
                onChange={handleChange}
              >
                <option value="">Select Primary Specimen</option>
                {(masterData.specimenMaster || []).map(specimen => (
                  <option key={specimen.id} value={specimen.id}>
                    {specimen.specimen}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Container</Form.Label>
              <Form.Select
                name="container"
                value={formData.container}
                onChange={handleChange}
              >
                <option value="">Select Container</option>
                {(masterData.containerMaster || []).map(container => (
                  <option key={container.id} value={container.id}>
                    {container.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="interpretation"
              label="Interpretation"
              value={formData.interpretation}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <TextInput
              name="instructions"
              label="Instructions"
              value={formData.instructions}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />

            {/* Additional Fields */}
            <Row>
              <Col md={6}>
                <TextInput
                  name="specialReport"
                  label="Special Report"
                  value={formData.specialReport}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <TextInput
                  name="reportName"
                  label="Report Name"
                  value={formData.reportName}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <TextInput
                  name="cutoffTime"
                  label="Cutoff Time"
                  value={formData.cutoffTime}
                  onChange={handleChange}
                  placeholder="e.g., 10:00 AM"
                />
              </Col>
              <Col md={4}>
                <NumberInput
                  name="minProcessTime"
                  label="Min Process Time"
                  value={formData.minProcessTime}
                  onChange={handleChange}
                  min={0}
                />
              </Col>
              <Col md={4}>
                <NumberInput
                  name="reportingDays"
                  label="Reporting Days"
                  value={formData.reportingDays}
                  onChange={handleChange}
                  min={0}
                />
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applicable To</Form.Label>
                  <Form.Select
                    name="applicableTo"
                    value={formData.applicableTo}
                    onChange={handleChange}
                  >
                    <option value="both">Both</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <TextInput
                  name="serviceTime"
                  label="Service Time"
                  value={formData.serviceTime}
                  onChange={handleChange}
                  placeholder="e.g., 24 hours"
                />
              </Col>
            </Row>

            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'subTestMaster' && (
          <>
            <TextInput
              name="sub_test_name"
              label="Sub Test Name"
              value={formData.sub_test_name}
              onChange={handleChange}
              required
              placeholder="Enter sub test name"
            />
            <Form.Group className="mb-3">
              <Form.Label>Department*</Form.Label>
              <Form.Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">--- Select Department ---</option>
                {(masterData.departments || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Enter description (optional)"
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'profileData' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Enter code"
            />
            <TextInput
              name="procedure_code"
              label="Procedure Code"
              value={formData.procedure_code}
              onChange={handleChange}
              placeholder="Enter procedure code (optional)"
            />
            <TextInput
              name="test_profile"
              label="Test/Profile"
              value={formData.test_profile}
              onChange={handleChange}
              required
              placeholder="Enter test or profile name"
            />
            <NumberInput
              name="test_price"
              label="Test Price"
              value={formData.test_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              placeholder="0.00"
              required
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}
      </FormModal>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Operation completed successfully."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />

      {/* Excel Import/Export Modal */}
      <ExcelImportExport
        show={showExcelModal}
        onHide={() => setShowExcelModal(false)}
        activeTab={activeTab}
        onImportSuccess={handleImportSuccess}
      />

      {/* Bulk Data Import Modal */}
      <BulkDataImport
        show={showBulkImportModal}
        onHide={() => setShowBulkImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default MasterData;
