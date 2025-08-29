import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, ListGroup, Badge, Modal, Form, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, faUpload, faDownload, faTrash, faPlus, 
  faFile, faFilePdf, faFileWord, faFileExcel, faFileImage
} from '@fortawesome/free-solid-svg-icons';
import { fileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

const FileManager = ({ routingId }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, [routingId]);

  const fetchFiles = async () => {
    try {
      setError(null);
      const response = await fileAPI.getFiles(routingId);
      setFiles(response.data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename, contentType) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (contentType?.includes('pdf') || extension === 'pdf') {
      return faFilePdf;
    } else if (contentType?.includes('word') || ['doc', 'docx'].includes(extension)) {
      return faFileWord;
    } else if (contentType?.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
      return faFileExcel;
    } else if (contentType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return faFileImage;
    } else {
      return faFile;
    }
  };

  const getFileIconColor = (filename, contentType) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (contentType?.includes('pdf') || extension === 'pdf') {
      return 'text-danger';
    } else if (contentType?.includes('word') || ['doc', 'docx'].includes(extension)) {
      return 'text-primary';
    } else if (contentType?.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
      return 'text-success';
    } else if (contentType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'text-info';
    } else {
      return 'text-secondary';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', fileDescription);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await fileAPI.uploadFile(routingId, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setSelectedFile(null);
      setFileDescription('');
      setShowUploadModal(false);
      
      // Refresh file list
      await fetchFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fileAPI.downloadFile(routingId, fileId);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (fileId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await fileAPI.deleteFile(routingId, fileId);
      await fetchFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card className="shadow">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading files...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            File Attachments
          </h6>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Upload File
          </Button>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {files.length === 0 ? (
            <div className="text-center text-muted py-5">
              <FontAwesomeIcon icon={faFileAlt} size="3x" className="mb-3" />
              <p>No files uploaded yet.</p>
              <Button
                variant="outline-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <FontAwesomeIcon icon={faUpload} className="me-1" />
                Upload First File
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush">
              {files.map(file => (
                <ListGroup.Item key={file.id} className="d-flex align-items-center">
                  <div className="me-3">
                    <FontAwesomeIcon
                      icon={getFileIcon(file.filename, file.content_type)}
                      size="2x"
                      className={getFileIconColor(file.filename, file.content_type)}
                    />
                  </div>
                  
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{file.filename}</h6>
                    <div className="d-flex align-items-center gap-3">
                      <small className="text-muted">
                        {formatFileSize(file.file_size)}
                      </small>
                      <small className="text-muted">
                        Uploaded by {file.uploader_name || 'Unknown'}
                      </small>
                      <small className="text-muted">
                        {formatDate(file.created_at)}
                      </small>
                    </div>
                    {file.description && (
                      <p className="mb-0 mt-1 text-muted small">
                        {file.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.filename)}
                      title="Download"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </Button>
                    
                    {file.uploaded_by === user?.id && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.filename)}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Upload File
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.zip,.rar"
                required
              />
              <Form.Text className="text-muted">
                Maximum file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX, CSV, ZIP
              </Form.Text>
            </Form.Group>

            {selectedFile && (
              <Alert variant="info">
                <strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Brief description of this file..."
              />
            </Form.Group>

            {uploading && (
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Uploading...</small>
                  <small>{uploadProgress}%</small>
                </div>
                <ProgressBar now={uploadProgress} />
              </div>
            )}
          </Modal.Body>
          
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="me-1" />
                  Upload File
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

FileManager.propTypes = {
  routingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default FileManager;
