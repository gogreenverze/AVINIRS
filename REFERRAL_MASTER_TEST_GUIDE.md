# Referral Master Data Test Guide

## Overview
This guide provides step-by-step verification examples for the complete referral master data lifecycle functionality, including 5 realistic test referral entries and comprehensive testing procedures.

## Test Referral Entries

### 1. Metro Cardiology Center
- **ID**: `metro_cardiology`
- **Name**: Metro Cardiology Center
- **Description**: Specialized cardiac care center with comprehensive diagnostic services
- **Category**: medical
- **Default Pricing Scheme**: standard
- **Discount Percentage**: 12
- **Commission Percentage**: 8
- **Status**: Active
- **Priority**: 1

### 2. TechCorp Employee Health
- **ID**: `techcorp_health`
- **Name**: TechCorp Employee Health Program
- **Description**: Corporate health program for TechCorp employees and their families
- **Category**: corporate
- **Default Pricing Scheme**: corporate
- **Discount Percentage**: 20
- **Commission Percentage**: 5
- **Status**: Active
- **Priority**: 2

### 3. City General Hospital
- **ID**: `city_general`
- **Name**: City General Hospital
- **Description**: Multi-specialty hospital with 24/7 emergency services
- **Category**: institutional
- **Default Pricing Scheme**: hospital
- **Discount Percentage**: 8
- **Commission Percentage**: 10
- **Status**: Active
- **Priority**: 3

### 4. Senior Care Plus
- **ID**: `senior_care_plus`
- **Name**: Senior Care Plus Program
- **Description**: Specialized healthcare program for senior citizens with enhanced benefits
- **Category**: social
- **Default Pricing Scheme**: senior
- **Discount Percentage**: 25
- **Commission Percentage**: 0
- **Status**: Active
- **Priority**: 4

### 5. QuickLab Express
- **ID**: `quicklab_express`
- **Name**: QuickLab Express Services
- **Description**: Express diagnostic services for urgent and same-day testing requirements
- **Category**: professional
- **Default Pricing Scheme**: wholesale
- **Discount Percentage**: 15
- **Commission Percentage**: 12
- **Status**: Active
- **Priority**: 5

## Step-by-Step Verification Procedures

### Phase 1: Backend API Testing

#### 1.1 Test GET Referral Master API
```bash
# Test endpoint: GET /api/admin/referral-master
# Expected: Returns existing referral sources with success response
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:5002/api/admin/referral-master
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...existing referral sources...],
  "total": number
}
```

#### 1.2 Test POST Referral Master API
```bash
# Test adding Metro Cardiology Center
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "metro_cardiology",
       "name": "Metro Cardiology Center",
       "description": "Specialized cardiac care center with comprehensive diagnostic services",
       "category": "medical",
       "defaultPricingScheme": "standard",
       "discountPercentage": 12,
       "commissionPercentage": 8,
       "isActive": true,
       "priority": 1
     }' \
     http://localhost:5002/api/admin/referral-master
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Referral source added successfully",
  "data": {...created referral object...}
}
```

### Phase 2: Frontend CRUD Operations Testing

#### 2.1 Create Operation Test
1. Navigate to **Admin → Technical Master Data**
2. Click on **Referral Master** tab
3. Click **Add Referral Source** button
4. Fill in Metro Cardiology Center details (see test data above)
5. Click **Save**

**Expected Results:**
- Success message appears
- New referral appears in the table
- Form resets and modal closes
- Data persists after page refresh

#### 2.2 Read Operation Test
1. Verify all 5 test referrals appear in the table
2. Check that each referral shows:
   - Correct name and description
   - Proper category badge color
   - Accurate discount and commission percentages
   - Active status badge
   - Example pricing calculations

#### 2.3 Update Operation Test
1. Click **Edit** button for "Metro Cardiology Center"
2. Change discount percentage from 12% to 15%
3. Update description to add "and preventive care services"
4. Click **Save Changes**

