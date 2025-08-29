import { useEffect, useState } from "react";
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import { NumberInput, TextInput } from "../components/common";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { adminAPI } from "../services/api";
import axios from "axios";

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  name,
  label,
  isRequired = false,
  isDisabled = false,
  isClearable = true,
  getOptionLabel = (option) => option.testName || option.test_profile || option.label || option.name || option.description || option,
  getOptionValue = (option) => option.id || option.value || option,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');




  // Debounce search term for better performance with large datasets
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Performance optimization: limit search results for large datasets
  const filteredOptions = safeOptions.filter(option => {
    if (!option) return false;
    const label = getOptionLabel(option);
    if (!debouncedSearchTerm) return true; // Show all options when no search term
    return label && typeof label === 'string' &&
      label.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
  }).slice(0, 50); // Limit to 50 results for performance

  const selectedOption = safeOptions.find(option => getOptionValue(option) === value);

  return (
    <div className="searchable-dropdown">
      <Form.Group className="mb-3">
        {label && (
          <Form.Label>
            {label} {isRequired && <span className="text-danger">*</span>}
          </Form.Label>
        )}
        <div className="position-relative">
          {/* Hidden input for form validation */}
          <input
            type="hidden"
            name={name}
            value={value || ''}
            required={isRequired}
          />
          <Form.Control
            type="text"
            value={selectedOption ? getOptionLabel(selectedOption) : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              // Clear selection if user is typing
              if (!selectedOption || e.target.value !== getOptionLabel(selectedOption)) {
                const event = {
                  target: {
                    name: name,
                    value: ''
                  }
                };
                onChange(event);
              }
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            disabled={isDisabled}
            className={isRequired && !value ? 'is-invalid' : ''}
          />
          {isOpen && filteredOptions.length > 0 && (
            <div className="dropdown-menu show position-absolute w-100" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    const event = {
                      target: {
                        name: name,
                        value: getOptionValue(option)
                      }
                    };
                    onChange(event);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                >
                  {getOptionLabel(option)}
                </button>
              ))}
            </div>
          )}
          {/* Clear button */}
          {isClearable && value && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary position-absolute"
              style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
              onClick={() => {
                const event = {
                  target: {
                    name: name,
                    value: ''
                  }
                };
                onChange(event);
                setSearchTerm('');
              }}
            >
              ×
            </button>
          )}
        </div>
        {isRequired && !value && (
          <div className="invalid-feedback d-block">
            Please select a {label?.toLowerCase() || 'value'}.
          </div>
        )}
      </Form.Group>
    </div>
  );
};
const ProfileMaster = () => {
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testProfiles, setTestProfiles] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [defaultGstRate, setDefaultGstRate] = useState(18.00);
  const [gstConfigs, setGstConfigs] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tenantData, accessibleTenants, currentTenantContext } = useTenant();
  // Excel data integration states
  const [excelDataLoading, setExcelDataLoading] = useState(false);
  const [excelDataError, setExcelDataError] = useState(null);
  const [excelDataCache, setExcelDataCache] = useState(null);
  const [excelDataLastFetch, setExcelDataLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    procedure_code: '',
    test_profile: '',
    test_price: 0,
    discount_price: 0,
    emergency_price: 0,
    home_visit_price: 0,
    discount: 0,
    category: '',
    test_count: 0,
    is_active: true,
    description: '',
    testItems: [],   // final added tests
    currentTest: {   // temporary test before pushing
      test_id: null,
      testName: '',
      amount: 0.00
    }

  });
  const [profiles, setProfiles] = useState([]);
const [loadingProfiles, setLoadingProfiles] = useState(true);

