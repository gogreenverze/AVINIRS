import dynamicPricingConfig from '../data/dynamicPricingConfig.json';
import referralPricingMaster from '../data/referralPricingMaster.json';
import { adminAPI } from './api';

/**
 * Enhanced Dynamic Pricing Service
 * Handles test pricing based on referral source, pricing schemes, and discount rules
 */
class DynamicPricingService {
  constructor() {
    this.config = dynamicPricingConfig;
    this.referralMaster = referralPricingMaster;
    this.referralCache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get the price for a test based on referral source and scheme with enhanced pricing logic
   * @param {string} testId - The test ID
   * @param {string} referralSource - The referral source (doctor, self, hospital, etc.)
   * @param {string} scheme - Optional specific scheme to use
   * @param {number} fallbackPrice - Fallback price if no configuration found
   * @param {object} options - Additional options (volume, loyalty, etc.)
   * @returns {object} Price information with details
   */
  getTestPrice(testId, referralSource, scheme = null, fallbackPrice = 0, options = {}) {
    try {
      // First try the new comprehensive pricing system
      const comprehensiveResult = this.getComprehensiveTestPrice(testId, referralSource, scheme, options);
      if (comprehensiveResult.found) {
        return comprehensiveResult;
      }

      // Fallback to legacy pricing system
      const testConfig = this.config.testPricingMappings[testId];

      if (!testConfig) {
        return this.createPriceResult(fallbackPrice, 'fallback', 'Test not found in pricing configuration');
      }

      // Determine the scheme to use
      const selectedScheme = this.determineScheme(referralSource, scheme);

      // Try to get price using the fallback rules order
      const priceResult = this.calculatePriceWithFallback(testConfig, selectedScheme, referralSource, fallbackPrice);

      return priceResult;
    } catch (error) {
      console.error('Error calculating dynamic price:', error);
      return this.createPriceResult(fallbackPrice, 'error', error.message);
    }
  }

  /**
   * Get comprehensive test price using the new referral pricing master
   * @param {string} testId - The test ID
   * @param {string} referralSource - The referral source
   * @param {string} scheme - Optional specific scheme
   * @param {object} options - Additional options
   * @returns {object} Price result
   */
  getComprehensiveTestPrice(testId, referralSource, scheme = null, options = {}) {
    try {
      const testConfig = this.referralMaster.testPricingMatrix[testId];
      if (!testConfig) {
        return { found: false };
      }

      // Get referral configuration
      const referralConfig = this.referralMaster.referralMaster[referralSource];
      if (!referralConfig || !referralConfig.isActive) {
        return { found: false };
      }

      // Determine pricing scheme
      const selectedScheme = scheme || referralConfig.defaultPricingScheme;
      const schemeConfig = testConfig.pricingByScheme[selectedScheme];

      if (!schemeConfig) {
        return { found: false };
      }

      // Get base price
      let basePrice = schemeConfig.referralPrices[referralSource] || schemeConfig.price;

      // Apply referral discount
      const referralDiscount = referralConfig.discountPercentage || 0;
      let finalPrice = basePrice * (1 - referralDiscount / 100);

      // Apply volume discounts if applicable
      const volume = options.volume || 1;
      const volumeDiscount = this.calculateVolumeDiscount(testConfig, volume);
      finalPrice = finalPrice * (1 - volumeDiscount / 100);

      // Apply loyalty discounts if applicable
      const loyaltyTier = options.loyaltyTier;
      const loyaltyDiscount = this.calculateLoyaltyDiscount(loyaltyTier);
      finalPrice = finalPrice * (1 - loyaltyDiscount / 100);

      // Calculate total discount percentage
      const totalDiscountPercentage = referralDiscount + volumeDiscount + loyaltyDiscount;

      return this.createPriceResult(
        Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
        'comprehensive',
        `Comprehensive pricing: ${selectedScheme} scheme for ${referralSource} referral`,
        {
          scheme: selectedScheme,
          referralSource,
          basePrice,
          referralDiscount,
          volumeDiscount,
          loyaltyDiscount,
          totalDiscountPercentage,
          savings: Math.round((basePrice - finalPrice) * 100) / 100
        }
      );
    } catch (error) {
      console.error('Error in comprehensive pricing:', error);
      return { found: false };
    }
  }

  /**
   * Determine which pricing scheme to use
   * @param {string} referralSource 
   * @param {string} explicitScheme 
   * @returns {string}
   */
  determineScheme(referralSource, explicitScheme) {
    if (explicitScheme && this.config.pricingSchemes[explicitScheme]) {
      return explicitScheme;
    }

    const referralConfig = this.config.referralSources[referralSource];
    if (referralConfig && referralConfig.defaultScheme) {
      return referralConfig.defaultScheme;
    }

    return this.config.fallbackRules.defaultScheme;
  }

  /**
   * Calculate price with fallback logic
   * @param {object} testConfig 
   * @param {string} scheme 
   * @param {string} referralSource 
   * @param {number} fallbackPrice 
   * @returns {object}
   */
  calculatePriceWithFallback(testConfig, scheme, referralSource, fallbackPrice) {
    const fallbackOrder = this.config.fallbackRules.priceCalculationOrder;

    for (const rule of fallbackOrder) {
      const result = this.tryPriceCalculation(testConfig, scheme, referralSource, rule);
      if (result.found) {
        return result;
      }
    }

    // Final fallback
    return this.createPriceResult(
      fallbackPrice || testConfig.defaultPrice, 
      'ultimate_fallback', 
      'Used ultimate fallback price'
    );
  }

  /**
   * Try a specific price calculation rule
   * @param {object} testConfig 
   * @param {string} scheme 
   * @param {string} referralSource 
   * @param {string} rule 
   * @returns {object}
   */
  tryPriceCalculation(testConfig, scheme, referralSource, rule) {
    switch (rule) {
      case 'testId_scheme_referralSource':
        return this.getSchemeReferralPrice(testConfig, scheme, referralSource);
      
      case 'testId_scheme_default':
        return this.getSchemeDefaultPrice(testConfig, scheme);
      
      case 'testId_defaultScheme_referralSource':
        const defaultScheme = this.config.fallbackRules.defaultScheme;
        return this.getSchemeReferralPrice(testConfig, defaultScheme, referralSource);
      
      case 'testId_defaultScheme_default':
        const defaultScheme2 = this.config.fallbackRules.defaultScheme;
        return this.getSchemeDefaultPrice(testConfig, defaultScheme2);
      
      case 'testId_defaultPrice':
        return this.createPriceResult(testConfig.defaultPrice, 'test_default', 'Used test default price');
      
      default:
        return { found: false };
    }
  }

  /**
   * Get price for specific scheme and referral source
   * @param {object} testConfig 
   * @param {string} scheme 
   * @param {string} referralSource 
   * @returns {object}
   */
  getSchemeReferralPrice(testConfig, scheme, referralSource) {
    const schemeConfig = testConfig.schemes[scheme];
    if (schemeConfig && schemeConfig.referralSources && schemeConfig.referralSources[referralSource]) {
      return this.createPriceResult(
        schemeConfig.referralSources[referralSource],
        'scheme_referral',
        `Used ${scheme} scheme for ${referralSource} referral`,
        { scheme, referralSource }
      );
    }
    return { found: false };
  }

  /**
   * Get default price for a scheme
   * @param {object} testConfig 
   * @param {string} scheme 
   * @returns {object}
   */
  getSchemeDefaultPrice(testConfig, scheme) {
    const schemeConfig = testConfig.schemes[scheme];
    if (schemeConfig && schemeConfig.price) {
      return this.createPriceResult(
        schemeConfig.price,
        'scheme_default',
        `Used ${scheme} scheme default price`,
        { scheme }
      );
    }
    return { found: false };
  }

  /**
   * Create a standardized price result object
   * @param {number} price 
   * @param {string} source 
   * @param {string} reason 
   * @param {object} metadata 
   * @returns {object}
   */
  createPriceResult(price, source, reason, metadata = {}) {
    return {
      found: true,
      price: parseFloat(price) || 0,
      source,
      reason,
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all available pricing schemes
   * @returns {array}
   */
  getAvailableSchemes() {
    return Object.values(this.config.pricingSchemes);
  }

  /**
   * Calculate volume discount based on quantity
   * @param {object} testConfig - Test configuration
   * @param {number} volume - Number of tests
   * @returns {number} Discount percentage
   */
  calculateVolumeDiscount(testConfig, volume) {
    if (!testConfig.discountRules || !testConfig.discountRules.volumeDiscounts) {
      return 0;
    }

    const volumeDiscounts = testConfig.discountRules.volumeDiscounts;
    let discount = 0;

    // Find the highest applicable volume discount
    Object.keys(volumeDiscounts).forEach(threshold => {
      if (volume >= parseInt(threshold)) {
        discount = Math.max(discount, volumeDiscounts[threshold]);
      }
    });

    return discount;
  }

  /**
   * Calculate loyalty discount based on customer tier
   * @param {string} loyaltyTier - Customer loyalty tier
   * @returns {number} Discount percentage
   */
  calculateLoyaltyDiscount(loyaltyTier) {
    if (!loyaltyTier || !this.referralMaster.discountRules.global.loyaltyDiscounts.enabled) {
      return 0;
    }

    const loyaltyTiers = this.referralMaster.discountRules.global.loyaltyDiscounts.tiers;
    return loyaltyTiers[loyaltyTier] || 0;
  }

  /**
   * Get referral sources from backend API with caching
   * @returns {Promise<array>}
   */
  async getReferralSourcesFromAPI() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.referralCache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheTimeout) {
        return this.referralCache;
      }

      // Fetch from API
      const response = await adminAPI.getReferralMaster();
      if (response.data.success) {
        this.referralCache = response.data.data;
        this.cacheTimestamp = now;
        return this.referralCache;
      } else {
        throw new Error(response.data.message || 'Failed to fetch referral data');
      }
    } catch (error) {
      console.warn('Failed to fetch referral data from API, falling back to static data:', error);
      // Fallback to static data
      return this.getAvailableReferralSourcesStatic();
    }
  }

