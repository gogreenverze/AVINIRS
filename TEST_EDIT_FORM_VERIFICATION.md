# TEST MASTER EDIT FORM - VERIFICATION CHECKLIST

## 🧪 **Testing Instructions**

### **Step 1: Navigate to Test Master**
1. Open browser to `http://localhost:3001/admin/master-data`
2. Click on "Test Master" tab
3. Verify that the table displays test records with proper data (not "N/A")

### **Step 2: Test Edit Form Field Population**
1. **Select a specific test record** for testing:
   - **Test Name**: "1,25 Dihydroxyvitamin D"
   - **HMS Code**: "648.0"
   - **Department**: "IMMUNOLOGY"

2. **Click the "Edit" button** for this record

3. **Verify ALL fields are populated correctly**:

#### **✅ Basic Information Section**
- [ ] **Department**: Should show "IMMUNOLOGY" (searchable dropdown)
- [ ] **Test Name**: Should show "1,25 Dihydroxyvitamin D"
- [ ] **HMS Code**: Should show "648.0"
- [ ] **International Code**: Should show existing value or be empty
- [ ] **Short Name**: Should show existing value or be empty
- [ ] **Display Name**: Should show existing value or be empty
- [ ] **Report Name**: Should show existing value or be empty
- [ ] **EMR Classification**: Should show existing value or be empty

#### **✅ Test Configuration Section**
- [ ] **Method**: Should show "Automated"
- [ ] **Container**: Should show "Serum"
- [ ] **Primary Specimen**: Should show existing value or be empty
- [ ] **Service Time**: Should show "24 Hours"

#### **✅ Reference & Results Section**
- [ ] **Reference Range**: Should show "19.9-79.3" (textarea)
- [ ] **Result Unit**: Should show "pg/ml"
- [ ] **Decimals**: Should show "1"
- [ ] **Test Price**: Should show "3500" (required field)
- [ ] **Critical Low**: Should show existing value or be empty
- [ ] **Critical High**: Should show existing value or be empty

#### **✅ Sub-Tests Section**
- [ ] **Associated Sub-Tests**: Should show searchable multi-select dropdown
- [ ] **Sub-test options**: Should load from sub_test_master.json
- [ ] **Current selection**: Should show any existing sub-tests (likely empty for this test)
- [ ] **Search functionality**: Should allow typing to search sub-tests
- [ ] **Multi-selection**: Should allow selecting multiple sub-tests

#### **✅ Instructions & Notes Section**
- [ ] **Instructions**: Should show existing instructions or be empty (textarea)
- [ ] **Interpretation**: Should show existing interpretation or be empty (textarea)
- [ ] **Special Report**: Should show existing special report or be empty (textarea)

#### **✅ Status Section**
- [ ] **Active Test**: Should show toggle switch with current status (likely checked/true)

### **Step 3: Test Sub-Test Selection Functionality**

1. **In the Sub-Tests section**:
   - [ ] Click on the "Associated Sub-Tests" dropdown
   - [ ] Verify that sub-test options appear (from sub_test_master.json)
   - [ ] Type to search for a sub-test (e.g., type "hkuhk")
   - [ ] Select one or more sub-tests
   - [ ] Verify selected sub-tests appear as badges
   - [ ] Test removing a selected sub-test

### **Step 4: Test Form Submission**

1. **Make a small change** (e.g., modify Test Price from 3500 to 3600)
2. **Click "Save" or "Update"** button
3. **Verify**:
   - [ ] Success message appears
   - [ ] Modal closes
   - [ ] Table refreshes with updated data
   - [ ] Updated test price shows in the table

### **Step 5: Test Different Test Records**

**Test with another record**:
- **Test Name**: "17 - HYDROXY PROGESTERONE"
- **HMS Code**: "2.0"
- **Department**: "IMMUNOLOGY"

**Verify**:
- [ ] All fields populate correctly for this different test
- [ ] Test Price shows "800"
- [ ] All form sections work properly

### **Step 6: Test Form Validation**

1. **Clear a required field** (e.g., Test Name or Test Price)
2. **Try to submit the form**
3. **Verify**:
   - [ ] Validation error appears
   - [ ] Form doesn't submit with missing required data
   - [ ] Error messages are clear and helpful

## 🔍 **Expected Results**

### **✅ PASS Criteria**
- All form fields populate with existing test data
- Sub-test dropdown loads and functions correctly
- Form submission updates test records successfully
- No console errors in browser developer tools
- Responsive design works on different screen sizes

### **❌ FAIL Criteria**
- Any form fields show "undefined", "null", or remain empty when they should have data
- Sub-test dropdown doesn't load or function
- Form submission fails or doesn't update data
- Console errors appear
- Form layout is broken or unresponsive

## 🐛 **Common Issues to Check**

### **Data Binding Issues**
- Check browser console for JavaScript errors
- Verify that `testMasterFormData` is being used instead of `formData`
- Ensure `handleTestMasterChange` is properly connected to form fields

### **Sub-Test Integration Issues**
- Verify that `availableSubTests` state is populated
- Check that `getSubTestOptions()` function returns proper data
- Ensure `handleSubTestChange` updates both `selectedSubTests` and `testMasterFormData.subTests`

### **API Issues**
- Check Network tab in browser developer tools
- Verify that edit submission sends correct data structure
- Ensure backend API accepts the updated testMaster data format

## 📊 **Test Results Log**

**Date**: ___________
**Tester**: ___________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Basic field population | ⬜ PASS / ⬜ FAIL | |
| Sub-test dropdown functionality | ⬜ PASS / ⬜ FAIL | |
| Form submission | ⬜ PASS / ⬜ FAIL | |
| Data validation | ⬜ PASS / ⬜ FAIL | |
| Responsive design | ⬜ PASS / ⬜ FAIL | |

**Overall Result**: ⬜ PASS / ⬜ FAIL

**Additional Notes**:
_________________________________
_________________________________
_________________________________

## 🎯 **Success Confirmation**

When all tests pass, the Test Master edit form should provide:
- ✅ Complete field population from existing test data
- ✅ Functional sub-test search and selection
- ✅ Successful form submission with data updates
- ✅ Professional user experience with proper validation
- ✅ Seamless integration with the existing Master Data interface