**Expected Results:**
- Success message appears
- Updated values reflect in the table
- Changes persist after page refresh

#### 2.4 Delete Operation Test
1. Click **Delete** button for "QuickLab Express"
2. Confirm deletion in the popup
3. Verify referral is removed from table

**Expected Results:**
- Confirmation dialog appears
- Success message after confirmation
- Referral no longer appears in table
- Data persistence after refresh

### Phase 3: Billing Integration Testing

#### 3.1 Referral Dropdown Population Test
1. Navigate to **Billing → Registration**
2. Add a new test item
3. Check **Referral Source** dropdown

**Expected Results:**
- Dropdown shows all active referral sources
- Each option displays name and discount percentage
- Description appears below dropdown when selected
- Loading state shows while fetching data

#### 3.2 Dynamic Pricing Test
1. Select "CBC001" test
2. Choose "TechCorp Employee Health" as referral source
3. Verify price calculation

**Expected Results:**
- Base price: ₹500
- Corporate discount (20%): ₹100
- Final price: ₹400
- Pricing breakdown shows in test item details

#### 3.3 Billing Record Persistence Test
1. Complete a billing with "City General Hospital" referral
2. Save the billing record
3. View the billing in reports

**Expected Results:**
- Referral source saved in billing record
- Correct pricing applied and saved
- Referral information appears in billing reports

### Phase 4: Data Consistency Testing

#### 4.1 Real-time Updates Test
1. Open two browser tabs:
   - Tab 1: Technical Master Data (Referral Master)
   - Tab 2: Billing Registration
2. In Tab 1, add a new referral source
3. In Tab 2, refresh the test item form

**Expected Results:**
- New referral appears in billing dropdown
- No page refresh needed for updates
- Cache invalidation works correctly

#### 4.2 Error Handling Test
1. Try to add referral with duplicate ID
2. Try to add referral with missing required fields
3. Try to delete non-existent referral

**Expected Results:**
- Appropriate error messages appear
- Form validation prevents invalid submissions
- System handles errors gracefully

### Phase 5: Quality Assurance Checklist

#### 5.1 Functionality Verification
- [ ] All CRUD operations work correctly
- [ ] Data persists across sessions
- [ ] Billing integration functions properly
- [ ] Real-time updates work
- [ ] Error handling is robust

#### 5.2 UI/UX Verification
- [ ] Forms are intuitive and well-labeled
- [ ] Success/error messages are clear
- [ ] Loading states are shown appropriately
- [ ] Responsive design works on mobile
- [ ] Accessibility features are present

#### 5.3 Performance Verification
- [ ] API responses are fast (< 500ms)
- [ ] Caching reduces redundant requests
- [ ] Large datasets load efficiently
- [ ] No memory leaks in frontend

#### 5.4 Security Verification
- [ ] Authentication required for all operations
- [ ] Authorization checks prevent unauthorized access
- [ ] Input validation prevents injection attacks
- [ ] Sensitive data is properly handled

## Troubleshooting Common Issues

### Issue 1: Referral sources not loading in billing
**Solution**: Check browser console for API errors, verify authentication token

### Issue 2: Changes not persisting
**Solution**: Verify backend file permissions, check for JSON syntax errors

### Issue 3: Dropdown not updating after adding referral
**Solution**: Clear cache using dynamicPricingService.clearReferralCache()

### Issue 4: Pricing calculations incorrect
**Solution**: Verify referral data structure matches expected format

## Success Criteria

The implementation is considered successful when:
1. All 5 test referrals can be created, read, updated, and deleted
2. Billing system properly uses referral master data
3. Real-time updates work across components
4. Data persists correctly across sessions
5. Error handling provides clear feedback
6. Performance meets acceptable standards
7. Security measures are properly implemented

## Next Steps

After successful verification:
1. Deploy to staging environment
2. Conduct user acceptance testing
3. Train end users on new functionality
4. Monitor system performance in production
5. Gather feedback for future improvements
