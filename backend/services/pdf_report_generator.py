"""
PDF Report Generator Service
Professional PDF generation for billing reports following PRABAGARAN model specifications
with proper medical report formatting and print-ready output.
"""

import os
import base64
from datetime import datetime
from typing import Dict, Optional
import logging
from io import BytesIO

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

# Barcode generation
try:
    from barcode import Code128
    from barcode.writer import ImageWriter
    BARCODE_AVAILABLE = True
except ImportError:
    BARCODE_AVAILABLE = False
    print("Warning: Barcode library not available. Install python-barcode for barcode generation.")

# QR Code generation
try:
    import qrcode
    from PIL import Image as PILImage
    QR_CODE_AVAILABLE = True
except ImportError:
    QR_CODE_AVAILABLE = False
    logger.warning("QR Code library not available. Install qrcode and Pillow for QR code generation.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFReportGenerator:
    """Service for generating professional PDF billing reports"""

    def __init__(self):
        self.page_width = A4[0]  # A4 width in points
        self.page_height = A4[1]  # A4 height in points
        self.margin = 20 * mm  # Professional margin like PRABAGARAN (20mm = ~56.69 points)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the PDF following PRABAGARAN medical report standards"""
        # Main clinic title style - larger, more prominent
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Heading1'],
            fontSize=20,
            spaceAfter=3,
            spaceBefore=0,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        ))

        # Clinic subtitle style
        self.styles.add(ParagraphStyle(
            name='ClinicSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=2,
            spaceBefore=0,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica'
        ))

        # Clinic contact info style
        self.styles.add(ParagraphStyle(
            name='ClinicContact',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=1,
            spaceBefore=0,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica'
        ))

        # Report title style - clean, professional
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica-Bold',
            borderWidth=1,
            borderColor=colors.black,
            borderPadding=6
        ))

        # Section header style - clean without background
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=11,
            spaceAfter=4,
            spaceBefore=8,
            alignment=TA_LEFT,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        ))

        # Field label style
        self.styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=2,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))

        # Field value style
        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=2,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))

        # Normal text style
        self.styles.add(ParagraphStyle(
            name='NormalText',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=3,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))

        # Bold text style
        self.styles.add(ParagraphStyle(
            name='BoldText',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=3,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))

        # Small text style
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            spaceAfter=2,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))

        # Right aligned text
        self.styles.add(ParagraphStyle(
            name='RightAlign',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=3,
            alignment=TA_RIGHT,
            fontName='Helvetica'
        ))

        # Center aligned text
        self.styles.add(ParagraphStyle(
            name='CenterAlign',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=3,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))

        # Test result header style
        self.styles.add(ParagraphStyle(
            name='TestHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=3,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            textColor=colors.black
        ))

        # Test result value style
        self.styles.add(ParagraphStyle(
            name='TestValue',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=2,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))

    def generate_comprehensive_billing_pdf(self, report_data: Dict) -> bytes:
        """
        Generate PDF that EXACTLY replicates the UI detail view layout
        Uses exact color codes and styling from the web interface
        Returns: PDF content as bytes
        """
        try:
            # Create a BytesIO buffer to hold the PDF
            buffer = BytesIO()

            # Create the PDF document with A4 format
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=self.margin,
                leftMargin=self.margin,
                topMargin=self.margin,
                bottomMargin=self.margin
            )

            # Build the PDF content
            story = []

            # Extract data from report
            patient_info = report_data.get('patient_info', {})
            clinic_info = report_data.get('clinic_info', {})
            test_items = report_data.get('test_items', [])
            billing_header = report_data.get('billing_header', {})
            financial_summary = report_data.get('financial_summary', {})
            metadata = report_data.get('metadata', {})
            unmatched_tests = report_data.get('unmatched_tests', [])

            # Generate PDF sections matching the EXACT UI layout
            story.extend(self._generate_exact_ui_header(report_data))
            story.append(Spacer(1, 16))

            # Report Information and Clinic Information cards (side by side with exact colors)
            story.extend(self._generate_exact_ui_cards(report_data, clinic_info))
            story.append(Spacer(1, 16))

            # Patient Information section (exact UI styling)
            story.extend(self._generate_exact_patient_section(patient_info))
            story.append(Spacer(1, 16))

            # Billing Information section (if available)
            if billing_header:
                story.extend(self._generate_exact_billing_section(billing_header))
                story.append(Spacer(1, 16))

            # Test Details section with exact card styling
            story.extend(self._generate_exact_test_cards_section(test_items))
            story.append(Spacer(1, 16))

            # Unmatched Tests warning (if any)
            if unmatched_tests:
                story.extend(self._generate_exact_unmatched_section(unmatched_tests))
                story.append(Spacer(1, 16))

            # Financial Summary section (exact styling)
            if financial_summary:
                story.extend(self._generate_exact_financial_section(financial_summary))
                story.append(Spacer(1, 16))

            # Report Metadata section (exact styling)
            if metadata:
                story.extend(self._generate_exact_metadata_section(metadata))

            # Build the PDF
            doc.build(story)

            # Get the PDF content
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()

            return pdf_content

        except Exception as e:
            logger.error(f"Error generating exact UI replica PDF: {str(e)}")
            return self._generate_error_pdf(str(e))
    
    def _generate_medical_report_header(self, report_data: Dict, clinic_info: Dict) -> list:
        """Generate medical report header section following PRABAGARAN format"""
        sid_number = report_data.get('sid_number', 'N/A')
        report_date = datetime.now().strftime('%d/%m/%Y')

        elements = []

        # Laboratory Logo/Header - PRABAGARAN style
        elements.append(Paragraph("AVINI LABORATORIES", self.styles['MainTitle']))
        elements.append(Paragraph("DIAGNOSTIC & PATHOLOGY SERVICES", self.styles['ClinicSubtitle']))
        elements.append(Spacer(1, 4))

        # Clinic contact information - clean format
        clinic_address = clinic_info.get('address', 'Laboratory Address')
        clinic_phone = clinic_info.get('contact_phone', 'Phone Number')
        clinic_email = clinic_info.get('email', 'Email Address')

        elements.append(Paragraph(f"{clinic_address}", self.styles['ClinicContact']))
        elements.append(Paragraph(f"Phone: {clinic_phone} | Email: {clinic_email}", self.styles['ClinicContact']))
        elements.append(Spacer(1, 8))

        # Report title - boxed style like PRABAGARAN
        elements.append(Paragraph("LABORATORY TEST REPORT", self.styles['ReportTitle']))
        elements.append(Spacer(1, 6))

        # Report identification - non-tabular format like PRABAGARAN
        collection_date = report_data.get('collection_date', report_data.get('billing_date', 'N/A'))
        sample_id = report_data.get('sample_id', sid_number)

        # Create two-column layout for report info
        report_info_data = [
            [
                Paragraph(f"<b>Report ID:</b> {sid_number}", self.styles['FieldValue']),
                Paragraph(f"<b>Report Date:</b> {report_date}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Sample ID:</b> {sample_id}", self.styles['FieldValue']),
                Paragraph(f"<b>Collection Date:</b> {collection_date}", self.styles['FieldValue'])
            ]
        ]

        report_info_table = Table(report_info_data, colWidths=[3*inch, 3*inch])
        report_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))

        elements.append(report_info_table)
        elements.append(Spacer(1, 8))

        return elements
    
    def _generate_patient_demographics(self, patient_info: Dict, report_data: Dict) -> list:
        """Generate patient demographics section following PRABAGARAN format"""
        elements = []

        # Section header - clean style
        elements.append(Paragraph("PATIENT INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Patient information in PRABAGARAN non-tabular format
        address = patient_info.get('address', {})
        full_address = f"{address.get('street', '')}, {address.get('city', '')}, {address.get('state', '')} - {address.get('postal_code', '')}"

        # Calculate age if not provided
        age = patient_info.get('age', 'N/A')
        if age == 'N/A' and patient_info.get('date_of_birth'):
            try:
                from datetime import datetime
                birth_date = datetime.strptime(patient_info.get('date_of_birth'), '%Y-%m-%d')
                today = datetime.now()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1
                age = f"{age} years"
            except:
                age = 'N/A'

        # Create clean two-column layout like PRABAGARAN
        patient_data = [
            [
                Paragraph(f"<b>Patient Name:</b> {patient_info.get('full_name', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Patient ID:</b> {patient_info.get('patient_id', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Date of Birth:</b> {patient_info.get('date_of_birth', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Age:</b> {age}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Gender:</b> {patient_info.get('gender', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Blood Group:</b> {patient_info.get('blood_group', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Mobile:</b> {patient_info.get('mobile', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Email:</b> {patient_info.get('email', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        patient_table = Table(patient_data, colWidths=[3*inch, 3*inch])
        patient_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(patient_table)
        elements.append(Spacer(1, 4))

        # Address on separate line for better formatting
        elements.append(Paragraph(f"<b>Address:</b> {full_address}", self.styles['FieldValue']))

        return elements

    def _generate_specimen_collection_info(self, report_data: Dict) -> list:
        """Generate specimen collection information section following PRABAGARAN format"""
        elements = []

        # Section header
        elements.append(Paragraph("SPECIMEN INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Specimen collection details - PRABAGARAN clean format
        referring_doctor = report_data.get('billing_header', {}).get('referring_doctor', 'N/A')
        collection_date = report_data.get('collection_date', report_data.get('billing_date', 'N/A'))

        # Determine primary specimen type from test items
        test_items = report_data.get('test_items', [])
        primary_specimens = set()
        for test in test_items:
            # Get specimen from test_master_data first, then fallback
            test_master_data = test.get('test_master_data', {})
            specimen = test_master_data.get('primarySpecimen') or test.get('specimen') or test.get('primary_specimen')
            if specimen:
                # Handle both string and list formats for specimen
                if isinstance(specimen, list):
                    for spec in specimen:
                        if spec:
                            primary_specimens.add(str(spec))
                else:
                    primary_specimens.add(str(specimen))

        specimen_types = ', '.join(primary_specimens) if primary_specimens else 'Serum/Blood'

        # Create clean two-column layout like PRABAGARAN
        collection_data = [
            [
                Paragraph(f"<b>Collection Date:</b> {collection_date}", self.styles['FieldValue']),
                Paragraph(f"<b>Collection Time:</b> {report_data.get('collection_time', 'Morning')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Specimen Type(s):</b> {specimen_types}", self.styles['FieldValue']),
                Paragraph(f"<b>Collection Method:</b> {report_data.get('collection_method', 'Venipuncture')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Fasting Status:</b> {report_data.get('fasting_status', 'As Required')}", self.styles['FieldValue']),
                Paragraph(f"<b>Referring Doctor:</b> {referring_doctor}", self.styles['FieldValue'])
            ]
        ]

        collection_table = Table(collection_data, colWidths=[3*inch, 3*inch])
        collection_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(collection_table)

        return elements


    
    def _generate_test_results_section(self, test_items: list) -> list:
        """Generate test results section following PRABAGARAN format (NO PRICING)"""
        elements = []

        # Section header
        elements.append(Paragraph("LABORATORY TEST RESULTS", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        if not test_items:
            elements.append(Paragraph("No test results available.", self.styles['NormalText']))
            return elements

        # Generate test results in PRABAGARAN format - individual test blocks with profile grouping
        current_profile = None
        test_counter = 1

        for i, test in enumerate(test_items, 1):
            test_name = test.get('test_name', 'N/A')
            is_profile_subtest = test.get('is_profile_subtest', False)
            parent_profile_name = test.get('parent_profile_name')

            # Add profile header if this is the first sub-test of a new profile
            if is_profile_subtest and parent_profile_name != current_profile:
                current_profile = parent_profile_name
                # Profile header
                elements.append(Paragraph(f"<b>📋 PROFILE: {parent_profile_name.upper()}</b>", self.styles['SectionHeader']))
                elements.append(Spacer(1, 4))

            # Get enhanced test data from test_master
            test_master_data = test.get('test_master_data', {})
            department = test_master_data.get('department', test.get('department', 'GENERAL'))
            specimen = test_master_data.get('primarySpecimen', test.get('specimen', 'Serum'))
            method = test_master_data.get('method', test.get('method', 'Standard'))

            # Test header with department and profile context
            if is_profile_subtest:
                subtest_index = test.get('subtest_index', 1)
                total_subtests = test.get('total_subtests', 1)
                test_header = f"<b>  {subtest_index}/{total_subtests}. {test_name}</b>"
            else:
                test_header = f"<b>{test_counter}. {test_name}</b>"
                test_counter += 1

            elements.append(Paragraph(test_header, self.styles['TestHeader']))
            elements.append(Spacer(1, 2))

            # Test details in clean format
            test_details_data = [
                [
                    Paragraph(f"<b>Department:</b> {department}", self.styles['FieldValue']),
                    Paragraph(f"<b>Specimen:</b> {specimen}", self.styles['FieldValue'])
                ],
                [
                    Paragraph(f"<b>Method:</b> {method}", self.styles['FieldValue']),
                    Paragraph(f"<b>Status:</b> {test.get('status', 'Completed')}", self.styles['FieldValue'])
                ]
            ]

            # Add result information if available
            result_value = test.get('result_value', 'Pending')
            reference_range = test_master_data.get('referenceRange', test.get('reference_range', 'N/A'))
            unit = test_master_data.get('unit', test.get('result_unit', ''))

            if result_value != 'Pending':
                test_details_data.append([
                    Paragraph(f"<b>Result:</b> {result_value} {unit}", self.styles['FieldValue']),
                    Paragraph(f"<b>Reference Range:</b> {reference_range}", self.styles['FieldValue'])
                ])

            test_details_table = Table(test_details_data, colWidths=[3*inch, 3*inch])
            test_details_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))

            elements.append(test_details_table)

            # Add interpretation if available
            interpretation = test_master_data.get('interpretation', test.get('interpretation'))
            if interpretation:
                elements.append(Spacer(1, 2))
                elements.append(Paragraph(f"<b>Interpretation:</b> {interpretation}", self.styles['FieldValue']))

            # Add spacing between tests
            if i < len(test_items):
                elements.append(Spacer(1, 6))

        elements.append(Spacer(1, 8))

        # Add clinical notes
        elements.append(Paragraph("CLINICAL NOTES:", self.styles['BoldText']))
        elements.append(Paragraph("• Results should be interpreted in conjunction with clinical findings.", self.styles['NormalText']))
        elements.append(Paragraph("• Values outside reference range require clinical attention.", self.styles['NormalText']))
        elements.append(Paragraph("• For any queries, please contact the laboratory.", self.styles['NormalText']))

        return elements

    def _generate_clinical_notes_section(self, report_data: Dict) -> list:
        """Generate clinical notes section following PRABAGARAN format"""
        elements = []

        # Section header
        elements.append(Paragraph("CLINICAL NOTES & DISCLAIMERS", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Clinical notes in PRABAGARAN format
        clinical_notes = [
            "• This report contains the laboratory findings for the tests requested and should be interpreted in conjunction with clinical findings.",
            "• Results are valid only for the specimen tested and the testing methodology used.",
            "• Values outside the reference range require clinical correlation and may need further investigation.",
            "• Any discrepancy in patient information or test results should be reported to the laboratory immediately.",
            "• This report is generated electronically and is valid without physical signature when properly authenticated.",
            "• For any technical queries or result interpretation, please contact our laboratory at the provided contact information."
        ]

        for note in clinical_notes:
            elements.append(Paragraph(note, self.styles['NormalText']))
            elements.append(Spacer(1, 2))

        return elements


    
    def _generate_medical_report_footer(self, report_data: Dict) -> list:
        """Generate medical report footer section following PRABAGARAN format"""
        elements = []
        metadata = report_data.get('metadata', {})
        generation_time = datetime.now().strftime('%d/%m/%Y at %H:%M:%S')

        # Add spacing before footer
        elements.append(Spacer(1, 12))

        # Laboratory certification section - PRABAGARAN style
        elements.append(Paragraph("LABORATORY CERTIFICATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 6))

        # Quality assurance information
        qa_info = [
            "• Laboratory accredited by NABL (National Accreditation Board for Testing and Calibration Laboratories)",
            "• All tests performed using validated methods and calibrated instruments",
            "• Internal and external quality control measures implemented",
            "• Results verified by qualified laboratory personnel"
        ]

        for info in qa_info:
            elements.append(Paragraph(info, self.styles['NormalText']))

        elements.append(Spacer(1, 8))

        # Signature section - clean PRABAGARAN format
        signature_data = [
            [
                Paragraph("<b>Tested By:</b>", self.styles['FieldValue']),
                Paragraph("_________________________", self.styles['FieldValue']),
                Paragraph("<b>Date:</b>", self.styles['FieldValue']),
                Paragraph("____________", self.styles['FieldValue'])
            ],
            [
                Paragraph("", self.styles['FieldValue']),
                Paragraph("Laboratory Technologist", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue'])
            ],
            [
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue'])
            ],
            [
                Paragraph("<b>Verified By:</b>", self.styles['FieldValue']),
                Paragraph("_________________________", self.styles['FieldValue']),
                Paragraph("<b>Date:</b>", self.styles['FieldValue']),
                Paragraph("____________", self.styles['FieldValue'])
            ],
            [
                Paragraph("", self.styles['FieldValue']),
                Paragraph("Laboratory Director", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue'])
            ],
            [
                Paragraph("", self.styles['FieldValue']),
                Paragraph("MBBS, MD (Pathology)", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue']),
                Paragraph("", self.styles['FieldValue'])
            ]
        ]

        signature_table = Table(signature_data, colWidths=[1.2*inch, 2.8*inch, 0.8*inch, 1.2*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))

        elements.append(signature_table)
        elements.append(Spacer(1, 8))

        # Add barcode if available - positioned like PRABAGARAN
        sid_number = report_data.get('sid_number', 'N/A')
        if BARCODE_AVAILABLE and sid_number != 'N/A':
            try:
                barcode_img = self._generate_barcode(sid_number)
                if barcode_img:
                    elements.append(Paragraph(f"<b>Sample ID Barcode:</b> {sid_number}", self.styles['FieldValue']))
                    elements.append(barcode_img)
                    elements.append(Spacer(1, 4))
            except Exception as e:
                logger.warning(f"Failed to generate barcode: {str(e)}")

        # Report metadata - minimal and clean
        metadata_text = f"Report ID: {report_data.get('sid_number', 'N/A')} | Generated: {generation_time} | Version: {report_data.get('report_version', '1.0')}"
        elements.append(Paragraph(metadata_text, self.styles['SmallText']))
        elements.append(Spacer(1, 4))

        # Laboratory footer - PRABAGARAN style
        elements.append(Paragraph("AVINI LABORATORIES - Your Trusted Diagnostic Partner", self.styles['CenterAlign']))
        elements.append(Paragraph("24/7 Emergency Services | NABL Accredited | ISO 15189:2012 Certified", self.styles['SmallText']))

        return elements

    # AVINI LABS Format Methods
    def _generate_avini_labs_header(self, report_data: Dict) -> list:
        """Generate AVINI LABS format header"""
        elements = []

        # Main title
        elements.append(Paragraph("AVINI LABORATORIES", self.styles['MainTitle']))
        elements.append(Spacer(1, 6))

        # Subtitle
        elements.append(Paragraph("BILLING REPORT DETAILS", self.styles['ReportTitle']))
        elements.append(Spacer(1, 4))

        # SID Number badge-style display
        sid_number = report_data.get('sid_number', 'N/A')
        elements.append(Paragraph(f"<b>Report ID: {sid_number}</b>", self.styles['TestHeader']))
        elements.append(Spacer(1, 8))

        return elements

    def _generate_avini_labs_report_info(self, report_data: Dict) -> list:
        """Generate AVINI LABS format report information section"""
        elements = []

        # Section header
        elements.append(Paragraph("REPORT INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Report info data
        report_info_data = [
            [
                Paragraph(f"<b>SID Number:</b> {report_data.get('sid_number', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Billing Date:</b> {self._format_date(report_data.get('billing_date'))}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Generated:</b> {self._format_datetime(report_data.get('generation_timestamp'))}", self.styles['FieldValue']),
                Paragraph(f"<b>Status:</b> {report_data.get('status', 'generated')}", self.styles['FieldValue'])
            ]
        ]

        report_info_table = Table(report_info_data, colWidths=[3*inch, 3*inch])
        report_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
        ]))

        elements.append(report_info_table)
        return elements

    def _generate_avini_labs_clinic_info(self, clinic_info: Dict) -> list:
        """Generate AVINI LABS format clinic information section"""
        elements = []

        # Section header
        elements.append(Paragraph("CLINIC INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Clinic info data
        clinic_info_data = [
            [
                Paragraph(f"<b>Clinic:</b> {clinic_info.get('name', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Site Code:</b> {clinic_info.get('site_code', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Contact:</b> {clinic_info.get('phone', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Email:</b> {clinic_info.get('email', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        clinic_info_table = Table(clinic_info_data, colWidths=[3*inch, 3*inch])
        clinic_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightcyan),
        ]))

        elements.append(clinic_info_table)
        return elements

    def _generate_avini_labs_patient_info(self, patient_info: Dict, report_data: Dict) -> list:
        """Generate AVINI LABS format patient information section"""
        elements = []

        # Section header
        elements.append(Paragraph("PATIENT INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Patient info data - Row 1
        patient_info_data1 = [
            [
                Paragraph(f"<b>Name:</b> {patient_info.get('full_name', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Age/Gender:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('gender', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Patient ID:</b> {patient_info.get('patient_id', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Blood Group:</b> {patient_info.get('blood_group', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Date of Birth:</b> {self._format_date(patient_info.get('date_of_birth'))}", self.styles['FieldValue']),
                Paragraph(f"<b>Mobile:</b> {patient_info.get('mobile', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        patient_info_table1 = Table(patient_info_data1, colWidths=[3*inch, 3*inch])
        patient_info_table1.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))

        elements.append(patient_info_table1)
        elements.append(Spacer(1, 4))

        # Email row (full width)
        if patient_info.get('email'):
            email_data = [[Paragraph(f"<b>Email:</b> {patient_info.get('email', 'N/A')}", self.styles['FieldValue'])]]
            email_table = Table(email_data, colWidths=[6*inch])
            email_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ]))
            elements.append(email_table)

        return elements

    def _generate_avini_labs_billing_info(self, report_data: Dict) -> list:
        """Generate AVINI LABS format billing information section"""
        elements = []

        # Section header
        elements.append(Paragraph("BILLING INFORMATION", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Billing info data
        billing_info_data = [
            [
                Paragraph(f"<b>Invoice Number:</b> {report_data.get('invoice_number', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Status:</b> {report_data.get('payment_status', 'Pending')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Referring Doctor:</b> {report_data.get('referring_doctor', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Method:</b> {report_data.get('payment_method', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        billing_info_table = Table(billing_info_data, colWidths=[3*inch, 3*inch])
        billing_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))

        elements.append(billing_info_table)
        return elements

    def _generate_avini_labs_test_details(self, test_items: list) -> list:
        """Generate AVINI LABS format test details section (NO PRICING)"""
        elements = []

        # Section header
        test_count = len(test_items)
        elements.append(Paragraph(f"TEST DETAILS ({test_count} tests)", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        if not test_items:
            elements.append(Paragraph("No test details available.", self.styles['NormalText']))
            return elements

        # Generate test cards in AVINI LABS format (card-based layout, NO PRICING)
        for i, test in enumerate(test_items, 1):
            test_name = test.get('test_name', 'N/A')
            short_name = test.get('short_name', '')

            # Get enhanced test data from test_master
            test_master_data = test.get('test_master_data', {})
            department = test_master_data.get('department', test.get('department', 'GENERAL'))
            specimen = test_master_data.get('primarySpecimen', test.get('specimen', 'Serum'))
            hms_code = test_master_data.get('hmsCode', test.get('hms_code', 'N/A'))
            reference_range = test_master_data.get('referenceRange', test.get('reference_range', 'N/A'))
            instructions = test_master_data.get('instructions', test.get('instructions', 'No specific instructions'))

            # Test card header
            elements.append(Paragraph(f"<b>{i}. {test_name}</b>", self.styles['TestHeader']))
            if short_name:
                elements.append(Paragraph(f"<i>{short_name}</i>", self.styles['NormalText']))
            elements.append(Spacer(1, 4))

            # Test details in card format (NO PRICING INFORMATION)
            test_details_data = [
                [
                    Paragraph(f"<b>HMS Code:</b> {hms_code}", self.styles['FieldValue']),
                    Paragraph(f"<b>Department:</b> {department}", self.styles['FieldValue'])
                ],
                [
                    Paragraph(f"<b>Specimen:</b> {specimen}", self.styles['FieldValue']),
                    Paragraph(f"<b>Test ID:</b> {test.get('test_master_id', test.get('test_id', 'N/A'))}", self.styles['FieldValue'])
                ]
            ]

            test_details_table = Table(test_details_data, colWidths=[3*inch, 3*inch])
            test_details_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ]))

            elements.append(test_details_table)
            elements.append(Spacer(1, 4))

            # Instructions section (full width)
            if instructions and instructions != 'No specific instructions':
                instructions_data = [[Paragraph(f"<b>Instructions:</b> {instructions}", self.styles['FieldValue'])]]
                instructions_table = Table(instructions_data, colWidths=[6*inch])
                instructions_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.lightyellow),
                ]))
                elements.append(instructions_table)

            # Reference range section (full width)
            if reference_range and reference_range != 'N/A':
                ref_range_data = [[Paragraph(f"<b>Reference Range:</b> {reference_range}", self.styles['FieldValue'])]]
                ref_range_table = Table(ref_range_data, colWidths=[6*inch])
                ref_range_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.lightgreen),
                ]))
                elements.append(ref_range_table)

            # Add spacing between test cards
            if i < len(test_items):
                elements.append(Spacer(1, 8))

        return elements

    def _generate_avini_labs_metadata(self, metadata: Dict) -> list:
        """Generate AVINI LABS format report metadata section"""
        elements = []

        # Section header
        elements.append(Paragraph("REPORT METADATA", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Metadata info
        test_match_rate = metadata.get('test_match_success_rate', 0) * 100
        metadata_data = [
            [
                Paragraph(f"<b>Test Match Rate:</b> {test_match_rate:.0f}%", self.styles['FieldValue']),
                Paragraph(f"<b>Total Tests:</b> {metadata.get('total_tests', 0)}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Matched Tests:</b> {metadata.get('matched_tests_count', 0)}", self.styles['FieldValue']),
                Paragraph(f"<b>Unmatched Tests:</b> {metadata.get('unmatched_tests_count', 0)}", self.styles['FieldValue'])
            ]
        ]

        metadata_table = Table(metadata_data, colWidths=[3*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))

        elements.append(metadata_table)
        return elements

    # UI Replica Methods - Exact match to web interface
    def _generate_ui_header(self, report_data: Dict) -> list:
        """Generate header matching the modal title"""
        elements = []

        # Modal title style header
        sid_number = report_data.get('sid_number', 'N/A')
        elements.append(Paragraph("BILLING REPORT DETAILS", self.styles['MainTitle']))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"Report ID: {sid_number}", self.styles['ReportTitle']))
        elements.append(Spacer(1, 8))

        return elements

    def _generate_ui_report_and_clinic_cards(self, report_data: Dict, clinic_info: Dict) -> list:
        """Generate side-by-side Report Information and Clinic Information cards"""
        elements = []

        # Create two-column layout for the cards
        card_data = []

        # Left card - Report Information (border-left-primary)
        report_info_content = []
        report_info_content.append(Paragraph("<b>Report Information</b>", self.styles['TestHeader']))
        report_info_content.append(Spacer(1, 4))
        report_info_content.append(Paragraph(f"<b>SID Number:</b> {report_data.get('sid_number', 'N/A')}", self.styles['FieldValue']))
        report_info_content.append(Paragraph(f"<b>Billing Date:</b> {self._format_date(report_data.get('billing_date'))}", self.styles['FieldValue']))
        report_info_content.append(Paragraph(f"<b>Generated:</b> {self._format_datetime(report_data.get('generation_timestamp'))}", self.styles['FieldValue']))

        status = report_data.get('metadata', {}).get('status', 'generated')
        report_info_content.append(Paragraph(f"<b>Status:</b> {status}", self.styles['FieldValue']))

        # Right card - Clinic Information (border-left-info)
        clinic_info_content = []
        clinic_info_content.append(Paragraph("<b>Clinic Information</b>", self.styles['TestHeader']))
        clinic_info_content.append(Spacer(1, 4))
        clinic_info_content.append(Paragraph(f"<b>Clinic:</b> {clinic_info.get('name', 'N/A')}", self.styles['FieldValue']))
        clinic_info_content.append(Paragraph(f"<b>Site Code:</b> {clinic_info.get('site_code', 'N/A')}", self.styles['FieldValue']))
        clinic_info_content.append(Paragraph(f"<b>Contact:</b> {clinic_info.get('contact_phone', 'N/A')}", self.styles['FieldValue']))
        clinic_info_content.append(Paragraph(f"<b>Email:</b> {clinic_info.get('email', 'N/A')}", self.styles['FieldValue']))

        # Create table with two cards side by side
        cards_table_data = [[report_info_content, clinic_info_content]]
        cards_table = Table(cards_table_data, colWidths=[3*inch, 3*inch])
        cards_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (0, 0), 2, colors.blue),  # Left card border (primary)
            ('BOX', (1, 0), (1, 0), 2, colors.cyan),  # Right card border (info)
            ('BACKGROUND', (0, 0), (0, 0), colors.lightblue),
            ('BACKGROUND', (1, 0), (1, 0), colors.lightcyan),
        ]))

        elements.append(cards_table)
        return elements

    def _generate_ui_patient_section(self, patient_info: Dict) -> list:
        """Generate Patient Information section matching UI layout"""
        elements = []

        # Section header with icon
        elements.append(Paragraph("👤 Patient Information", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Two-column layout for patient info
        patient_data = [
            [
                Paragraph(f"<b>Name:</b> {patient_info.get('full_name', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Age/Gender:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('gender', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Patient ID:</b> {patient_info.get('patient_id', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Blood Group:</b> {patient_info.get('blood_group', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Date of Birth:</b> {self._format_date(patient_info.get('date_of_birth'))}", self.styles['FieldValue']),
                Paragraph(f"<b>Mobile:</b> {patient_info.get('mobile', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        patient_table = Table(patient_data, colWidths=[3*inch, 3*inch])
        patient_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(patient_table)

        # Email on separate line if available
        if patient_info.get('email'):
            elements.append(Spacer(1, 4))
            elements.append(Paragraph(f"<b>Email:</b> {patient_info.get('email')}", self.styles['FieldValue']))

        return elements

    def _generate_ui_billing_section(self, billing_header: Dict) -> list:
        """Generate Billing Information section matching UI layout"""
        elements = []

        # Section header with icon
        elements.append(Paragraph("💰 Billing Information", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Two-column layout for billing info
        billing_data = [
            [
                Paragraph(f"<b>Invoice Number:</b> {billing_header.get('invoice_number', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Status:</b> {billing_header.get('payment_status', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Referring Doctor:</b> {billing_header.get('referring_doctor', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Method:</b> {billing_header.get('payment_method', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        billing_table = Table(billing_data, colWidths=[3*inch, 3*inch])
        billing_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(billing_table)
        return elements

    def _generate_ui_test_details_section(self, test_items: list) -> list:
        """Generate Test Details section with card layout matching UI"""
        elements = []

        # Section header with icon and count
        test_count = len(test_items)
        elements.append(Paragraph(f"ℹ️ Test Details ({test_count} tests)", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        if not test_items:
            elements.append(Paragraph("No test details available.", self.styles['NormalText']))
            return elements

        # Generate test cards matching the TestDetailsCard component with profile grouping
        current_profile = None
        test_counter = 1

        for i, test in enumerate(test_items, 1):
            is_profile_subtest = test.get('is_profile_subtest', False)
            parent_profile_name = test.get('parent_profile_name')

            # Add profile header if this is the first sub-test of a new profile
            if is_profile_subtest and parent_profile_name != current_profile:
                current_profile = parent_profile_name
                total_subtests = test.get('total_subtests', 1)

                # Profile header card
                elements.append(Paragraph(f"📋 <b>PROFILE: {parent_profile_name.upper()}</b> ({total_subtests} tests)", self.styles['SectionHeader']))
                elements.append(Spacer(1, 6))

            # Generate test card with appropriate numbering
            if is_profile_subtest:
                subtest_index = test.get('subtest_index', 1)
                card_number = f"{subtest_index}"
            else:
                card_number = test_counter
                test_counter += 1

            elements.extend(self._generate_ui_test_card(test, card_number))

            # Add spacing between cards
            if i < len(test_items):
                elements.append(Spacer(1, 8))

        return elements

    def _generate_ui_test_card(self, test: Dict, index: int) -> list:
        """Generate individual test card matching TestDetailsCard component"""
        elements = []

        # Test card header (matching Card.Header)
        test_name = test.get('test_name', 'N/A')
        short_name = test.get('short_name', '')
        test_id = test.get('test_master_id') or test.get('test_id', 'N/A')
        is_profile_subtest = test.get('is_profile_subtest', False)
        parent_profile_name = test.get('parent_profile_name')

        # Card header with test name and ID badge
        if is_profile_subtest:
            subtest_index = test.get('subtest_index', 1)
            total_subtests = test.get('total_subtests', 1)
            header_data = [[
                Paragraph(f"  ➤ <b>{test_name}</b> ({subtest_index}/{total_subtests})", self.styles['TestHeader']),
                Paragraph(f"<b>#{test_id}</b>", self.styles['RightAlign'])
            ]]
            if parent_profile_name:
                header_data.append([
                    Paragraph(f"<i>Part of {parent_profile_name}</i>", self.styles['NormalText']),
                    ""
                ])
        else:
            header_data = [[
                Paragraph(f"🧪 <b>{test_name}</b>", self.styles['TestHeader']),
                Paragraph(f"<b>#{test_id}</b>", self.styles['RightAlign'])
            ]]

        if short_name:
            header_data.append([
                Paragraph(f"<i>{short_name}</i>", self.styles['NormalText']),
                ""
            ])

        header_table = Table(header_data, colWidths=[4.5*inch, 1.5*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ]))

        elements.append(header_table)

        # Test card body (matching Card.Body)
        elements.extend(self._generate_ui_test_card_body(test))

        # Test card footer with financial information (matching Card.Footer)
        elements.extend(self._generate_ui_test_card_footer(test))

        return elements

    def _generate_ui_test_card_body(self, test: Dict) -> list:
        """Generate test card body matching TestDetailsCard body layout"""
        elements = []

        # Get test data
        test_master_data = test.get('test_master_data', {})
        hms_code = test_master_data.get('hmsCode', test.get('hms_code', 'N/A'))
        department = test_master_data.get('department', test.get('department', 'GENERAL'))
        instructions = test_master_data.get('instructions', test.get('instructions', 'No specific instructions'))
        reference_range = test_master_data.get('referenceRange', test.get('reference_range', 'N/A'))
        specimen = test_master_data.get('primarySpecimen', test.get('specimen', 'Serum'))

        # Card body content
        body_data = [
            [
                Paragraph(f"💻 <b>HMS Code:</b> {hms_code}", self.styles['FieldValue']),
                Paragraph(f"🏢 <b>Department:</b> {department}", self.styles['FieldValue'])
            ]
        ]

        # Instructions (full width)
        if instructions and instructions != 'No specific instructions':
            body_data.append([
                Paragraph(f"📋 <b>Instructions:</b>", self.styles['FieldValue']),
                ""
            ])
            body_data.append([
                Paragraph(f"{instructions}", self.styles['NormalText']),
                ""
            ])

        # Reference Range and Specimen
        body_data.append([
            Paragraph(f"📏 <b>Reference Range:</b> {reference_range}", self.styles['FieldValue']),
            Paragraph(f"💧 <b>Specimen:</b> {specimen}", self.styles['FieldValue'])
        ])

        body_table = Table(body_data, colWidths=[3*inch, 3*inch])
        body_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ]))

        elements.append(body_table)
        return elements

    def _generate_ui_test_card_footer(self, test: Dict) -> list:
        """Generate test card footer with financial information matching UI"""
        elements = []

        # Financial information (Price, Qty, Amount)
        price = test.get('price', 0)
        quantity = test.get('quantity', 1)
        amount = price * quantity

        # Format currency
        def format_currency(value):
            return f"₹{value:,.2f}"

        footer_data = [[
            Paragraph(f"<b>Price</b><br/>{format_currency(price)}", self.styles['CenterAlign']),
            Paragraph(f"<b>Qty</b><br/>{quantity}", self.styles['CenterAlign']),
            Paragraph(f"<b>Amount</b><br/>{format_currency(amount)}", self.styles['CenterAlign'])
        ]]

        footer_table = Table(footer_data, colWidths=[2*inch, 2*inch, 2*inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        elements.append(footer_table)
        return elements

    def _generate_ui_unmatched_tests_section(self, unmatched_tests: list) -> list:
        """Generate unmatched tests warning section matching UI"""
        elements = []

        # Warning header
        elements.append(Paragraph(f"⚠️ Unmatched Tests ({len(unmatched_tests)})", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # List unmatched tests
        for test in unmatched_tests:
            elements.append(Paragraph(f"• {test}", self.styles['NormalText']))

        return elements

    def _generate_ui_financial_summary_section(self, financial_summary: Dict) -> list:
        """Generate Financial Summary section matching UI layout"""
        elements = []

        # Section header with icon
        elements.append(Paragraph("✅ Financial Summary", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Format currency
        def format_currency(value):
            return f"₹{value:,.2f}"

        # Two-column layout for financial summary
        financial_data = [
            [
                Paragraph(f"<b>Bill Amount:</b> {format_currency(financial_summary.get('bill_amount', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>GST ({financial_summary.get('gst_rate', 0)}%):</b> {format_currency(financial_summary.get('gst_amount', 0))}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Other Charges:</b> {format_currency(financial_summary.get('other_charges', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Total Amount:</b> <font color='green'><b>{format_currency(financial_summary.get('total_amount', 0))}</b></font>", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Discount ({financial_summary.get('discount_percent', 0)}%):</b> {format_currency(financial_summary.get('discount_amount', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Paid Amount:</b> {format_currency(financial_summary.get('paid_amount', 0))}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Subtotal:</b> {format_currency(financial_summary.get('subtotal', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Balance:</b> <font color='red'><b>{format_currency(financial_summary.get('balance', 0))}</b></font>", self.styles['FieldValue'])
            ]
        ]

        financial_table = Table(financial_data, colWidths=[3*inch, 3*inch])
        financial_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(financial_table)
        return elements

    def _generate_ui_metadata_section(self, metadata: Dict) -> list:
        """Generate Report Metadata section matching UI layout"""
        elements = []

        # Section header
        elements.append(Paragraph("Report Metadata", self.styles['SectionHeader']))
        elements.append(Spacer(1, 4))

        # Two-column layout for metadata
        test_match_rate = metadata.get('test_match_success_rate', 0) * 100
        metadata_data = [
            [
                Paragraph(f"<b>Test Match Rate:</b> <font color='green'>{test_match_rate:.0f}%</font>", self.styles['FieldValue']),
                Paragraph(f"<b>Matched Tests:</b> {metadata.get('matched_tests_count', 0)}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Total Tests:</b> {metadata.get('total_tests', 0)}", self.styles['FieldValue']),
                Paragraph(f"<b>Unmatched Tests:</b> {metadata.get('unmatched_tests_count', 0)}", self.styles['FieldValue'])
            ]
        ]

        metadata_table = Table(metadata_data, colWidths=[3*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        elements.append(metadata_table)
        return elements

    # EXACT UI REPLICA METHODS - Precise color matching
    def _generate_exact_ui_header(self, report_data: Dict) -> list:
        """Generate exact header matching modal title"""
        elements = []

        # Modal title with exact styling
        sid_number = report_data.get('sid_number', 'N/A')
        elements.append(Paragraph("💰 Billing Report Details", self.styles['MainTitle']))
        elements.append(Spacer(1, 6))

        # SID badge with primary color
        elements.append(Paragraph(f"<font color='#4e73df'><b>{sid_number}</b></font>", self.styles['ReportTitle']))

        return elements

    def _generate_exact_ui_cards(self, report_data: Dict, clinic_info: Dict) -> list:
        """Generate exact side-by-side cards with precise colors"""
        elements = []

        # Define exact colors from CSS
        primary_color = colors.Color(78/255, 115/255, 223/255)  # #4e73df
        info_color = colors.Color(54/255, 185/255, 204/255)     # #36b9cc
        light_blue = colors.Color(248/255, 249/255, 252/255)    # #f8f9fc
        light_cyan = colors.Color(224/255, 247/255, 250/255)    # #e0f7fa

        # Left card content - Report Information
        left_content = []
        left_content.append(Paragraph("<font color='#4e73df'><b>Report Information</b></font>", self.styles['TestHeader']))
        left_content.append(Spacer(1, 6))
        left_content.append(Paragraph(f"<b>SID Number:</b> {report_data.get('sid_number', 'N/A')}", self.styles['FieldValue']))
        left_content.append(Paragraph(f"<b>Billing Date:</b> {self._format_date(report_data.get('billing_date'))}", self.styles['FieldValue']))
        left_content.append(Paragraph(f"<b>Generated:</b> {self._format_datetime(report_data.get('generation_timestamp'))}", self.styles['FieldValue']))

        status = report_data.get('metadata', {}).get('status', 'generated')
        left_content.append(Paragraph(f"<b>Status:</b> <font color='#1cc88a'>{status}</font>", self.styles['FieldValue']))

        # Right card content - Clinic Information
        right_content = []
        right_content.append(Paragraph("<font color='#36b9cc'><b>Clinic Information</b></font>", self.styles['TestHeader']))
        right_content.append(Spacer(1, 6))
        right_content.append(Paragraph(f"<b>Clinic:</b> {clinic_info.get('name', 'N/A')}", self.styles['FieldValue']))
        right_content.append(Paragraph(f"<b>Site Code:</b> {clinic_info.get('site_code', 'N/A')}", self.styles['FieldValue']))
        right_content.append(Paragraph(f"<b>Contact:</b> {clinic_info.get('contact_phone', 'N/A')}", self.styles['FieldValue']))
        right_content.append(Paragraph(f"<b>Email:</b> {clinic_info.get('email', 'N/A')}", self.styles['FieldValue']))

        # Create table with exact card styling
        cards_data = [[left_content, right_content]]
        cards_table = Table(cards_data, colWidths=[3*inch, 3*inch])
        cards_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            # Left card - primary border (4px left border)
            ('LINEBELOW', (0, 0), (0, 0), 4, primary_color),
            ('LINEBEFORE', (0, 0), (0, 0), 4, primary_color),
            ('LINEAFTER', (0, 0), (0, 0), 1, colors.lightgrey),
            ('LINEABOVE', (0, 0), (0, 0), 1, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, 0), light_blue),
            # Right card - info border (4px left border)
            ('LINEBELOW', (1, 0), (1, 0), 4, info_color),
            ('LINEBEFORE', (1, 0), (1, 0), 4, info_color),
            ('LINEAFTER', (1, 0), (1, 0), 1, colors.lightgrey),
            ('LINEABOVE', (1, 0), (1, 0), 1, colors.lightgrey),
            ('BACKGROUND', (1, 0), (1, 0), light_cyan),
        ]))

        elements.append(cards_table)
        return elements

    def _generate_exact_patient_section(self, patient_info: Dict) -> list:
        """Generate exact Patient Information section"""
        elements = []

        # Section header with exact icon and color
        elements.append(Paragraph("<font color='#4e73df'>👤 Patient Information</font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        # Two-column layout exactly like UI
        patient_data = [
            [
                Paragraph(f"<b>Name:</b> {patient_info.get('full_name', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Age/Gender:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('gender', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Patient ID:</b> {patient_info.get('patient_id', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Blood Group:</b> {patient_info.get('blood_group', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Date of Birth:</b> {self._format_date(patient_info.get('date_of_birth'))}", self.styles['FieldValue']),
                Paragraph(f"<b>Mobile:</b> {patient_info.get('mobile', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        patient_table = Table(patient_data, colWidths=[3*inch, 3*inch])
        patient_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(patient_table)

        # Email on separate line if available (exactly like UI)
        if patient_info.get('email'):
            elements.append(Spacer(1, 6))
            elements.append(Paragraph(f"<b>Email:</b> {patient_info.get('email')}", self.styles['FieldValue']))

        return elements

    def _generate_exact_billing_section(self, billing_header: Dict) -> list:
        """Generate exact Billing Information section"""
        elements = []

        # Section header with exact icon and color
        elements.append(Paragraph("<font color='#4e73df'>💰 Billing Information</font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        # Two-column layout exactly like UI
        billing_data = [
            [
                Paragraph(f"<b>Invoice Number:</b> {billing_header.get('invoice_number', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Status:</b> {billing_header.get('payment_status', 'N/A')}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Referring Doctor:</b> {billing_header.get('referring_doctor', 'N/A')}", self.styles['FieldValue']),
                Paragraph(f"<b>Payment Method:</b> {billing_header.get('payment_method', 'N/A')}", self.styles['FieldValue'])
            ]
        ]

        billing_table = Table(billing_data, colWidths=[3*inch, 3*inch])
        billing_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(billing_table)
        return elements

    def _generate_exact_test_cards_section(self, test_items: list) -> list:
        """Generate exact Test Details section with card styling"""
        elements = []

        # Section header with exact icon and color
        test_count = len(test_items)
        elements.append(Paragraph(f"<font color='#4e73df'>ℹ️ Test Details ({test_count} tests)</font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        if not test_items:
            elements.append(Paragraph("No test details available.", self.styles['NormalText']))
            return elements

        # Generate test cards with exact styling
        for i, test in enumerate(test_items, 1):
            elements.extend(self._generate_exact_test_card(test, i))

            # Add spacing between cards
            if i < len(test_items):
                elements.append(Spacer(1, 12))

        return elements

    def _generate_exact_test_card(self, test: Dict, index: int) -> list:
        """Generate exact test card matching TestDetailsCard component"""
        elements = []

        # Test card header with exact styling
        test_name = test.get('test_name', 'N/A')
        short_name = test.get('short_name', '')
        test_id = test.get('test_master_data', {}).get('id') or test.get('test_master_id') or test.get('id', 'N/A')

        # Card header with primary background
        header_content = []
        header_content.append(Paragraph(f"🧪 <b>{test_name}</b>", self.styles['TestHeader']))
        if short_name:
            header_content.append(Paragraph(f"<i>{short_name}</i>", self.styles['NormalText']))

        # Test ID badge
        badge_content = Paragraph(f"<font color='white'><b>#{test_id}</b></font>", self.styles['RightAlign'])

        header_data = [[header_content, badge_content]]
        header_table = Table(header_data, colWidths=[4.5*inch, 1.5*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.Color(248/255, 249/255, 252/255)),  # #f8f9fc
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (1, 0), (1, -1), colors.Color(78/255, 115/255, 223/255)),  # Primary badge
        ]))

        elements.append(header_table)

        # Test card body with exact layout
        elements.extend(self._generate_exact_test_card_body(test))

        # Test card footer with exact financial styling
        elements.extend(self._generate_exact_test_card_footer(test))

        return elements

    def _generate_exact_test_card_body(self, test: Dict) -> list:
        """Generate exact test card body with precise styling"""
        elements = []

        # Get test data
        test_master_data = test.get('test_master_data', {})
        hms_code = test_master_data.get('hmsCode', test.get('hms_code', 'N/A'))
        department = test_master_data.get('department', test.get('department', 'GENERAL'))
        instructions = test_master_data.get('instructions', test.get('instructions', ''))
        reference_range = test_master_data.get('referenceRange', test.get('reference_range', 'N/A'))
        specimen = test_master_data.get('primarySpecimen', test.get('specimen', 'Serum'))

        # Card body with exact two-column layout
        body_data = [
            [
                Paragraph(f"💻 <font color='#36b9cc'><b>HMS Code</b></font><br/><code style='background:#f8f9fc; padding:2px 4px; border-radius:3px'>{hms_code}</code>", self.styles['FieldValue']),
                Paragraph(f"🏢 <font color='#858796'><b>Department</b></font><br/><font color='white' style='background:#858796; padding:2px 6px; border-radius:3px'>{department}</font>", self.styles['FieldValue'])
            ]
        ]

        # Instructions section (full width) if available
        if instructions and instructions.strip():
            body_data.append([
                Paragraph(f"📋 <font color='#f6c23e'><b>Instructions</b></font>", self.styles['FieldValue']),
                ""
            ])
            body_data.append([
                Paragraph(f"<font style='background:#f8f9fc; padding:8px; border-radius:4px'>{instructions}</font>", self.styles['NormalText']),
                ""
            ])

        # Reference Range and Specimen
        body_data.append([
            Paragraph(f"📏 <font color='#1cc88a'><b>Reference Range</b></font><br/><font color='#1cc88a'>{reference_range}</font>", self.styles['FieldValue']),
            Paragraph(f"💧 <font color='#36b9cc'><b>Specimen</b></font><br/>{specimen}", self.styles['FieldValue'])
        ])

        body_table = Table(body_data, colWidths=[3*inch, 3*inch])
        body_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))

        elements.append(body_table)
        return elements

    def _generate_exact_test_card_footer(self, test: Dict) -> list:
        """Generate exact test card footer with financial information"""
        elements = []

        # Financial information with exact styling
        price = test.get('price', 0)
        quantity = test.get('quantity', 1)
        amount = price * quantity

        # Format currency exactly like UI
        def format_currency(value):
            return f"₹{value:,.2f}"

        # Footer with exact three-column layout and colors
        footer_data = [[
            Paragraph(f"<b>Price</b><br/><font color='#4e73df'><b>{format_currency(price)}</b></font>", self.styles['CenterAlign']),
            Paragraph(f"<b>Qty</b><br/><b>{quantity}</b>", self.styles['CenterAlign']),
            Paragraph(f"<b>Amount</b><br/><font color='#1cc88a'><b>{format_currency(amount)}</b></font>", self.styles['CenterAlign'])
        ]]

        footer_table = Table(footer_data, colWidths=[2*inch, 2*inch, 2*inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.Color(248/255, 249/255, 252/255)),  # bg-light
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))

        elements.append(footer_table)
        return elements

    def _generate_exact_unmatched_section(self, unmatched_tests: list) -> list:
        """Generate exact unmatched tests warning section"""
        elements = []

        # Warning header with exact styling
        elements.append(Paragraph(f"⚠️ <font color='#f6c23e'><b>Unmatched Tests ({len(unmatched_tests)})</b></font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        # List unmatched tests
        for test in unmatched_tests:
            elements.append(Paragraph(f"• {test}", self.styles['NormalText']))

        return elements

    def _generate_exact_financial_section(self, financial_summary: Dict) -> list:
        """Generate exact Financial Summary section"""
        elements = []

        # Section header with exact icon and color
        elements.append(Paragraph("<font color='#4e73df'>✅ Financial Summary</font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        # Format currency exactly like UI
        def format_currency(value):
            return f"₹{value:,.2f}"

        # Two-column layout with exact styling
        financial_data = [
            [
                Paragraph(f"<b>Bill Amount:</b> {format_currency(financial_summary.get('bill_amount', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>GST ({financial_summary.get('gst_rate', 0)}%):</b> {format_currency(financial_summary.get('gst_amount', 0))}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Other Charges:</b> {format_currency(financial_summary.get('other_charges', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Total Amount:</b> <font color='#1cc88a'><b>{format_currency(financial_summary.get('total_amount', 0))}</b></font>", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Discount ({financial_summary.get('discount_percent', 0)}%):</b> {format_currency(financial_summary.get('discount_amount', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Paid Amount:</b> {format_currency(financial_summary.get('paid_amount', 0))}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Subtotal:</b> {format_currency(financial_summary.get('subtotal', 0))}", self.styles['FieldValue']),
                Paragraph(f"<b>Balance:</b> <font color='#e74a3b'><b>{format_currency(financial_summary.get('balance', 0))}</b></font>", self.styles['FieldValue'])
            ]
        ]

        financial_table = Table(financial_data, colWidths=[3*inch, 3*inch])
        financial_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(financial_table)
        return elements

    def _generate_exact_metadata_section(self, metadata: Dict) -> list:
        """Generate exact Report Metadata section"""
        elements = []

        # Section header with exact color
        elements.append(Paragraph("<font color='#4e73df'>Report Metadata</font>", self.styles['SectionHeader']))
        elements.append(Spacer(1, 8))

        # Two-column layout with exact styling
        test_match_rate = metadata.get('test_match_success_rate', 0) * 100

        # Color based on match rate (exact logic from UI)
        if test_match_rate >= 80:
            rate_color = '#1cc88a'  # success
        elif test_match_rate >= 50:
            rate_color = '#f6c23e'  # warning
        else:
            rate_color = '#e74a3b'  # danger

        metadata_data = [
            [
                Paragraph(f"<b>Test Match Rate:</b> <font color='{rate_color}'><b>{test_match_rate:.0f}%</b></font>", self.styles['FieldValue']),
                Paragraph(f"<b>Matched Tests:</b> {metadata.get('matched_tests_count', 0)}", self.styles['FieldValue'])
            ],
            [
                Paragraph(f"<b>Total Tests:</b> {metadata.get('total_tests', 0)}", self.styles['FieldValue']),
                Paragraph(f"<b>Unmatched Tests:</b> {metadata.get('unmatched_tests_count', 0)}", self.styles['FieldValue'])
            ]
        ]

        metadata_table = Table(metadata_data, colWidths=[3*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(metadata_table)
        return elements

    def _generate_avini_labs_footer(self, report_data: Dict) -> list:
        """Generate AVINI LABS format footer section"""
        elements = []

        # Add spacing before footer
        elements.append(Spacer(1, 12))

        # Add barcode if available
        sid_number = report_data.get('sid_number', 'N/A')
        if BARCODE_AVAILABLE and sid_number != 'N/A':
            try:
                barcode_img = self._generate_barcode(sid_number)
                if barcode_img:
                    elements.append(Paragraph(f"<b>Sample ID Barcode:</b> {sid_number}", self.styles['FieldValue']))
                    elements.append(barcode_img)
                    elements.append(Spacer(1, 4))
            except Exception as e:
                logger.warning(f"Failed to generate barcode: {str(e)}")

        # Report generation info
        generation_time = datetime.now().strftime('%d/%m/%Y at %H:%M:%S')
        metadata_text = f"Report ID: {report_data.get('sid_number', 'N/A')} | Generated: {generation_time} | Version: {report_data.get('report_version', '1.0')}"
        elements.append(Paragraph(metadata_text, self.styles['SmallText']))
        elements.append(Spacer(1, 4))

        # Laboratory footer
        elements.append(Paragraph("AVINI LABORATORIES - Your Trusted Diagnostic Partner", self.styles['CenterAlign']))
        elements.append(Paragraph("Professional Billing Report | NABL Accredited | ISO 15189:2012 Certified", self.styles['SmallText']))

        return elements

    def _format_date(self, date_str):
        """Format date string for display"""
        if not date_str:
            return 'N/A'
        try:
            if isinstance(date_str, str):
                # Try to parse the date string
                from datetime import datetime
                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return date_obj.strftime('%d %b %Y')
            return str(date_str)
        except:
            return str(date_str) if date_str else 'N/A'

    def _format_datetime(self, datetime_str):
        """Format datetime string for display"""
        if not datetime_str:
            return 'N/A'
        try:
            if isinstance(datetime_str, str):
                # Try to parse the datetime string
                from datetime import datetime
                datetime_obj = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                return datetime_obj.strftime('%d %b %Y, %I:%M %p')
            return str(datetime_str)
        except:
            return str(datetime_str) if datetime_str else 'N/A'

    def _generate_error_pdf(self, error_message: str) -> bytes:
        """Generate error PDF content"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []

            # Error header
            story.append(Paragraph("AVINI LABS MANAGEMENT SYSTEM", self.styles['MainTitle']))
            story.append(Paragraph("ERROR REPORT", self.styles['ReportTitle']))
            story.append(Spacer(1, 24))

            # Error message
            story.append(Paragraph("An error occurred while generating the medical report:", self.styles['NormalText']))
            story.append(Spacer(1, 12))
            story.append(Paragraph(f"Error: {error_message}", self.styles['NormalText']))
            story.append(Spacer(1, 12))
            story.append(Paragraph("Please contact technical support for assistance.", self.styles['NormalText']))
            story.append(Spacer(1, 12))
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", self.styles['NormalText']))

            doc.build(story)
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()

            return pdf_content
        except Exception as e:
            # If even error PDF generation fails, return a simple text response
            logger.error(f"Failed to generate error PDF: {str(e)}")
            return b"PDF generation failed. Please contact technical support."

    def _generate_barcode(self, sid_number: str) -> Optional[Image]:
        """Generate barcode image for the report"""
        if not BARCODE_AVAILABLE:
            return None

        try:
            # Generate Code128 barcode
            code = Code128(sid_number, writer=ImageWriter())
            buffer = BytesIO()
            code.write(buffer)
            buffer.seek(0)

            # Create ReportLab Image
            barcode_img = Image(buffer, width=3*inch, height=0.5*inch)
            return barcode_img

        except Exception as e:
            logger.error(f"Error generating barcode: {str(e)}")
            return None

    def _generate_qr_code(self, data: str) -> Optional[Image]:
        """Generate QR code image for the report"""
        if not QR_CODE_AVAILABLE:
            return None

        try:
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)

            # Create QR code image
            qr_img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            qr_img.save(buffer, format='PNG')
            buffer.seek(0)

            # Create ReportLab Image
            qr_code_img = Image(buffer, width=1*inch, height=1*inch)
            return qr_code_img

        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return None

    def generate_barcode_placeholder(self, sid_number: str) -> str:
        """Generate barcode placeholder (fallback when barcode library not available)"""
        return f"[BARCODE: {sid_number}]"

    def generate_qr_code_placeholder(self, data: str) -> str:
        """Generate QR code placeholder (fallback when QR library not available)"""
        return f"[QR CODE: {data}]"

    def generate_prabagaran_format_pdf(self, report_data: Dict) -> bytes:
        """
        Generate PDF that EXACTLY replicates the PRABAGARAN.pdf format
        This follows the exact layout, styling, and structure from the reference PDF
        Returns: PDF content as bytes
        """
        try:
            # Create a BytesIO buffer to hold the PDF
            buffer = BytesIO()

            # Create the PDF document with A4 format
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=36,  # 36 points = ~1cm margin like PRABAGARAN
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )

            # Build the PDF content
            story = []

            # Extract data from report
            patient_info = report_data.get('patient_info', {})
            clinic_info = report_data.get('clinic_info', {})
            test_items = report_data.get('test_items', [])
            billing_header = report_data.get('billing_header', {})
            financial_summary = report_data.get('financial_summary', {})
            metadata = report_data.get('metadata', {})

            # Transform data to PRABAGARAN format structure
            prabagaran_data = self._transform_to_prabagaran_format(report_data)

            # Generate PDF using the ChatGPT code structure
            self._generate_prabagaran_lab_report(prabagaran_data, story)

            # Build the PDF
            doc.build(story)

            # Get the PDF content
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()

            return pdf_content

        except Exception as e:
            logger.error(f"Error generating PRABAGARAN format PDF: {str(e)}")
            return self._generate_error_pdf(str(e))

    def _transform_to_prabagaran_format(self, report_data: Dict) -> Dict:
        """Transform billing report data to PRABAGARAN format structure"""
        patient_info = report_data.get('patient_info', {})
        clinic_info = report_data.get('clinic_info', {})
        test_items = report_data.get('test_items', [])

        # Calculate age if not provided
        age = patient_info.get('age', 'N/A')
        if age == 'N/A' and patient_info.get('date_of_birth'):
            try:
                birth_date = datetime.strptime(patient_info.get('date_of_birth'), '%Y-%m-%d')
                today = datetime.now()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1
                age = f"{age} Y"
            except:
                age = 'N/A'

        # Format dates
        collection_date = self._format_prabagaran_datetime(report_data.get('billing_date'))
        report_date = self._format_prabagaran_datetime(datetime.now().isoformat())

        # Transform to PRABAGARAN structure
        prabagaran_data = {
            'header': {
                'patient': {
                    'Patient': patient_info.get('full_name', 'N/A'),
                    'SID No.': report_data.get('sid_number', 'N/A'),
                    'Age / Sex': f"{age} / {patient_info.get('gender', 'N/A')}",
                    'Reg Date & Time': collection_date
                },
                'report': {
                    'Branch': clinic_info.get('name', 'MAYILADUTHURAI'),
                    'Coll Date & Time': collection_date,
                    'Report Date & Time': report_date
                }
            },
            'sections': self._transform_tests_to_sections(test_items),
            'notes': self._generate_prabagaran_notes(test_items),
            'signatures': ['Dr. S.Asokkumar, PhD., Verified By', 'Jothi Lakshmi, Lab Technician']
        }

        return prabagaran_data

    def _format_prabagaran_datetime(self, datetime_str):
        """Format datetime for PRABAGARAN format: DD/MM/YYYY HH:MM:SS"""
        if not datetime_str:
            return datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        try:
            if isinstance(datetime_str, str):
                # Try to parse the datetime string
                datetime_obj = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                return datetime_obj.strftime('%d/%m/%Y %H:%M:%S')
            return datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        except:
            return datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    def _transform_tests_to_sections(self, test_items: list) -> list:
        """Transform test items to PRABAGARAN sections format"""
        sections = []

        # Group tests by department
        departments = {}
        for test in test_items:
            test_master_data = test.get('test_master_data', {})
            department = test_master_data.get('department', 'BIOCHEMISTRY')

            if department not in departments:
                departments[department] = []

            # Transform test data to PRABAGARAN format
            test_row = {
                'INVESTIGATION / METHOD': test.get('test_name', 'N/A'),
                'RESULT': test.get('result_value', 'Pending'),
                'UNITS': test_master_data.get('unit', test.get('result_unit', '')),
                'BIOLOGICAL REFERENCE INTERVAL': test_master_data.get('referenceRange', test.get('reference_range', ''))
            }
            departments[department].append(test_row)

        # Create sections for each department
        for dept_name, tests in departments.items():
            section = {
                'name': dept_name.upper(),
                'columns': ['INVESTIGATION / METHOD', 'RESULT', 'UNITS', 'BIOLOGICAL REFERENCE INTERVAL'],
                'rows': tests,
                'colWidths': [180, 60, 60, 180]  # Column widths like PRABAGARAN
            }
            sections.append(section)

        return sections

    def _generate_prabagaran_notes(self, test_items: list) -> list:
        """Generate clinical notes for PRABAGARAN format"""
        notes = []

        # Add standard clinical notes based on test types
        has_hba1c = any('hba1c' in test.get('test_name', '').lower() for test in test_items)
        has_vitamin_d = any('vitamin d' in test.get('test_name', '').lower() for test in test_items)

        if has_hba1c:
            notes.append('Notes : HbA1c level reflects the mean glucose concentration over the previous period of 8-12 weeks and is used for monitoring glycemic control in diabetic patients.')

        if has_vitamin_d:
            notes.append('Notes : Vitamin D is a fat-soluble steroid hormone precursor that regulates calcium homeostasis and bone metabolism. Deficiency may lead to bone disorders.')

        if not notes:
            notes.append('Notes : Results should be interpreted in conjunction with clinical findings and patient history.')

        return notes

    def _load_signature_image(self) -> Optional[Image]:
        """Load signature image from public folder"""
        try:
            # Get the path to the signature image in the public folder
            # Assuming the backend is running from the root directory
            signature_path = os.path.join('public', 'signature.jpeg')

            if os.path.exists(signature_path):
                # Create ReportLab Image with appropriate size
                signature_img = Image(signature_path, width=2*inch, height=0.75*inch)
                return signature_img
            else:
                logger.warning(f"Signature image not found at: {signature_path}")
                return None
        except Exception as e:
            logger.error(f"Error loading signature image: {str(e)}")
            return None

    def _generate_prabagaran_lab_report(self, data: Dict, story: list):
        """Generate lab report using the ChatGPT PRABAGARAN structure"""
        styles = getSampleStyleSheet()
        normal = styles['Normal']
        header_style = ParagraphStyle('header', parent=styles['Heading2'], alignment=1, fontSize=14)
        subheader_style = ParagraphStyle('subheader', parent=styles['Heading3'], fontSize=10)

        # Header block
        header_data = []
        hdr = data['header']
        # two columns: patient info and report metadata
        left = []
        for k, v in hdr['patient'].items():
            left.append(Paragraph(f"<b>{k} :</b> {v}", normal))
        right = []
        for k, v in hdr['report'].items():
            right.append(Paragraph(f"<b>{k} :</b> {v}", normal))
        header_data.append([left, right])
        t = Table(header_data, colWidths=[270, 270])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # Title
        story.append(Paragraph("INVESTIGATION REPORT", header_style))
        story.append(Spacer(1, 12))

        # For each section, add section header and table
        for section in data['sections']:
            # Section title
            story.append(Paragraph(section['name'], subheader_style))
            story.append(Spacer(1, 6))

            # Table header
            tbl_data = [[Paragraph('<b>' + c + '</b>', normal) for c in section['columns']]]
            # Table rows
            for row in section['rows']:
                tbl_data.append([Paragraph(str(row[c]), normal) for c in section['columns']])

            tbl = Table(tbl_data, colWidths=section.get('colWidths', [80]*len(section['columns'])))
            tbl.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.black),
                ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
            ]))
            story.append(tbl)
            story.append(Spacer(1, 12))

        # Footer notes
        for note in data.get('notes', []):
            story.append(Paragraph(note, normal))
            story.append(Spacer(1, 6))

        # Signatures with image support
        try:
            # Try to load signature image
            signature_img = self._load_signature_image()
            if signature_img:
                # Create signature table with image
                sig_data = [
                    [Paragraph("Verified By", normal), signature_img, Paragraph("Authorized By", normal)]
                ]
                sig_tbl = Table(sig_data, colWidths=[135, 270, 135])
                sig_tbl.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('FONTNAME', (0,0), (0,0), 'Helvetica-Bold'),
                    ('FONTNAME', (2,0), (2,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,-1), 9)
                ]))
            else:
                # Fallback to text-based signatures
                sig_data = [[Paragraph(s, normal) for s in data.get('signatures', [])]]
                sig_tbl = Table(sig_data, colWidths=[270, 270])
                sig_tbl.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Oblique'),
                    ('FONTSIZE', (0,0), (-1,-1), 9)
                ]))
        except Exception as e:
            logger.warning(f"Failed to load signature image: {str(e)}")
            # Fallback to text-based signatures
            sig_data = [[Paragraph(s, normal) for s in data.get('signatures', [])]]
            sig_tbl = Table(sig_data, colWidths=[270, 270])
            sig_tbl.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Oblique'),
                ('FONTSIZE', (0,0), (-1,-1), 9)
            ]))

        story.append(sig_tbl)
