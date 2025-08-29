import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignature, faUpload, faEye, faTrash, faSave, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';

const SignatureManagement = () => {
  const [currentSignature, setCurrentSignature] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load current signature on component mount
  useEffect(() => {
    loadCurrentSignature();
  }, []);

  const loadCurrentSignature = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCurrentSignature();
      if (response.success && response.data) {
        setCurrentSignature(response.data);
      }
    } catch (err) {
      console.error('Error loading current signature:', err);
      setError('Failed to load current signature');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, JPG, or PNG)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('File size must be less than 2MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('signature', selectedFile);

      const response = await adminAPI.uploadSignature(formData);
      
      if (response.success) {
        setSuccess('Signature uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        await loadCurrentSignature();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } 
    } catch (err) {
      console.error('Error uploading signature:', err);
      setError('Failed to upload signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!window.confirm('Are you sure you want to remove the current signature?')) {
      return;
    }

    try {
      setUploading(true);
      const response = await adminAPI.removeSignature();
      
      if (response.success) {
        setSuccess('Signature removed successfully!');
        setCurrentSignature(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to remove signature');
      }
    } catch (err) {
      console.error('Error removing signature:', err);
      setError('Failed to remove signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <FontAwesomeIcon icon={faSignature} className="me-2 text-primary" size="lg" />
            <h2 className="mb-0">Signature Management</h2>
          </div>
          <p className="text-muted">
            Manage doctor signatures for PDF reports. Upload a signature image that will be used across all billing reports.
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Row>
        {/* Current Signature Section */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0 text-black">
                <FontAwesomeIcon icon={faEye} className="me-2" />
                Current Signature
              </h5>
            </Card.Header>
            <Card.Body className="text-center">
              {loading ? (
                <div className="py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading current signature...</p>
                </div>
              ) : currentSignature ? (
                <div>
                  <div className="mb-3 p-3 border rounded bg-light">
                    <Image 
                      src={currentSignature.url} 
                      alt="Current Signature" 
                      fluid 
                      style={{ maxHeight: '150px', maxWidth: '100%' }}
                    />
                  </div>
                  <p className="text-muted small mb-3">
                    Uploaded: {new Date(currentSignature.uploaded_at).toLocaleDateString()}
                  </p>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleRemoveSignature}
                    disabled={uploading}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                    Remove Signature
                  </Button>
                </div>
              ) : (
                <div className="py-5 text-muted">
                  <FontAwesomeIcon icon={faSignature} size="3x" className="mb-3 opacity-50" />
                  <p>No signature uploaded yet</p>
                  <p className="small">Upload a signature image to get started</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Upload New Signature Section */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0 text-black">
                <FontAwesomeIcon icon={faUpload} className="me-2" />
                Upload New Signature
              </h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Signature Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <Form.Text className="text-muted">
                    Supported formats: JPEG, JPG, PNG. Maximum size: 2MB.
                  </Form.Text>
                </Form.Group>

                {previewUrl && (
                  <div className="mb-3">
                    <Form.Label>Preview</Form.Label>
                    <div className="p-3 border rounded bg-light text-center">
                      <Image 
                        src={previewUrl} 
                        alt="Signature Preview" 
                        fluid 
                        style={{ maxHeight: '150px', maxWidth: '100%' }}
                      />
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Upload Signature
                      </>
                    )}
                  </Button>
                  
                  {selectedFile && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={clearSelection}
                      disabled={uploading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Information Section */}
      <Row>
        <Col>
          <Card className="border-info">
            <Card.Body>
              <h6 className="text-info mb-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Important Information
              </h6>
              <ul className="mb-0 text-muted">
                <li>The signature image will be used in all PDF reports generated by the system</li>
                <li>For best results, use a clear signature image with transparent or white background</li>
                <li>Recommended dimensions: 400x150 pixels or similar aspect ratio</li>
                <li>The signature will be automatically resized to fit the PDF layout</li>
                <li>Changes take effect immediately for new PDF reports</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SignatureManagement;
