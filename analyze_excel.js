const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const excelPath = path.join(__dirname, 'Test master & Result Master', 'Test Master & Result Master.xlsx');

console.log('📁 Reading Excel file:', excelPath);

try {
  // Check if file exists
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }

  // Read the workbook
  const workbook = XLSX.readFile(excelPath);
  
  console.log('\n📋 Available sheets:', workbook.SheetNames);
  
  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 SHEET ${index + 1}: "${sheetName}"`);
    console.log(`${'='.repeat(50)}`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to analyze structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      console.log('⚠️ Sheet is empty');
      return;
    }
    
    // Get headers (first row)
    const headers = jsonData[0];
    console.log('📝 Headers:', headers);
    console.log('📊 Total columns:', headers.length);
    console.log('📊 Total rows (including header):', jsonData.length);
    console.log('📊 Data rows:', jsonData.length - 1);
    
    // Show first few data rows as sample
    if (jsonData.length > 1) {
      console.log('\n📋 Sample data (first 3 rows):');
      for (let i = 1; i <= Math.min(4, jsonData.length - 1); i++) {
        console.log(`Row ${i}:`, jsonData[i]);
      }
      
      // Analyze data types in each column
      console.log('\n🔍 Column Analysis:');
      headers.forEach((header, colIndex) => {
        const sampleValues = [];
        for (let rowIndex = 1; rowIndex <= Math.min(10, jsonData.length - 1); rowIndex++) {
          const value = jsonData[rowIndex][colIndex];
          if (value !== undefined && value !== null && value !== '') {
            sampleValues.push(value);
          }
        }
        
        if (sampleValues.length > 0) {
          const dataTypes = [...new Set(sampleValues.map(v => typeof v))];
          console.log(`  ${header}: ${dataTypes.join(', ')} (${sampleValues.length} non-empty values)`);
          console.log(`    Sample values: ${sampleValues.slice(0, 3).join(', ')}`);
        } else {
          console.log(`  ${header}: No data`);
        }
      });
    }
  });
  
  // Generate JSON output for each sheet
  console.log('\n📤 Generating JSON files for analysis...');
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length > 0) {
      const outputPath = path.join(__dirname, `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_data.json`);
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
      console.log(`✅ Created: ${outputPath} (${jsonData.length} records)`);
    }
  });
  
  console.log('\n✅ Excel analysis complete!');
  
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  process.exit(1);
}