  /**
   * Get all available referral sources (with API integration)
   * @returns {Promise<array>|array}
   */
  getAvailableReferralSources() {
    // Try to return cached data synchronously if available
    if (this.referralCache && this.cacheTimestamp &&
        (Date.now() - this.cacheTimestamp) < this.cacheTimeout) {
      return this.referralCache;
    }

    // For backward compatibility, return static data synchronously
    // Components should use getAvailableReferralSourcesAsync for real-time data
    return this.getAvailableReferralSourcesStatic();
  }

  /**
   * Get all available referral sources asynchronously (preferred method)
   * @returns {Promise<array>}
   */
  async getAvailableReferralSourcesAsync() {
    return await this.getReferralSourcesFromAPI();
  }

  /**
   * Get referral sources filtered by type
   * @param {string} referralType - The referral type to filter by
   * @returns {Promise<Array>} Array of filtered referral sources
   */
  async getReferralSourcesByType(referralType) {
    try {
      const allSources = await this.getAvailableReferralSourcesAsync();
      return allSources.filter(source => source.referralType === referralType);
    } catch (error) {
      console.error('Error filtering referral sources by type:', error);
      return [];
    }
  }

  /**
   * Enhanced test price calculation with referral type support
   * @param {string} testId - The test ID
   * @param {string} referralSource - The referral source ID
   * @param {string} referralType - The referral type (Doctor, Hospital, etc.)
   * @param {string} scheme - Optional specific scheme to use
   * @param {number} fallbackPrice - Fallback price if no configuration found
   * @param {object} options - Additional options (volume, loyalty, etc.)
   * @returns {object} Enhanced price information with details
   */
  getTestPriceWithType(testId, referralSource, referralType, scheme = null, fallbackPrice = 0, options = {}) {
    try {
      // First try the enhanced pricing with type information
      const enhancedResult = this.getEnhancedTestPrice(testId, referralSource, referralType, scheme, options);
      if (enhancedResult.found) {
        return enhancedResult;
      }

      // Fallback to existing pricing logic
      return this.getTestPrice(testId, referralSource, scheme, fallbackPrice, options);
    } catch (error) {
      console.error('Error calculating enhanced price:', error);
      return this.createPriceResult(fallbackPrice, 'error', error.message);
    }
  }

