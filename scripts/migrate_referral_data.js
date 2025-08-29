/**
 * Referral Data Migration Script
 * Migrates existing referral data to the new enhanced structure with type-specific fields
 */

const fs = require('fs');
const path = require('path');

class ReferralDataMigrator {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.dataDir = path.join(__dirname, '../backend/data');
    
    // Mapping old categories to new referral types
    this.categoryToTypeMapping = {
      'medical': 'Doctor',
      'institutional': 'Hospital',
      'corporate': 'Corporate',
      'insurance': 'Insurance',
      'direct': 'Patient',
      'professional': 'Doctor',
      'digital': 'Patient',
      'urgent': 'Hospital'
    };

    // Default values for missing fields
    this.defaultValues = {
      email: 'contact@example.com',
      phone: '+91 9999999999',
      address: 'Address to be updated',
      typeSpecificFields: {}
    };
  }

  /**
   * Main migration function
   */
  async migrate() {
    try {
      console.log('🚀 Starting Referral Data Migration...');
      
      // Step 1: Create backup
      await this.createBackup();
      
      // Step 2: Load existing data
      const existingData = await this.loadExistingData();
      
      // Step 3: Migrate data structure
      const migratedData = await this.migrateDataStructure(existingData);
      
      // Step 4: Validate migrated data
      const validationResults = await this.validateMigratedData(migratedData);
      
      // Step 5: Save migrated data
      await this.saveMigratedData(migratedData);
      
      // Step 6: Generate migration report
      await this.generateMigrationReport(validationResults);
      
      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Create backup of existing data
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `referral_backup_${timestamp}.json`);
    
    try {
      const existingFile = path.join(this.dataDir, 'referralPricingMaster.json');
      if (fs.existsSync(existingFile)) {
        const data = fs.readFileSync(existingFile, 'utf8');
        fs.writeFileSync(backupFile, data);
        console.log(`✅ Backup created: ${backupFile}`);
      } else {
        console.log('ℹ️  No existing referral data found to backup');
      }
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Load existing referral data
   */
  async loadExistingData() {
    console.log('📖 Loading existing data...');
    
    const filePath = path.join(this.dataDir, 'referralPricingMaster.json');
    
    if (!fs.existsSync(filePath)) {
      console.log('ℹ️  No existing data found, starting with empty structure');
      return { referralMaster: {}, pricingSchemes: {}, testPricingMatrix: {} };
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ Loaded ${Object.keys(data.referralMaster || {}).length} existing referrals`);
      return data;
    } catch (error) {
      console.error('❌ Failed to load existing data:', error);
      throw error;
    }
  }

  /**
   * Migrate data structure to new format
   */
  async migrateDataStructure(existingData) {
    console.log('🔄 Migrating data structure...');
    
    const migratedData = {
      referralMaster: {},
      pricingSchemes: existingData.pricingSchemes || {},
      testPricingMatrix: existingData.testPricingMatrix || {},
      discountRules: existingData.discountRules || {},
      commissionRules: existingData.commissionRules || {},
      metadata: {
        version: '2.0',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'migration_script',
        description: 'Enhanced referral and pricing master configuration with type-specific fields',
        migrationDate: new Date().toISOString()
      }
    };

    // Migrate each referral source
    for (const [referralId, referralData] of Object.entries(existingData.referralMaster || {})) {
      try {
        const migratedReferral = await this.migrateReferralSource(referralId, referralData);
        migratedData.referralMaster[referralId] = migratedReferral;
      } catch (error) {
        console.warn(`⚠️  Failed to migrate referral ${referralId}:`, error.message);
      }
    }

    console.log(`✅ Migrated ${Object.keys(migratedData.referralMaster).length} referrals`);
    return migratedData;
  }

  /**
   * Migrate individual referral source
   */
  async migrateReferralSource(referralId, referralData) {
    // Determine referral type from category
    const referralType = this.categoryToTypeMapping[referralData.category] || 'Patient';
    
    // Create migrated referral with enhanced structure
    const migratedReferral = {
      // Existing fields
      id: referralData.id || referralId,
      name: referralData.name || 'Unnamed Referral',
      description: referralData.description || 'Description to be updated',
      category: referralData.category || 'direct',
      defaultPricingScheme: referralData.defaultPricingScheme || 'standard',
      discountPercentage: referralData.discountPercentage || 0,
      commissionPercentage: referralData.commissionPercentage || 0,
      isActive: referralData.isActive !== false,
      priority: referralData.priority || 1,
      
      // New enhanced fields
      referralType: referralType,
      email: referralData.email || this.defaultValues.email,
      phone: referralData.phone || this.defaultValues.phone,
      address: referralData.address || this.defaultValues.address,
      
      // Type-specific fields with defaults
      typeSpecificFields: this.generateTypeSpecificFields(referralType, referralData),
      
      // Metadata
      createdAt: referralData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: referralData.createdBy || 1,
      migratedAt: new Date().toISOString()
    };

    return migratedReferral;
  }

  /**
   * Generate type-specific fields based on referral type
   */
  generateTypeSpecificFields(referralType, existingData) {
    const typeSpecificFields = {};

    switch (referralType) {
      case 'Doctor':
        typeSpecificFields.specialization = existingData.specialization || 'General Medicine';
        break;
      case 'Hospital':
        typeSpecificFields.branch = existingData.branch || 'Main Branch';
        break;
      case 'Lab':
        typeSpecificFields.accreditation = existingData.accreditation || 'NABL Accredited';
        break;
      case 'Corporate':
        typeSpecificFields.registrationDetails = existingData.registrationDetails || 'Registration details to be updated';
        break;
      case 'Insurance':
        typeSpecificFields.policyCoverage = existingData.policyCoverage || 'Standard coverage details to be updated';
        break;
      case 'Patient':
        typeSpecificFields.patientReference = existingData.patientReference || '';
        break;
    }

    return typeSpecificFields;
  }

  /**
   * Validate migrated data
   */
  async validateMigratedData(migratedData) {
    console.log('🔍 Validating migrated data...');
    
    const validationResults = {
      totalReferrals: Object.keys(migratedData.referralMaster).length,
      validReferrals: 0,
      invalidReferrals: 0,
      warnings: [],
      errors: []
    };

    for (const [referralId, referralData] of Object.entries(migratedData.referralMaster)) {
      try {
        // Basic validation
        if (!referralData.name || !referralData.referralType) {
          validationResults.errors.push(`${referralId}: Missing required fields`);
          validationResults.invalidReferrals++;
          continue;
        }

        // Email validation
        if (!this.isValidEmail(referralData.email)) {
          validationResults.warnings.push(`${referralId}: Invalid email format`);
        }

        // Phone validation
        if (!this.isValidPhone(referralData.phone)) {
          validationResults.warnings.push(`${referralId}: Invalid phone format`);
        }

        validationResults.validReferrals++;
      } catch (error) {
        validationResults.errors.push(`${referralId}: Validation error - ${error.message}`);
        validationResults.invalidReferrals++;
      }
    }

    console.log(`✅ Validation complete: ${validationResults.validReferrals} valid, ${validationResults.invalidReferrals} invalid`);
    return validationResults;
  }

  /**
   * Save migrated data
   */
  async saveMigratedData(migratedData) {
    console.log('💾 Saving migrated data...');
    
    const filePath = path.join(this.dataDir, 'referralPricingMaster.json');
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(migratedData, null, 2));
      console.log('✅ Migrated data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save migrated data:', error);
      throw error;
    }
  }

  /**
   * Generate migration report
   */
  async generateMigrationReport(validationResults) {
    console.log('📊 Generating migration report...');
    
    const report = {
      migrationDate: new Date().toISOString(),
      summary: {
        totalReferrals: validationResults.totalReferrals,
        validReferrals: validationResults.validReferrals,
        invalidReferrals: validationResults.invalidReferrals,
        warningsCount: validationResults.warnings.length,
        errorsCount: validationResults.errors.length
      },
      warnings: validationResults.warnings,
      errors: validationResults.errors,
      nextSteps: [
        'Review and update default email addresses',
        'Review and update default phone numbers',
        'Review and update default addresses',
        'Update type-specific fields with accurate information',
        'Test the enhanced referral system functionality'
      ]
    };

    const reportPath = path.join(this.backupDir, `migration_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('✅ Migration report generated:', reportPath);
    console.log('\n📋 Migration Summary:');
    console.log(`   Total Referrals: ${report.summary.totalReferrals}`);
    console.log(`   Valid: ${report.summary.validReferrals}`);
    console.log(`   Invalid: ${report.summary.invalidReferrals}`);
    console.log(`   Warnings: ${report.summary.warningsCount}`);
    console.log(`   Errors: ${report.summary.errorsCount}`);
  }

  /**
   * Utility functions
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new ReferralDataMigrator();
  migrator.migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = ReferralDataMigrator;
