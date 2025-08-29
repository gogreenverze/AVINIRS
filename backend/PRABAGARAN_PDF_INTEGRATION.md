# PRABAGARAN PDF Format Integration

## Overview

This document describes the integration of the PRABAGARAN.pdf format into the Avini Labs billing reports system. The new PDF generation creates reports that exactly match the layout and formatting of the reference PRABAGARAN.pdf file.

## Features

### ✅ Exact Format Replication
- **Header Layout**: Two-column patient and report information layout
- **Section Structure**: Department-based test groupings (BIOCHEMISTRY, IMMUNOLOGY, etc.)
- **Table Format**: Grid-based test results with proper column widths
- **Clinical Notes**: Automatic generation of relevant clinical notes based on test types
- **Signatures**: Professional signature section with lab personnel information

### ✅ Data Transformation
- **Patient Information**: Transforms billing data to medical report format
- **Test Grouping**: Automatically groups tests by department
- **Date Formatting**: Converts to DD/MM/YYYY HH:MM:SS format
- **Age Calculation**: Automatically calculates age from date of birth
- **Reference Ranges**: Includes biological reference intervals

### ✅ Professional Styling
- **A4 Format**: Standard medical report page size
- **Proper Margins**: 36-point margins (approximately 1cm)
- **Typography**: Helvetica font family with appropriate sizing
- **Grid Layout**: Professional table formatting with borders
- **Color Coding**: Appropriate use of colors for headers and sections

## Implementation Details

### New Function Added
```python
def generate_prabagaran_format_pdf(self, report_data: Dict) -> bytes:
    """
    Generate PDF that EXACTLY replicates the PRABAGARAN.pdf format
    This follows the exact layout, styling, and structure from the reference PDF
    Returns: PDF content as bytes
    """
```

### Data Structure Transformation
The function transforms billing report data into the PRABAGARAN format structure:

```python
prabagaran_data = {
    'header': {
        'patient': {
            'Patient': 'Mr. PRABHAKARAN',
            'SID No.': 'MYD001',
            'Age / Sex': '47 Y / Male',
            'Reg Date & Time': '28/05/2025 14:52:33'
        },
        'report': {
            'Branch': 'MAYILADUTHURAI',
            'Coll Date & Time': '28/05/2025 14:52:33',
            'Report Date & Time': '28/05/2025 16:39:48'
        }
    },
    'sections': [
        {
            'name': 'BIOCHEMISTRY',
            'columns': ['INVESTIGATION / METHOD', 'RESULT', 'UNITS', 'BIOLOGICAL REFERENCE INTERVAL'],
            'rows': [...],
            'colWidths': [180, 60, 60, 180]
        }
    ],
    'notes': [...],
    'signatures': [...]
}
```

### Route Integration
The billing reports route has been updated to use the new format:

```python
# Generate professional PDF content using PRABAGARAN format
pdf_content = pdf_generator.generate_prabagaran_format_pdf(report)
```

## Usage

### From Billing Reports Interface
1. Navigate to Billing Reports page
2. Find the desired report
3. Click the "Download PDF" button
4. The PDF will be generated in PRABAGARAN format

### API Endpoint
```
GET /api/billing-reports/{report_id}/download
```

### Testing
Run the test script to verify functionality:
```bash
cd backend
python test_prabagaran_pdf.py
```

## Key Differences from Original UI Format

| Aspect | Original UI Format | PRABAGARAN Format |
|--------|-------------------|-------------------|
| Layout | Card-based UI layout | Medical report layout |
| Pricing | Includes billing amounts | NO pricing information |
| Sections | UI components | Department-based groupings |
| Headers | Modal-style headers | Professional medical headers |
| Notes | Basic metadata | Clinical notes and disclaimers |
| Signatures | None | Professional lab signatures |

## Dependencies

The following packages are required and already included in requirements.txt:
- `reportlab==4.0.4` - PDF generation
- `python-barcode==0.15.1` - Barcode generation (optional)
- `qrcode==7.4.2` - QR code generation (optional)
- `pillow==10.0.1` - Image processing

## File Structure

```
backend/
├── services/
│   └── pdf_report_generator.py          # Main PDF generator with new PRABAGARAN function
├── routes/
│   └── billing_reports_routes.py        # Updated route to use PRABAGARAN format
├── test_prabagaran_pdf.py              # Test script
└── PRABAGARAN_PDF_INTEGRATION.md       # This documentation
```

## Notes

- **No Pricing Information**: The PRABAGARAN format excludes all pricing/billing amounts as per medical report standards
- **Clinical Focus**: Emphasizes test results, reference ranges, and clinical interpretation
- **Professional Appearance**: Designed for medical professionals and patients
- **Compliance**: Follows standard medical laboratory report formatting

## Future Enhancements

- Add barcode generation for sample tracking
- Include QR codes for digital verification
- Support for multiple page reports
- Custom signature integration
- Laboratory accreditation logos