  /**
   * Enhanced pricing logic with referral type consideration
   * @param {string} testId - The test ID
   * @param {string} referralSource - The referral source ID
   * @param {string} referralType - The referral type
   * @param {string} scheme - Optional specific scheme to use
   * @param {object} options - Additional options
   * @returns {object} Enhanced price result
   */
  getEnhancedTestPrice(testId, referralSource, referralType, scheme, options = {}) {
    try {
      // Type-specific pricing rules
      const typeSpecificRules = {
        'Doctor': {
          defaultScheme: 'standard',
          maxDiscount: 15,
          commissionRate: 10
        },
        'Hospital': {
          defaultScheme: 'hospital',
          maxDiscount: 20,
          commissionRate: 8
        },
        'Lab': {
          defaultScheme: 'wholesale',
          maxDiscount: 25,
          commissionRate: 12
        },
        'Corporate': {
          defaultScheme: 'corporate',
          maxDiscount: 30,
          commissionRate: 5
        },
        'Insurance': {
          defaultScheme: 'insurance',
          maxDiscount: 18,
          commissionRate: 6
        },
        'Patient': {
          defaultScheme: 'standard',
          maxDiscount: 5,
          commissionRate: 0
        }
      };

      const typeRule = typeSpecificRules[referralType];
      if (!typeRule) {
        return { found: false };
      }

      // Use type-specific scheme if no scheme specified
      const selectedScheme = scheme || typeRule.defaultScheme;

      // Get base price calculation
      const baseResult = this.getTestPrice(testId, referralSource, selectedScheme, 0, options);

      if (baseResult.source === 'error' || baseResult.source === 'fallback') {
        return { found: false };
      }

      // Apply type-specific enhancements
      let enhancedPrice = baseResult.price;
      const enhancements = {
        typeSpecificDiscount: 0,
        volumeBonus: 0,
        loyaltyBonus: 0
      };

      // Apply volume-based pricing for certain types
      if (['Hospital', 'Lab', 'Corporate'].includes(referralType) && options.volume > 1) {
        const volumeDiscount = Math.min(options.volume * 0.5, typeRule.maxDiscount * 0.3);
        enhancements.volumeBonus = volumeDiscount;
        enhancedPrice = enhancedPrice * (1 - volumeDiscount / 100);
      }

      // Apply loyalty bonuses for long-term partners
      if (options.loyaltyTier && ['Hospital', 'Lab', 'Corporate'].includes(referralType)) {
        const loyaltyBonus = options.loyaltyTier === 'gold' ? 3 : options.loyaltyTier === 'silver' ? 2 : 1;
        enhancements.loyaltyBonus = loyaltyBonus;
        enhancedPrice = enhancedPrice * (1 - loyaltyBonus / 100);
      }

      return this.createPriceResult(
        Math.round(enhancedPrice * 100) / 100,
        'enhanced',
        `Enhanced pricing for ${referralType} referral`,
        {
          ...baseResult.breakdown,
          referralType,
          typeRule,
          enhancements,
          originalPrice: baseResult.price,
          enhancedSavings: Math.round((baseResult.price - enhancedPrice) * 100) / 100
        }
      );

    } catch (error) {
      console.error('Error in enhanced pricing:', error);
      return { found: false };
    }
  }

