# Dynamic Pricing and Referral Scheme Mapping Implementation

## Overview

This implementation adds dynamic pricing capabilities to your medical billing system, allowing different prices for tests based on referral sources and pricing schemes. The system automatically determines the correct price when a user selects a test and referral source, with intelligent fallback mechanisms.

## Key Features

### 1. **Dynamic Pricing Configuration**
- **Multiple Pricing Schemes**: Standard, Corporate, Insurance, Promotional
- **Referral Source Mapping**: Doctor, Self, Hospital, Corporate, Insurance, Lab
- **Automatic Scheme Selection**: Based on referral source
- **Fallback Mechanisms**: Multiple levels of fallback pricing

### 2. **Enhanced Billing Interface**
- **Referral Source Dropdown**: Added to test selection
- **Pricing Scheme Override**: Optional manual scheme selection
- **Real-time Price Updates**: Prices update automatically when referral source changes
- **Price Calculation Details**: Shows how the price was determined

### 3. **Admin Management Interface**
- **Pricing Matrix View**: Visual representation of all pricing combinations
- **Configuration Validation**: Checks for missing or invalid configurations
- **Easy Editing**: Point-and-click editing of pricing rules

## Implementation Details

### Files Created/Modified

#### New Files:
1. **`src/data/dynamicPricingConfig.json`** - Pricing configuration data
2. **`src/services/dynamicPricingService.js`** - Core pricing logic service
3. **`src/components/admin/DynamicPricingManager.js`** - Admin interface
4. **`test_dynamic_pricing.js`** - Test suite

#### Modified Files:
1. **`src/pages/billing/BillingRegistration.js`** - Added referral dropdown and dynamic pricing
2. **`src/pages/billing/BillingView.js`** - Updated add test modal with dynamic pricing

### Configuration Structure

```json
{
  "pricingSchemes": {
    "standard": { "name": "Standard", "isDefault": true },
    "corporate": { "name": "Corporate" },
    "insurance": { "name": "Insurance" },
    "promotional": { "name": "Promotional" }
  },
  "referralSources": {
    "doctor": { "defaultScheme": "standard" },
    "corporate": { "defaultScheme": "corporate" },
    "insurance": { "defaultScheme": "insurance" }
  },
  "testPricingMappings": {
    "@000003": {
      "testName": "17 HYDROXY CORTICO STEROID 24 HR URINE",
      "defaultPrice": 4000.0,
      "schemes": {
        "standard": {
          "price": 4000.0,
          "referralSources": {
            "doctor": 4000.0,
            "self": 4000.0,
            "hospital": 3800.0
          }
        },
        "corporate": {
          "price": 3500.0,
          "referralSources": {
            "corporate": 3500.0,
            "hospital": 3400.0
          }
        }
      }
    }
  }
}
```

### Pricing Logic Flow

1. **Test Selection**: User selects a test from dropdown
2. **Referral Source**: User selects referral source (defaults to "Self")
3. **Scheme Determination**: System determines pricing scheme:
   - Use explicit scheme if selected
   - Use default scheme for referral source
   - Fallback to "standard" scheme
4. **Price Calculation**: System tries in order:
   - Test + Scheme + Referral Source specific price
   - Test + Scheme default price
   - Test + Default Scheme + Referral Source price
   - Test + Default Scheme default price
   - Test default price
   - Original fallback price

### API Integration Points

The system integrates with your existing billing API structure:

```javascript
// Enhanced test item structure
const testItem = {
  // Existing fields
  test_id: "test123",
  testName: "Test Name",
  amount: 1000,
  
  // New dynamic pricing fields
  referralSource: "doctor",
  pricingScheme: "standard",
  priceCalculationDetails: {
    price: 1000,
    source: "scheme_referral",
    reason: "Used standard scheme for doctor referral"
  }
};
```

## Usage Instructions

### For End Users (Billing Staff)

1. **Creating a New Bill**:
   - Select patient information as usual
   - In test selection:
     - Choose the test from dropdown
     - Select referral source (Doctor, Self, Hospital, etc.)
     - Optionally override pricing scheme
     - Price updates automatically
   - Complete billing as normal

2. **Price Information**:
   - Hover over price field to see calculation details
   - Green badge = Dynamic pricing applied
   - Yellow badge = Fallback pricing used
   - Gray badge = Default pricing used

### For Administrators

1. **Managing Pricing Configuration**:
   - Navigate to Admin → Dynamic Pricing Manager
   - View pricing matrix for any test
   - Edit individual price points
   - Add new pricing rules
   - Validate configuration

2. **Adding New Tests**:
   - Use "Add Pricing Rule" button
   - Enter test ID and name
   - Set prices for different scheme/referral combinations
   - Save configuration

## Testing

### Automated Tests
Run the test suite to validate pricing logic:

```javascript
// In browser console
runDynamicPricingTests();
testBillingIntegration();
```

### Manual Testing Scenarios

1. **Standard Doctor Referral**:
   - Select any test
   - Choose "Doctor" as referral source
   - Verify standard pricing is applied

2. **Corporate Referral**:
   - Select any test
   - Choose "Corporate" as referral source
   - Verify corporate pricing is applied (usually discounted)

3. **Insurance Referral**:
   - Select any test
   - Choose "Insurance" as referral source
   - Verify insurance pricing is applied

4. **Fallback Testing**:
   - Select a test not in pricing configuration
   - Verify fallback to original test price

## Configuration Management

### Adding New Pricing Schemes

1. Update `dynamicPricingConfig.json`:
```json
"pricingSchemes": {
  "newScheme": {
    "id": "newScheme",
    "name": "New Scheme",
    "description": "Description of new scheme"
  }
}
```

2. Add scheme mappings to tests:
```json
"testPricingMappings": {
  "@000003": {
    "schemes": {
      "newScheme": {
        "price": 3000.0,
        "referralSources": {
          "doctor": 3000.0,
          "self": 2800.0
        }
      }
    }
  }
}
```

### Adding New Referral Sources

1. Update `referrerMasterData.json`:
```json
"referrerTypes": [
  {
    "id": "newReferral",
    "name": "New Referral Type",
    "description": "Description"
  }
]
```

2. Update pricing configuration:
```json
"referralSources": {
  "newReferral": {
    "id": "newReferral",
    "name": "New Referral Type",
    "defaultScheme": "standard"
  }
}
```

## Benefits

1. **Flexible Pricing**: Different prices for different customer types
2. **Automated Calculations**: No manual price lookup required
3. **Audit Trail**: Track how prices were calculated
4. **Easy Management**: Admin interface for configuration
5. **Fallback Safety**: Always has a price, even for unconfigured tests
6. **Integration Ready**: Works with existing billing system

## Future Enhancements

1. **Time-based Pricing**: Different prices based on time of day/week
2. **Volume Discounts**: Automatic discounts for multiple tests
3. **Patient History**: Pricing based on patient loyalty/history
4. **API Integration**: Real-time pricing from external systems
5. **Approval Workflows**: Require approval for certain pricing schemes

## Troubleshooting

### Common Issues

1. **Price not updating**: Check if test is in pricing configuration
2. **Wrong price applied**: Verify referral source mapping
3. **Fallback pricing**: Check configuration validation in admin panel

### Debug Information

The system logs detailed pricing calculations to browser console:
- Price calculation steps
- Fallback reasons
- Configuration validation results

## Support

For technical support or configuration questions, refer to:
- Configuration validation in admin panel
- Browser console logs for debugging
- Test suite results for validation
