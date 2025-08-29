/**
 * Referral Validation Service
 * Comprehensive validation for referral master data with type-specific rules
 */

class ReferralValidationService {
  constructor() {
    // Define referral type configurations with validation rules
    this.referralTypeConfigs = {
      'Doctor': {
        category: 'medical',
        requiredFields: ['name', 'email', 'phone', 'address', 'specialization'],
        specificFields: {
          specialization: {
            type: 'text',
            required: true,
            minLength: 3,
            maxLength: 100,
            pattern: /^[a-zA-Z\s,.()-]+$/,
            errorMessage: 'Specialization must contain only letters, spaces, commas, periods, and hyphens'
          }
        },
        businessRules: {
          maxDiscountPercentage: 15,
          maxCommissionPercentage: 12,
          defaultPricingScheme: 'standard'
        }
      },
      'Hospital': {
        category: 'institutional',
        requiredFields: ['name', 'email', 'phone', 'address', 'branch'],
        specificFields: {
          branch: {
            type: 'text',
            required: true,
            minLength: 3,
            maxLength: 150,
            pattern: /^[a-zA-Z0-9\s,./()-]+$/,
            errorMessage: 'Branch/Department must contain only letters, numbers, spaces, and common punctuation'
          }
        },
        businessRules: {
          maxDiscountPercentage: 20,
          maxCommissionPercentage: 10,
          defaultPricingScheme: 'hospital'
        }
      },
      'Lab': {
        category: 'institutional',
        requiredFields: ['name', 'email', 'phone', 'address', 'accreditation'],
        specificFields: {
          accreditation: {
            type: 'text',
            required: true,
            minLength: 3,
            maxLength: 200,
            pattern: /^[a-zA-Z0-9\s,./()-]+$/,
            errorMessage: 'Accreditation details must contain valid characters only'
          }
        },
        businessRules: {
          maxDiscountPercentage: 25,
          maxCommissionPercentage: 15,
          defaultPricingScheme: 'wholesale'
        }
      },
      'Corporate': {
        category: 'corporate',
        requiredFields: ['name', 'email', 'phone', 'address', 'registrationDetails'],
        specificFields: {
          registrationDetails: {
            type: 'text',
            required: true,
            minLength: 5,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s,./()-]+$/,
            errorMessage: 'Registration details must contain valid alphanumeric characters'
          }
        },
        businessRules: {
          maxDiscountPercentage: 30,
          maxCommissionPercentage: 8,
          defaultPricingScheme: 'corporate'
        }
      },
      'Insurance': {
        category: 'insurance',
        requiredFields: ['name', 'email', 'phone', 'address', 'policyCoverage'],
        specificFields: {
          policyCoverage: {
            type: 'text',
            required: true,
            minLength: 10,
            maxLength: 300,
            pattern: /^[a-zA-Z0-9\s,./()%$-]+$/,
            errorMessage: 'Policy coverage details must contain valid characters'
          }
        },
        businessRules: {
          maxDiscountPercentage: 18,
          maxCommissionPercentage: 6,
          defaultPricingScheme: 'insurance'
        }
      },
      'Patient': {
        category: 'direct',
        requiredFields: ['name', 'email', 'phone', 'address'],
        specificFields: {
          patientReference: {
            type: 'text',
            required: false,
            minLength: 3,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9\s-]+$/,
            errorMessage: 'Patient reference must contain only letters, numbers, spaces, and hyphens'
          }
        },
        businessRules: {
          maxDiscountPercentage: 5,
          maxCommissionPercentage: 0,
          defaultPricingScheme: 'standard'
        }
      }
    };

    // Common field validation rules
    this.commonFieldRules = {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s,.&()-]+$/,
        errorMessage: 'Name must contain only letters, numbers, spaces, and common punctuation'
      },
      email: {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter a valid email address'
      },
      phone: {
        required: true,
        pattern: /^[\+]?[0-9\s\-\(\)]{10,15}$/,
        errorMessage: 'Please enter a valid phone number (10-15 digits)'
      },
      address: {
        required: true,
        minLength: 10,
        maxLength: 500,
        errorMessage: 'Address must be between 10 and 500 characters'
      },
      id: {
        required: true,
        pattern: /^[a-z0-9_]+$/,
        minLength: 3,
        maxLength: 50,
        errorMessage: 'ID must contain only lowercase letters, numbers, and underscores'
      }
    };
  }

  /**
   * Validate complete referral data
   * @param {object} referralData - The referral data to validate
   * @returns {object} Validation result with errors and warnings
   */
  validateReferralData(referralData) {
    const errors = [];
    const warnings = [];

    try {
      // Validate referral type
      if (!referralData.referralType || !this.referralTypeConfigs[referralData.referralType]) {
        errors.push('Invalid or missing referral type');
        return { isValid: false, errors, warnings };
      }

      const typeConfig = this.referralTypeConfigs[referralData.referralType];

      // Validate common required fields
      this.validateCommonFields(referralData, errors);

      // Validate type-specific fields
      this.validateTypeSpecificFields(referralData, typeConfig, errors);

      // Validate business rules
      this.validateBusinessRules(referralData, typeConfig, errors, warnings);

      // Validate pricing configuration
      this.validatePricingConfiguration(referralData, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        typeConfig
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: ['Validation process failed: ' + error.message],
        warnings: []
      };
    }
  }

  /**
   * Validate common fields across all referral types
   * @param {object} referralData - The referral data
   * @param {array} errors - Array to collect errors
   */
  validateCommonFields(referralData, errors) {
    const commonFields = ['id', 'name', 'email', 'phone', 'address'];

    commonFields.forEach(field => {
      const rule = this.commonFieldRules[field];
      const value = referralData[field];

      if (rule.required && (!value || value.trim() === '')) {
        errors.push(`${field} is required`);
        return;
      }

      if (value) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters long`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must not exceed ${rule.maxLength} characters`);
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.errorMessage || `${field} format is invalid`);
        }
      }
    });
  }

  /**
   * Validate type-specific fields
   * @param {object} referralData - The referral data
   * @param {object} typeConfig - The type configuration
   * @param {array} errors - Array to collect errors
   */
  validateTypeSpecificFields(referralData, typeConfig, errors) {
    const typeSpecificFields = referralData.typeSpecificFields || {};

    Object.entries(typeConfig.specificFields).forEach(([fieldName, rule]) => {
      const value = typeSpecificFields[fieldName];

      if (rule.required && (!value || value.trim() === '')) {
        errors.push(`${fieldName} is required for ${referralData.referralType} referrals`);
        return;
      }

      if (value) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`);
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.errorMessage || `${fieldName} format is invalid`);
        }
      }
    });
  }

  /**
   * Validate business rules
   * @param {object} referralData - The referral data
   * @param {object} typeConfig - The type configuration
   * @param {array} errors - Array to collect errors
   * @param {array} warnings - Array to collect warnings
   */
  validateBusinessRules(referralData, typeConfig, errors, warnings) {
    const businessRules = typeConfig.businessRules;

    // Validate discount percentage
    const discountPercentage = parseFloat(referralData.discountPercentage) || 0;
    if (discountPercentage > businessRules.maxDiscountPercentage) {
      errors.push(`Discount percentage cannot exceed ${businessRules.maxDiscountPercentage}% for ${referralData.referralType} referrals`);
    }

    // Validate commission percentage
    const commissionPercentage = parseFloat(referralData.commissionPercentage) || 0;
    if (commissionPercentage > businessRules.maxCommissionPercentage) {
      errors.push(`Commission percentage cannot exceed ${businessRules.maxCommissionPercentage}% for ${referralData.referralType} referrals`);
    }

    // Warning for high discount/commission combinations
    if (discountPercentage + commissionPercentage > 25) {
      warnings.push('High combined discount and commission percentages may impact profitability');
    }

    // Validate priority
    const priority = parseInt(referralData.priority) || 1;
    if (priority < 1 || priority > 10) {
      errors.push('Priority must be between 1 and 10');
    }
  }

  /**
   * Validate pricing configuration
   * @param {object} referralData - The referral data
   * @param {array} errors - Array to collect errors
   * @param {array} warnings - Array to collect warnings
   */
  validatePricingConfiguration(referralData, errors, warnings) {
    // Validate pricing scheme
    const validSchemes = ['standard', 'hospital', 'corporate', 'insurance', 'wholesale', 'promotional', 'emergency'];
    if (referralData.defaultPricingScheme && !validSchemes.includes(referralData.defaultPricingScheme)) {
      errors.push('Invalid pricing scheme selected');
    }

    // Business logic warnings
    if (referralData.referralType === 'Patient' && referralData.commissionPercentage > 0) {
      warnings.push('Commission for patient referrals is unusual and should be reviewed');
    }

    if (referralData.referralType === 'Insurance' && referralData.discountPercentage > 20) {
      warnings.push('High discount for insurance referrals may require special approval');
    }
  }

  /**
   * Get validation rules for a specific referral type
   * @param {string} referralType - The referral type
   * @returns {object} Type configuration and rules
   */
  getTypeValidationRules(referralType) {
    return this.referralTypeConfigs[referralType] || null;
  }

  /**
   * Get all available referral types
   * @returns {array} Array of referral type names
   */
  getAvailableReferralTypes() {
    return Object.keys(this.referralTypeConfigs);
  }

  /**
   * Validate referral ID uniqueness (to be called with existing referrals)
   * @param {string} referralId - The referral ID to check
   * @param {array} existingReferrals - Array of existing referral sources
   * @returns {boolean} True if ID is unique
   */
  validateIdUniqueness(referralId, existingReferrals) {
    return !existingReferrals.some(referral => referral.id === referralId);
  }
}

// Export singleton instance
const referralValidationService = new ReferralValidationService();
export default referralValidationService;