  /**
   * Get all available referral sources from static data (fallback)
   * @returns {array}
   */
  getAvailableReferralSourcesStatic() {
    const legacyReferrals = Object.values(this.config.referralSources);
    const comprehensiveReferrals = Object.values(this.referralMaster.referralMaster)
      .filter(ref => ref.isActive)
      .map(ref => ({
        id: ref.id,
        name: ref.name,
        description: ref.description,
        category: ref.category,
        discountPercentage: ref.discountPercentage
      }));

    // Merge and deduplicate
    const allReferrals = [...comprehensiveReferrals];
    legacyReferrals.forEach(legacy => {
      if (!allReferrals.find(ref => ref.id === legacy.id)) {
        allReferrals.push(legacy);
      }
    });

    return allReferrals;
  }

  /**
   * Clear referral cache to force refresh
   */
  clearReferralCache() {
    this.referralCache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Add new referral source via API
   * @param {object} referralData - The referral data to add
   * @returns {Promise<object>}
   */
  async addReferralSource(referralData) {
    try {
      const response = await adminAPI.addReferralMaster(referralData);
      if (response.data.success) {
        this.clearReferralCache(); // Clear cache to force refresh
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to add referral source');
      }
    } catch (error) {
      console.error('Error adding referral source:', error);
      throw error;
    }
  }

  /**
   * Update referral source via API
   * @param {string} referralId - The referral ID to update
   * @param {object} referralData - The updated referral data
   * @returns {Promise<object>}
   */
  async updateReferralSource(referralId, referralData) {
    try {
      const response = await adminAPI.updateReferralMaster(referralId, referralData);
      if (response.data.success) {
        this.clearReferralCache(); // Clear cache to force refresh
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update referral source');
      }
    } catch (error) {
      console.error('Error updating referral source:', error);
      throw error;
    }
  }

  /**
   * Delete referral source via API
   * @param {string} referralId - The referral ID to delete
   * @returns {Promise<object>}
   */
  async deleteReferralSource(referralId) {
    try {
      const response = await adminAPI.deleteReferralMaster(referralId);
      if (response.data.success) {
        this.clearReferralCache(); // Clear cache to force refresh
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete referral source');
      }
    } catch (error) {
      console.error('Error deleting referral source:', error);
      throw error;
    }
  }

  /**
   * Get pricing information for a test across all schemes and referrals
   * @param {string} testId 
   * @returns {object}
   */
  getTestPricingMatrix(testId) {
    const testConfig = this.config.testPricingMappings[testId];
    if (!testConfig) {
      return null;
    }

    const matrix = {
      testId,
      testName: testConfig.testName,
      defaultPrice: testConfig.defaultPrice,
      schemes: {}
    };

    Object.keys(testConfig.schemes).forEach(schemeId => {
      const scheme = testConfig.schemes[schemeId];
      matrix.schemes[schemeId] = {
        defaultPrice: scheme.price,
        referralPrices: scheme.referralSources || {}
      };
    });

    return matrix;
  }

  /**
   * Calculate commission for a referral source
   * @param {string} referralSource - The referral source
   * @param {number} amount - The transaction amount
   * @returns {object} Commission details
   */
  calculateCommission(referralSource, amount) {
    const referralConfig = this.referralMaster.referralMaster[referralSource];
    const commissionRules = this.referralMaster.commissionRules[referralSource];

    if (!referralConfig || !commissionRules) {
      return {
        commission: 0,
        percentage: 0,
        eligible: false,
        reason: 'No commission rules for this referral source'
      };
    }

    if (amount < commissionRules.minimumAmount) {
      return {
        commission: 0,
        percentage: commissionRules.percentage,
        eligible: false,
        reason: `Amount below minimum threshold of ₹${commissionRules.minimumAmount}`
      };
    }

    const commission = (amount * commissionRules.percentage) / 100;

    return {
      commission: Math.round(commission * 100) / 100,
      percentage: commissionRules.percentage,
      eligible: true,
      paymentCycle: commissionRules.paymentCycle,
      reason: 'Commission calculated successfully'
    };
  }

  /**
   * Get comprehensive pricing breakdown for a test
   * @param {string} testId - The test ID
   * @param {string} referralSource - The referral source
   * @param {object} options - Additional options
   * @returns {object} Detailed pricing breakdown
   */
  getPricingBreakdown(testId, referralSource, options = {}) {
    const priceResult = this.getTestPrice(testId, referralSource, null, 0, options);
    const commissionResult = this.calculateCommission(referralSource, priceResult.price);

    return {
      ...priceResult,
      commission: commissionResult,
      breakdown: {
        basePrice: priceResult.metadata?.basePrice || priceResult.price,
        discounts: {
          referral: priceResult.metadata?.referralDiscount || 0,
          volume: priceResult.metadata?.volumeDiscount || 0,
          loyalty: priceResult.metadata?.loyaltyDiscount || 0,
          total: priceResult.metadata?.totalDiscountPercentage || 0
        },
        finalPrice: priceResult.price,
        savings: priceResult.metadata?.savings || 0,
        commission: commissionResult.commission
      }
    };
  }

  /**
   * Validate pricing configuration
   * @returns {object}
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Check if default scheme exists
    const defaultScheme = this.config.fallbackRules.defaultScheme;
    if (!this.config.pricingSchemes[defaultScheme]) {
      errors.push(`Default scheme '${defaultScheme}' not found in pricing schemes`);
    }

    // Check test configurations
    Object.keys(this.config.testPricingMappings).forEach(testId => {
      const testConfig = this.config.testPricingMappings[testId];

      if (!testConfig.defaultPrice || testConfig.defaultPrice <= 0) {
        warnings.push(`Test ${testId} has invalid default price`);
      }

      Object.keys(testConfig.schemes).forEach(schemeId => {
        if (!this.config.pricingSchemes[schemeId]) {
          warnings.push(`Test ${testId} references unknown scheme '${schemeId}'`);
        }
      });
    });

    // Validate comprehensive pricing master
    Object.keys(this.referralMaster.testPricingMatrix).forEach(testId => {
      const testConfig = this.referralMaster.testPricingMatrix[testId];

      if (!testConfig.basePrice || testConfig.basePrice <= 0) {
        warnings.push(`Comprehensive test ${testId} has invalid base price`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Create and export singleton instance
const dynamicPricingService = new DynamicPricingService();
export default dynamicPricingService;
