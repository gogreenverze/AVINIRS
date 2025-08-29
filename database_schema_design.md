# Database Schema Design for Excel Integration

## Overview
The application uses JSON file-based storage. We need to create new data structures to store Excel data and integrate it with existing Test Master and Result Master forms.

## Current Data Structure Analysis

### Existing Test Master Structure (test_master.json)
```json
{
  "id": 1,
  "department": "IMMUNOLOGY",
  "testName": "1,25 Dihydroxyvitamin D",
  "hmsCode": "648.0",
  "method": "Automated",
  "container": "Serum",
  "specimen": ["Serum"],
  "reference_range": "19.9-79.3",
  "result_unit": "pg/ml",
  "decimals": 1,
  "test_price": 3500.0,
  "critical_low": null,
  "critical_high": null,
  "serviceTime": "24 Hours",
  "is_active": true
}
```

### Existing Result Master Structure (result_master.json)
```json
{
  "id": 1,
  "test_name": "Glouse 120min",
  "result_name": "test",
  "parameter_name": "test",
  "unit": "mg/dl",
  "result_type": "calculated",
  "reference_range": "test",
  "critical_low": "2",
  "critical_high": "1.96",
  "decimal_places": "0",
  "is_active": true
}
```

### Excel Data Structure (from analysis)
```json
{
  "Test Name": "17 HYDROXY CORTICO STEROID 24 HR URINE",
  "code": 3,
  "Department": "Biochemistry",
  "Referance Range": "< 1 Years : <= 1.0 (Both)",
  "Result Unit": "mg/24hrs",
  "No of decimals": 2,
  "Critical Low": null,
  "Critical High": null,
  "Price": 4000,
  "Result Type": "Pick List",
  "Short Name": "17HY",
  "Method code": 45,
  "Method": "Column Chromatography",
  "Specimen Code": 3,
  "Specimen": "24 Hrs Urine",
  "Container Code": 13,
  "Container": "Sterile Container",
  "Instructions": "10 ml of 50% HCL as preservative",
  "Min. Sample Qty": "50ml",
  "Test Done On": "all",
  "Applicable to": "Both",
  "Reporting Days": 10
}
```

## New Data Structures

### 1. Excel Test Data (excel_test_data.json)
Consolidated data from all Excel sheets with normalized field names:
```json
{
  "id": 1,
  "test_name": "17 HYDROXY CORTICO STEROID 24 HR URINE",
  "test_code": "000003",
  "department": "Biochemistry",
  "reference_range": "< 1 Years : <= 1.0 (Both)",
  "result_unit": "mg/24hrs",
  "decimals": 2,
  "critical_low": null,
  "critical_high": null,
  "price": 4000,
  "result_type": "Pick List",
  "short_name": "17HY",
  "method_code": 45,
  "method": "Column Chromatography",
  "specimen_code": 3,
  "specimen": "24 Hrs Urine",
  "container_code": 13,
  "container": "Sterile Container",
  "instructions": "10 ml of 50% HCL as preservative",
  "min_sample_qty": "50ml",
  "test_done_on": "all",
  "applicable_to": "Both",
  "reporting_days": 10,
  "source_sheet": "BioChemistry",
  "is_active": true,
  "created_at": "2025-01-08T00:00:00",
  "updated_at": "2025-01-08T00:00:00"
}
```

### 2. Enhanced Test Master (test_master_enhanced.json)
Combines existing test master with Excel data capabilities:
```json
{
  "id": 1,
  "department": "BIOCHEMISTRY",
  "testName": "17 HYDROXY CORTICO STEROID 24 HR URINE",
  "hmsCode": "000003",
  "test_code": "000003",
  "short_name": "17HY",
  "method": "Column Chromatography",
  "method_code": 45,
  "specimen": ["24 Hrs Urine"],
  "specimen_code": 3,
  "container": "Sterile Container",
  "container_code": 13,
  "reference_range": "< 1 Years : <= 1.0 (Both)",
  "result_unit": "mg/24hrs",
  "decimals": 2,
  "critical_low": null,
  "critical_high": null,
  "test_price": 4000,
  "result_type": "Pick List",
  "instructions": "10 ml of 50% HCL as preservative",
  "min_sample_qty": "50ml",
  "serviceTime": "24 Hours",
  "reporting_days": 10,
  "test_done_on": "all",
  "applicable_to": "Both",
  "excel_source": true,
  "source_sheet": "BioChemistry",
  "is_active": true,
  "created_at": "2025-01-08T00:00:00",
  "updated_at": "2025-01-08T00:00:00"
}
```

