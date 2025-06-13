# Master Data Management System

## Overview

The Master Data Management System is a comprehensive solution for managing all reference data in the laboratory management system. It provides a centralized interface for managing various types of master data with full CRUD operations, Excel import/export capabilities, and robust validation.

## Features

### Core Functionality
- **Complete CRUD Operations**: Create, Read, Update, Delete for all master data categories
- **Search and Filter**: Real-time search across all data fields
- **Status Management**: Active/Inactive status for all records
- **Audit Trail**: Created/Updated timestamps and user tracking
- **Validation**: Comprehensive data validation and error handling

### Excel Integration
- **Import from Excel**: Bulk import data from Excel files with validation
- **Export to Excel**: Export current data to Excel format
- **Template Download**: Download pre-formatted templates for easy data entry
- **Error Reporting**: Detailed validation errors with row and field information

### User Interface
- **Tabbed Interface**: Easy navigation between different master data categories
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Immediate reflection of changes
- **Intuitive Forms**: User-friendly forms with proper validation

## Master Data Categories

### 1. Test Categories
Organize laboratory tests into logical categories.

**Fields:**
- Name (Required)
- Description
- Status (Active/Inactive)

**Use Cases:**
- Grouping related tests (e.g., Hematology, Biochemistry, Microbiology)
- Organizing test menus
- Reporting and analytics

### 2. Test Parameters
Individual measurable parameters for laboratory tests.

**Fields:**
- Name (Required)
- Unit of Measurement
- Reference Range
- Category ID (Link to Test Categories)
- Status (Active/Inactive)

**Use Cases:**
- Defining what gets measured in each test
- Setting normal ranges for results
- Quality control and validation

### 3. Sample Types
Types of biological samples that can be collected.

**Fields:**
- Name (Required)
- Description
- Storage Instructions
- Validity Days
- Status (Active/Inactive)

**Use Cases:**
- Sample collection protocols
- Storage and handling procedures
- Sample tracking and management

### 4. Departments
Organizational departments within the laboratory.

**Fields:**
- Name (Required)
- Description
- Status (Active/Inactive)

**Use Cases:**
- Workflow organization
- Staff assignment
- Reporting and analytics

### 5. Payment Methods
Available payment options for laboratory services.

**Fields:**
- Name (Required)
- Description
- Is Online (Yes/No)
- Status (Active/Inactive)

**Use Cases:**
- Billing and invoicing
- Payment processing
- Financial reporting

### 6. Containers
Physical containers used for sample collection.

**Fields:**
- Name (Required)
- Type (Tube, Bottle, Vial, etc.)
- Volume
- Unit (mL, L, etc.)
- Color
- Additive (EDTA, Heparin, etc.)
- Status (Active/Inactive)

**Use Cases:**
- Sample collection protocols
- Inventory management
- Quality assurance

### 7. Instruments
Laboratory equipment and instruments.

**Fields:**
- Name (Required)
- Model
- Manufacturer
- Serial Number
- Installation Date
- Calibration Due Date
- Status (Active/Inactive)

**Use Cases:**
- Equipment tracking
- Maintenance scheduling
- Quality control
- Compliance reporting

### 8. Reagents
Chemical reagents used in laboratory tests.

**Fields:**
- Name (Required)
- Lot Number
- Expiry Date
- Manufacturer
- Storage Temperature
- Status (Active/Inactive)

**Use Cases:**
- Inventory management
- Quality control
- Expiry tracking
- Cost management

### 9. Suppliers
Vendors and suppliers for laboratory materials.

**Fields:**
- Name (Required)
- Contact Person
- Email
- Phone
- Address
- Status (Active/Inactive)

**Use Cases:**
- Procurement management
- Vendor relationships
- Purchase order processing
- Quality assurance

### 10. Units
Units of measurement used in laboratory results.

**Fields:**
- Name (Required)
- Symbol (Required)
- Type (Concentration, Volume, Mass, etc.)
- Conversion Factor
- Status (Active/Inactive)

**Use Cases:**
- Result reporting
- Unit conversions
- Standardization
- Quality control

### 11. Test Methods
Analytical methods used for laboratory tests.

**Fields:**
- Name (Required)
- Description
- Principle
- Procedure
- Status (Active/Inactive)

**Use Cases:**
- Method documentation
- Quality assurance
- Training materials
- Compliance reporting

## API Endpoints

### Master Data Operations

#### Get All Master Data
```
GET /api/admin/master-data
```
Returns all master data categories with their records.

#### Add New Record
```
POST /api/admin/master-data/{category}
```
Creates a new record in the specified category.

#### Update Record
```
PUT /api/admin/master-data/{category}/{id}
```
Updates an existing record.

#### Delete Record
```
DELETE /api/admin/master-data/{category}/{id}
```
Deletes a record (soft delete recommended).

### Excel Operations

#### Import from Excel
```
POST /api/admin/master-data/import
```
**Parameters:**
- `file`: Excel file (multipart/form-data)
- `category`: Master data category

**Response:**
```json
{
  "success_count": 10,
  "error_count": 2,
  "total_rows": 12,
  "errors": [
    {
      "row": 5,
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

#### Export to Excel
```
GET /api/admin/master-data/export?category={category}
```
Downloads Excel file with current data.

#### Download Template
```
GET /api/admin/master-data/template?category={category}
```
Downloads Excel template for data import.

## Usage Instructions

### Adding New Records

1. Navigate to the Master Data page
2. Select the appropriate tab for the data category
3. Click "Add New" button
4. Fill in the required fields
5. Click "Save" to create the record

### Editing Records

1. Find the record in the table
2. Click the edit (pencil) icon
3. Modify the fields as needed
4. Click "Save" to update the record

### Deleting Records

1. Find the record in the table
2. Click the delete (trash) icon
3. Confirm the deletion in the popup dialog

### Excel Import

1. Click "Excel Import/Export" button
2. Download the template for your category
3. Fill in your data following the template format
4. Upload the completed Excel file
5. Review the import results and fix any errors

### Excel Export

1. Click "Excel Import/Export" button
2. Click "Export to Excel" to download current data
3. The file will be saved to your downloads folder

## Data Validation Rules

### Common Rules
- **Required Fields**: Must not be empty
- **Unique Constraints**: Certain fields must be unique (e.g., unit symbols)
- **Data Types**: Proper data type validation (numbers, dates, emails)
- **Length Limits**: Maximum character limits for text fields

### Category-Specific Rules
- **Test Parameters**: Must have valid category_id
- **Units**: Symbol must be unique
- **Instruments**: Serial numbers should be unique
- **Suppliers**: Email format validation

## Best Practices

### Data Entry
1. Use consistent naming conventions
2. Provide meaningful descriptions
3. Keep reference ranges up to date
4. Regularly review and update inactive records

### Excel Import
1. Always download and use the provided templates
2. Validate data before import
3. Import in small batches for easier error handling
4. Review import results carefully

### Data Management
1. Regular backups of master data
2. Periodic review of inactive records
3. Maintain audit trails
4. Document any custom modifications

## Troubleshooting

### Common Issues

**Excel Import Fails**
- Check file format (must be .xlsx or .xls)
- Verify all required fields are filled
- Ensure data types match expected formats
- Check for special characters or formatting issues

**Validation Errors**
- Review error messages carefully
- Check for duplicate entries
- Verify foreign key relationships
- Ensure required fields are not empty

**Performance Issues**
- Large datasets may take time to load
- Use search and filters to narrow down data
- Consider pagination for very large datasets

### Support
For technical support or questions about the Master Data Management System, please contact the system administrator or refer to the main system documentation.