const fetchProfiles = async () => {
  try {
    setLoadingProfiles(true);
    const token = localStorage.getItem('token');
    const res = await axios.get("http://localhost:5001/api/profile-master", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfiles(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingProfiles(false);
  }
};

useEffect(() => {
  fetchProfiles();
}, []);


const handleDeleteProfile = async (profileId) => {
  if (!window.confirm("Are you sure you want to delete this profile?")) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5001/api/profile-master/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    alert("Profile deleted successfully");
  } catch (err) {
    console.error(err);
    alert("Failed to delete profile");
  }
};


const handleEditProfile = (profile) => {
  setFormData({
    ...profile,
    currentTest: { test_id: null, testName: '', amount: 0 }
  });
};


const handleSubmit = async () => {
  try {
    const token = localStorage.getItem('token');
    const url = formData.id
      ? `http://localhost:5000/api/profile-master/${formData.id}`
      : "http://localhost:5000/api/profile-master";

    const method = formData.id ? 'put' : 'post';

    const res = await axios[method](url, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    alert(formData.id ? "Profile updated" : "Profile added");
    setFormData({
      code: '', procedure_code: '', test_profile: '', test_price: 0,
      discount_price: 0, emergency_price: 0, home_visit_price: 0,
      discount: 0, category: '', test_count: 0, is_active: true,
      description: '', testItems: [], currentTest: { test_id: null, testName: '', amount: 0 }
    });
    fetchProfiles(); // refresh list
  } catch (err) {
    console.error(err);
    alert("Failed to submit profile");
  }
};

  
// const handleSubmit = async () => {
//   try {
//     // Prepare payload: remove currentTest, include testItems
//     const payload = {
//       ...formData,
//       testItems: formData.testItems
//     };

// const token = localStorage.getItem('token'); // or however you store it
// const res = await axios.post(
//   "http://localhost:5001/api/profile-master",
//   payload,
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json"
//     }
//   }
// );


//     // Reset form after successful submit
//     setFormData({
//       code: '',
//       procedure_code: '',
//       test_profile: '',
//       test_price: 0,
//       discount_price: 0,
//       emergency_price: 0,
//       home_visit_price: 0,
//       discount: 0,
//       category: '',
//       test_count: 0,
//       is_active: true,
//       description: '',
//       testItems: [],
//       currentTest: { test_id: null, testName: '', amount: 0.00 }
//     });

//     alert("Profile submitted successfully!");

//   } catch (err) {
//     console.error("Error submitting profile:", err.response?.data || err.message);
//     alert("Failed to submit profile. " + (err.response?.data?.message || ""));
//   }
// };



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('options.')) {
      const option = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          [option]: checked
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  const fetchExcelData = async (forceRefresh = false) => {
    const cacheValidityMs = 5 * 60 * 1000;
    const now = new Date().getTime();

    if (!forceRefresh && excelDataCache && excelDataLastFetch &&
      (now - excelDataLastFetch) < cacheValidityMs) {
      console.log('Using cached test data');
      return excelDataCache;
    }

    try {
      setExcelDataLoading(true);
      setExcelDataError(null);

      console.log('Fetching Excel data and Manual test data from API...');

      const token = localStorage.getItem('token');

      const [excelResponse, manualResponse] = await Promise.all([
        fetch('/api/admin/excel-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/test-master-enhanced', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!excelResponse.ok) {
        throw new Error(`Excel data fetch failed: ${excelResponse.statusText}`);
      }
      if (!manualResponse.ok) {
        throw new Error(`Manual test fetch failed: ${manualResponse.statusText}`);
      }

      const excelData = await excelResponse.json();
      const manualData = await manualResponse.json();

      const formatTest = test => ({
        id: test.id,
        testName: test.test_name,
        test_profile: test.test_name,
        test_price: test.price || 0,
        department: test.department || 'General',
        hmsCode: test.test_code || '',
        specimen: test.specimen || '',
        container: test.container || '',
        serviceTime: test.service_time || '',
        reportingDays: test.reporting_days || '',
        cutoffTime: test.cutoff_time || '',
        referenceRange: test.reference_range || '',
        resultUnit: test.result_unit || '',
        decimals: test.decimals || 0,
        criticalLow: test.critical_low,
        criticalHigh: test.critical_high,
        method: test.method || '',
        instructions: test.instructions || '',
        notes: test.notes || '',
        minSampleQty: test.min_sample_qty || '',
        testDoneOn: test.test_done_on || '',
        applicableTo: test.applicable_to || 'Both',
        isActive: test.is_active !== false,
        ...test
      });

      const transformedExcelData = Array.isArray(excelData.data) ? excelData.data.map(formatTest) : [];
      const transformedManualData = Array.isArray(manualData.data) ? manualData.data.map(formatTest) : [];

      const allTests = [...transformedExcelData, ...transformedManualData];

      setExcelDataCache(allTests);
      setExcelDataLastFetch(now);

      console.log(`Loaded ${allTests.length} tests (Excel + Manual)`);
      return allTests;

    } catch (err) {
      console.error('Error fetching test data:', err);
      setExcelDataError(err.message);

      if (excelDataCache) {
        console.log('Using cached test data due to fetch error');
        return excelDataCache;
      }

      throw err;
    } finally {
      setExcelDataLoading(false);
    }
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set branches based on user access control
        const userBranches = getBranchesForUser();
        setBranches(userBranches);

        // Auto-select branch for non-admin users who have only one franchise
        if ((currentUser?.role === 'franchise_admin' ||
          (currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin')) &&
          userBranches?.length === 1 && !formData.branch) {
          setFormData(prev => ({
            ...prev,
            branch: userBranches[0].id.toString()
          }));
        }

        setCategories([
          { id: 'Normal', name: 'Normal' },
          { id: 'Emergency', name: 'Emergency' },
          { id: 'VIP', name: 'VIP' }
        ]);

        setReferrers([
          { id: 'Doctor', name: 'Doctor' },
          { id: 'Self', name: 'Self' },
          { id: 'Hospital', name: 'Hospital' }
        ]);

        // Fetch Excel-based test profiles
        try {
          const excelTestProfiles = await fetchExcelData();
          setTestProfiles(excelTestProfiles);
          console.log(`Loaded ${excelTestProfiles?.length} tests from Excel data API`);
        } catch (apiErr) {
          console.error('Error fetching Excel test data:', apiErr);

          // Fallback to sample test profiles if Excel data fails
          console.log('Falling back to sample test profiles due to Excel data fetch error');
          const sampleTestProfiles = [
            { id: 1, test_profile: 'Complete Blood Count (CBC)', test_price: 250, department: 'Hematology' },
            { id: 2, test_profile: 'Lipid Profile', test_price: 400, department: 'Biochemistry' },
            { id: 3, test_profile: 'Liver Function Test (LFT)', test_price: 350, department: 'Biochemistry' },
            { id: 4, test_profile: 'Kidney Function Test (KFT)', test_price: 300, department: 'Biochemistry' },
            { id: 5, test_profile: 'Thyroid Profile (T3, T4, TSH)', test_price: 500, department: 'Endocrinology' },
            { id: 6, test_profile: 'Blood Sugar (Fasting)', test_price: 100, department: 'Biochemistry' },
            { id: 7, test_profile: 'Blood Sugar (Random)', test_price: 100, department: 'Biochemistry' },
            { id: 8, test_profile: 'HbA1c', test_price: 450, department: 'Biochemistry' },
            { id: 9, test_profile: 'Urine Routine', test_price: 150, department: 'Pathology' },
            { id: 10, test_profile: 'ECG', test_price: 200, department: 'Cardiology' }
          ];
          setTestProfiles(sampleTestProfiles);

          // Show warning but don't block the form
          setError(`Warning: Unable to load Excel test data (${apiErr.message}). Using fallback test profiles.`);
        }

        // Fetch GST configurations
        try {
          const gstResponse = await adminAPI.getGSTConfig();
          if (gstResponse.data && Array.isArray(gstResponse.data)) {
            setGstConfigs(gstResponse.data);

            // Find default GST rate
            const defaultConfig = gstResponse.data.find(config => config.is_default && config.is_active);
            if (defaultConfig) {
              setDefaultGstRate(defaultConfig.rate);
              setFormData(prev => ({
                ...prev,
                gstRate: defaultConfig.rate
              }));
            }
          }
        } catch (gstErr) {
          console.log('Using default GST rate - GST config API not available');
          // Use default GST rate from settings or fallback
          setDefaultGstRate(18.00);
        }

        // Patient data is now fetched through search functionality when needed

      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, [currentUser, tenantData, accessibleTenants]); // eslint-disable-line react-hooks/exhaustive-deps

  const getBranchesForUser = () => {
    if (!currentUser || !tenantData) return [];

    // For Mayiladuthurai (Hub Admin) and Admin roles: show ALL available franchises/branches
    if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
      // Check if user is from Mayiladuthurai hub (can see all franchises)
      if (tenantData.is_hub || currentUser.role === 'admin') {
        return accessibleTenants || [];
      }
    }

    // For all other franchise roles: show only their specific assigned franchise
    // This includes franchise_admin and any other non-admin roles
    if (currentUser.role === 'franchise_admin' || currentUser.role !== 'admin') {
      // Use accessibleTenants if available (should contain their own franchise)
      if (accessibleTenants && accessibleTenants?.length > 0) {
        return accessibleTenants;
      }
      // Fallback to tenantData (their own franchise only)
      return [tenantData];
    }

    // Default fallback for other roles
    return [tenantData];
  };



  // Add test item
  const addTestItem = () => {

    console.log('Adding test item:', formData.currentTest);
    setError(null);
    const { test_id, testName, amount } = formData.currentTest;

    if (!test_id || !testName) {
      setError('Please select a test');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    // Duplicate check
    if (formData.testItems.some(item => item.test_id === test_id)) {
      setError('This test has already been added');
      return;
    }

    // Add to testItems
    setFormData(prev => ({
      ...prev,
      testItems: [...prev.testItems, { ...prev.currentTest, amount: parsedAmount }],
      currentTest: { test_id: null, testName: '', amount: 0.00 } // reset only current test
    }));
  };



  const removeTestItem = (test_id) => {
    setFormData(prev => ({
      ...prev,
      testItems: prev.testItems.filter(item => item.test_id !== test_id)
    }));
  };


















  return (
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
          {/* Test Configuration */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Test Configuration</h6>

            <Row>



              <SearchableDropdown
                name="currentTest.test_id"
                label="Test Name"
                value={formData.currentTest?.test_id}
                onChange={(e) => {
                  const selectedTest = testProfiles.find(
                    t => t.id === e.target.value
                  );
                  setFormData(prev => ({
                    ...prev,
                    currentTest: {
                      ...prev.currentTest,
                      test_id: selectedTest?.id || null,
                      testName: selectedTest?.testName || selectedTest?.test_profile || ""
                    }
                  }));
                }}
                options={testProfiles}
              />

              {/* <Form.Control
         type="number"
         name="currentTest.amount"
         value={formData.currentTest?.amount}
         onChange={(e) =>
           setFormData(prev => ({
             ...prev,
             currentTest: { ...prev.currentTest, amount: e.target.value }
           }))
         }
       />
        */}

              <Col md={1} className="d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={addTestItem}
                  //    disabled={!newTestItem.testName}
                  className="mb-2"
                >
                  Add
                </Button>
              </Col>
            </Row>

            {/* Selected Tests Table */}
            {formData.testItems?.length > 0 && (
              <div className="table-responsive h-100 mt-3">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Test ID</th>
                      <th>Test Name</th>
                      {/* <th>Amount</th> */}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.testItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="badge bg-primary">{item.test_id || 'N/A'}</span>
                        </td>
                        <td>
                          <div>
                            <strong>{item.testName}</strong>
                            {item.department && (
                              <div>
                                <small className="text-muted">{item.department}</small>
                              </div>
                            )}
                          </div>
                        </td>
                        {/* <td>₹{parseFloat(item.amount).toFixed(2)}</td> */}
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeTestItem(item.test_id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-info">
                      <th colSpan="2">Total Test(s): {formData.testItems?.length}</th>
                      {/* <th>Total Amount: ₹{formData.billAmount}</th> */}
                      <th></th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </div>

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

      <Button variant="success" onClick={handleSubmit}>
  Submit
</Button>


<Table striped bordered hover>
  <thead>
    <tr>
      <th>Profile Code</th>
      <th>Profile Name</th>
      <th>Category</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {profiles.map(profile => (
      <tr key={profile.id}>
        <td>{profile.code}</td>
        <td>{profile.test_profile}</td>
        <td>{profile.category}</td>
        <td>
          <Button size="sm" variant="info" onClick={() => handleEditProfile(profile)}>Edit</Button>{' '}
          <Button size="sm" variant="danger" onClick={() => handleDeleteProfile(profile.id)}>Delete</Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>


    </>
  )
}


export default ProfileMaster;