### 3. Enhanced Result Master (result_master_enhanced.json)
Combines existing result master with Excel data:
```json
{
  "id": 1,
  "test_name": "17 HYDROXY CORTICO STEROID 24 HR URINE",
  "test_code": "000003",
  "department": "BIOCHEMISTRY",
  "result_name": "17 HYDROXY CORTICO STEROID",
  "parameter_name": "17 HYDROXY CORTICO STEROID",
  "unit": "mg/24hrs",
  "result_type": "Pick List",
  "reference_range": "< 1 Years : <= 1.0 (Both)",
  "critical_low": null,
  "critical_high": null,
  "decimal_places": 2,
  "method": "Column Chromatography",
  "specimen_type": "24 Hrs Urine",
  "container": "Sterile Container",
  "instructions": "10 ml of 50% HCL as preservative",
  "min_sample_qty": "50ml",
  "excel_source": true,
  "source_sheet": "BioChemistry",
  "is_active": true,
  "created_at": "2025-01-08T00:00:00",
  "updated_at": "2025-01-08T00:00:00"
}
```

## Field Mapping Strategy

### Excel to Test Master Mapping
| Excel Field | Test Master Field | Notes |
|-------------|------------------|-------|
| Test Name | testName | Direct mapping |
| code | hmsCode, test_code | Format as 6-digit padded |
| Department | department | Normalize case |
| Price | test_price | Direct mapping |
| Method | method | Direct mapping |
| Method code | method_code | Direct mapping |
| Specimen | specimen | Convert to array |
| Container | container | Direct mapping |
| Instructions | instructions | Direct mapping |
| Referance Range | reference_range | Fix typo in source |
| Result Unit | result_unit | Direct mapping |
| No of decimals | decimals | Direct mapping |

### Excel to Result Master Mapping
| Excel Field | Result Master Field | Notes |
|-------------|-------------------|-------|
| Test Name | test_name | Direct mapping |
| code | test_code | Format as 6-digit padded |
| Department | department | Normalize case |
| Referance Range | reference_range | Fix typo in source |
| Result Unit | unit | Direct mapping |
| No of decimals | decimal_places | Direct mapping |
| Critical Low | critical_low | Direct mapping |
| Critical High | critical_high | Direct mapping |
| Result Type | result_type | Direct mapping |

## Data Integration Strategy

1. **Import Process**: Read Excel data and create normalized JSON structures
2. **Merge Strategy**: Combine Excel data with existing manual entries
3. **Conflict Resolution**: Excel data takes priority for matching test codes
4. **Auto-Population**: Use Excel data to populate form fields when test is selected
5. **Manual Override**: Allow users to modify any auto-populated field

## API Endpoints Required

### Data Import
- `POST /api/admin/excel-data/import` - Import Excel data
- `GET /api/admin/excel-data/status` - Check import status

### Enhanced Test Master
- `GET /api/admin/test-master-enhanced` - Get all enhanced test master data
- `POST /api/admin/test-master-enhanced` - Create new test master entry
- `PUT /api/admin/test-master-enhanced/:id` - Update test master entry
- `GET /api/admin/test-master-enhanced/search` - Search by test name/code

### Enhanced Result Master
- `GET /api/admin/result-master-enhanced` - Get all enhanced result master data
- `POST /api/admin/result-master-enhanced` - Create new result master entry
- `PUT /api/admin/result-master-enhanced/:id` - Update result master entry

### Auto-Population
- `GET /api/admin/test-data/lookup/:testCode` - Get test data by code
- `GET /api/admin/test-data/search/:testName` - Search test data by name
