#!/usr/bin/env python3
"""
Extract content from PRABAGARAN.pdf to identify franchise information
"""

import sys
import os

def extract_pdf_content():
    """Extract text content from PRABAGARAN.pdf"""
    
    print("🔍 Extracting content from PRABAGARAN.pdf")
    print("=" * 50)
    
    try:
        # Try using reportlab's PDF reading capabilities
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        print("✅ ReportLab available")
        
        # Try alternative PDF reading methods
        try:
            # Method 1: Try with pdfplumber if available
            import pdfplumber
            print("✅ pdfplumber available - using for extraction")
            
            with pdfplumber.open('PRABAGARAN.pdf') as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
                
                print("📄 PDF Content Extracted:")
                print("-" * 30)
                print(text)
                
                # Look for franchise information in footer
                lines = text.split('\n')
                print("\n🔍 Looking for franchise information in footer...")
                
                # Check last 10 lines for franchise info
                footer_lines = lines[-10:]
                for i, line in enumerate(footer_lines):
                    if line.strip():
                        print(f"Footer line {i+1}: {line.strip()}")
                
                return text
                
        except ImportError:
            print("❌ pdfplumber not available")
            
        try:
            # Method 2: Try with PyPDF2 if available
            import PyPDF2
            print("✅ PyPDF2 available - using for extraction")
            
            with open('PRABAGARAN.pdf', 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                print("📄 PDF Content Extracted:")
                print("-" * 30)
                print(text)
                
                # Look for franchise information
                lines = text.split('\n')
                print("\n🔍 Looking for franchise information...")
                
                for i, line in enumerate(lines):
                    if any(keyword in line.lower() for keyword in ['branch', 'franchise', 'site', 'location', 'lab']):
                        print(f"Potential franchise info line {i+1}: {line.strip()}")
                
                return text
                
        except ImportError:
            print("❌ PyPDF2 not available")
            
        try:
            # Method 3: Try with pymupdf if available
            import fitz  # PyMuPDF
            print("✅ PyMuPDF available - using for extraction")
            
            doc = fitz.open('PRABAGARAN.pdf')
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()
            
            print("📄 PDF Content Extracted:")
            print("-" * 30)
            print(text)
            
            # Look for franchise information
            lines = text.split('\n')
            print("\n🔍 Looking for franchise information...")
            
            for i, line in enumerate(lines):
                if any(keyword in line.lower() for keyword in ['branch', 'franchise', 'site', 'location', 'lab']):
                    print(f"Potential franchise info line {i+1}: {line.strip()}")
            
            return text
            
        except ImportError:
            print("❌ PyMuPDF not available")
        
        print("❌ No PDF reading libraries available")
        print("💡 Please install one of: pdfplumber, PyPDF2, or PyMuPDF")
        return None
        
    except Exception as e:
        print(f"❌ Error extracting PDF content: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    content = extract_pdf_content()
    if content:
        print("\n🎉 PDF content extraction completed!")
        
        # Save extracted content to file for analysis
        with open('extracted_pdf_content.txt', 'w', encoding='utf-8') as f:
            f.write(content)
        print("💾 Content saved to extracted_pdf_content.txt")
    else:
        print("\n💥 PDF content extraction failed!")
        sys.exit(1)
