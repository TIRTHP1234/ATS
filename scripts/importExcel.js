const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_FILE = path.join(__dirname, '../Costaff_Master Tracker_V.1.xlsx');

function main() {
  console.log(`🚀 Starting Excel Data Importer for: ${EXCEL_FILE}`);

  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ File not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  const stats = fs.statSync(EXCEL_FILE);
  console.log(`📦 File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  console.log('⏳ Reading workbook sheet names...');
  const workbook = xlsx.readFile(EXCEL_FILE, { bookSheets: true });
  console.log('📋 Discovered Sheets:', workbook.SheetNames);

  const sheetsToProcess = [
    'Sheet1',
    'Client_Staffing Log',
    'TA_Allocation Log',
    'TA_Daily Call Log',
    'Interview Sheet',
    'Onboarding Sheet',
    'AM_TA_Dashboard',
    'Monthly Targets Achieved',
    'Do_NOT_Delete'
  ];

  console.log('\n🔍 Inspecting Row Counts per Sheet:');
  const fullWb = xlsx.readFile(EXCEL_FILE, { cellDates: true, sheetRows: 50000 });

  for (const sheetName of sheetsToProcess) {
    if (fullWb.Sheets[sheetName]) {
      const sheet = fullWb.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`  ✅ [${sheetName}]: ${data.length} total rows, ${data[0] ? data[0].length : 0} columns`);
    } else {
      console.log(`  ⚠️ [${sheetName}]: Sheet missing in workbook!`);
    }
  }

  console.log('\n🎉 Excel Data Validation Completed Successfully!');
}

main();
