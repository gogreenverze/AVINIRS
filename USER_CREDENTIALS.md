# RSAVINI LIS - User Credentials & System Documentation

## System Access Information

**Application URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## User Accounts & Credentials

### System Administrator
| Username | Password | Role | Tenant | Access Level |
|----------|----------|------|---------|--------------|
| `sysadmin` | `admin123` | admin | System-wide | Full system access across all tenants |

### Hub Administrator
| Username | Password | Role | Tenant | Access Level |
|----------|----------|------|---------|--------------|
| `myiladuthurai` | `hub123` | hub_admin | AVINI Labs Mayiladuthurai (Hub) | Hub management + all franchise oversight |

### Franchise Administrators
| Username | Password | Role | Tenant | Access Level |
|----------|----------|------|---------|--------------|
| `franchise_chd` | `franchise123` | franchise_admin | AVINI Labs Chidambaram | Site-specific management |
| `franchise_kmb` | `franchise123` | franchise_admin | AVINI Labs Kumbakonam | Site-specific management |
| `franchise_tnj` | `franchise123` | franchise_admin | AVINI Labs Thanjavur | Site-specific management |
| `franchise_ndm` | `franchise123` | franchise_admin | AVINI Labs Needamangalam | Site-specific management |
| `franchise_kth` | `franchise123` | franchise_admin | AVINI Labs Kuthalam | Site-specific management |
| `franchise_adt` | `franchise123` | franchise_admin | AVINI Labs Aduthurai | Site-specific management |
| `franchise_tpn` | `franchise123` | franchise_admin | AVINI Labs Thiruppanandal | Site-specific management |
| `franchise_skp` | `franchise123` | franchise_admin | AVINI Labs Sankarapanthal | Site-specific management |
| `franchise_erc` | `franchise123` | franchise_admin | AVINI Labs Eravancherry | Site-specific management |
| `franchise_nck` | `franchise123` | franchise_admin | AVINI Labs Nachiyarkovil | Site-specific management |

### Laboratory Staff
| Username | Password | Role | Tenant | Access Level |
|----------|----------|------|---------|--------------|
| `labtech_myl` | `lab123` | lab_tech | AVINI Labs Mayiladuthurai | Sample processing & testing |
| `labtech_chd` | `lab123` | lab_tech | AVINI Labs Chidambaram | Sample processing & testing |
| `labtech_kmb` | `lab123` | lab_tech | AVINI Labs Kumbakonam | Sample processing & testing |
| `labtech_tnj` | `lab123` | lab_tech | AVINI Labs Thanjavur | Sample processing & testing |

### Reception Staff
| Username | Password | Role | Tenant | Access Level |
|----------|----------|------|---------|--------------|
| `reception_myl` | `reception123` | receptionist | AVINI Labs Mayiladuthurai | Patient registration & billing |
| `reception_chd` | `reception123` | receptionist | AVINI Labs Chidambaram | Patient registration & billing |
| `reception_kmb` | `reception123` | receptionist | AVINI Labs Kumbakonam | Patient registration & billing |
| `reception_tnj` | `reception123` | receptionist | AVINI Labs Thanjavur | Patient registration & billing |

## Tenant/Site Information

### Hub Site
**AVINI Labs Mayiladuthurai (Hub)**
- **Site Code:** MYL
- **Address:** Main Hub, Mayiladuthurai, Tamil Nadu 609001
- **Contact:** 6384440505
- **Type:** Hub (Central Management)
- **Manages:** All franchise locations

### Franchise Sites
**AVINI Labs Chidambaram**
- **Site Code:** CHD
- **Address:** Franchise Location, Chidambaram, Tamil Nadu 608001
- **Contact:** 6384440502
- **Type:** Franchise

**AVINI Labs Kumbakonam**
- **Site Code:** KMB
- **Address:** Franchise Location, Kumbakonam, Tamil Nadu 612001
- **Contact:** 6384440503
- **Type:** Franchise

**AVINI Labs Thanjavur**
- **Site Code:** TNJ
- **Address:** Franchise Location, Thanjavur, Tamil Nadu 613001
- **Contact:** 6384440520
- **Type:** Franchise

**AVINI Labs Needamangalam**
- **Site Code:** NDM
- **Address:** Franchise Location, Needamangalam, Tamil Nadu
- **Contact:** 6384440509
- **Type:** Franchise

**AVINI Labs Kuthalam**
- **Site Code:** KTH
- **Address:** Franchise Location, Kuthalam, Tamil Nadu
- **Contact:** 9488776966
- **Type:** Franchise

**AVINI Labs Aduthurai**
- **Site Code:** ADT
- **Address:** Franchise Location, Aduthurai, Tamil Nadu
- **Contact:** 6384440510
- **Type:** Franchise

**AVINI Labs Thiruppanandal**
- **Site Code:** TPN
- **Address:** Franchise Location, Thiruppanandal, Tamil Nadu
- **Contact:** 6384440521
- **Type:** Franchise

**AVINI Labs Sankarapanthal**
- **Site Code:** SKP
- **Address:** Franchise Location, Sankarapanthal, Tamil Nadu
- **Contact:** 6384440507
- **Type:** Franchise

**AVINI Labs Eravancherry**
- **Site Code:** ERC
- **Address:** Franchise Location, Eravancherry, Tamil Nadu
- **Contact:** 6384440508
- **Type:** Franchise

**AVINI Labs Nachiyarkovil**
- **Site Code:** NCK
- **Address:** Franchise Location, Nachiyarkovil, Tamil Nadu
- **Contact:** 6384440506
- **Type:** Franchise

## Role-Based Access Control

### Admin (System Administrator)
- **Full System Access:** All tenants, all data, all functionality
- **User Management:** Create, modify, delete users across all sites
- **System Configuration:** Global settings, master data management
- **Reporting:** Cross-tenant analytics and reports
- **WhatsApp Integration:** Configure and manage for all sites

### Hub Admin (Hub Administrator)
- **Hub Management:** Full access to hub operations
- **Franchise Oversight:** View and manage all franchise data
- **User Management:** Create and manage franchise users
- **Reporting:** Hub and franchise analytics
- **WhatsApp Integration:** Configure and manage for hub and franchises
- **Inventory Management:** Cross-site inventory oversight

### Franchise Admin (Site Administrator)
- **Site Management:** Full access to their specific site
- **Local User Management:** Manage staff at their site
- **Local Reporting:** Site-specific analytics
- **Patient Management:** All patient operations at their site
- **Billing Management:** Site billing and collections
- **Local Inventory:** Site-specific inventory management

### Lab Technician
- **Sample Processing:** Receive, process, and test samples
- **Result Entry:** Enter and verify test results
- **Quality Control:** QC testing and validation
- **Equipment Management:** Basic equipment status updates
- **Limited Patient View:** View patient info for testing purposes

### Receptionist
- **Patient Registration:** Register new patients and update information
- **Appointment Management:** Schedule and manage appointments
- **Sample Collection:** Register sample collection
- **Billing Operations:** Generate bills and process payments
- **Basic Reporting:** Patient and billing reports

## Login Instructions

1. **Access the Application:**
   - Open web browser
   - Navigate to: http://localhost:3000

2. **Login Process:**
   - Enter username and password from the tables above
   - Click "Login" button
   - System will redirect based on user role

3. **Initial Setup (First Time Users):**
   - Change default password (recommended)
   - Review user profile information
   - Familiarize with role-specific dashboard

## WhatsApp Integration

### Configuration Access
- **Admin & Hub Admin:** Full configuration access
- **Franchise Admin:** View-only access to their site configuration

### Message Sending
- **Available for:** All user roles (with appropriate permissions)
- **Report Messages:** Send test results to patients
- **Invoice Messages:** Send billing information to patients
- **Message Tracking:** View delivery status and history

### Test Scenarios
1. **Hub Admin Testing:**
   - Login as `myiladuthurai`
   - Configure WhatsApp settings
   - Send test reports and invoices
   - View message history across all sites

2. **Franchise Testing:**
   - Login as franchise admin
   - Send site-specific messages
   - View site-specific message history

## Sample Data Overview

### Patients (10 patients across 4 sites)
- **Mayiladuthurai Hub:** Rajesh Kumar, Meera Nair, Anitha Raman
- **Chidambaram:** Priya Sharma, Karthik Raman, Arjun Subramanian
- **Kumbakonam:** Murugan Pillai, Divya Krishnan
- **Thanjavur:** Lakshmi Devi, Venkatesh Iyer
- **Contact Information:** All patients have phone numbers for WhatsApp testing

### Test Orders & Results (5 results across sites)
- **Verified Results:** Ready for WhatsApp report sending
  - Rajesh Kumar (MYL): Blood Glucose - 85 mg/dL (Normal)
  - Meera Nair (MYL): Blood Glucose Fasting - 12.5 g/dL (Normal)
  - Arjun Subramanian (CHD): Lipid Profile - Normal
  - Venkatesh Iyer (TNJ): Complete Blood Count - Normal
- **Pending Results:** Available for workflow testing
  - Divya Krishnan (KMB): Thyroid Profile - Under review

### Billing Records (5 invoices across sites)
- **Paid Invoices:**
  - INV-MYL-001: ₹1500 (Rajesh Kumar) - Paid
  - INV-CHD-001: ₹600 (Arjun Subramanian) - Paid via UPI
  - INV-TNJ-001: ₹350 (Venkatesh Iyer) - Paid via Card
- **Pending/Partial Payments:**
  - INV-MYL-002: ₹150 (Meera Nair) - Pending
  - INV-KMB-001: ₹850 (Divya Krishnan) - ₹350 balance due

### Inventory (Multi-site distribution)
- **Hub (MYL):** Blood collection tubes, glucose reagents, syringes, gloves
- **Franchises:** Site-specific reagents and consumables
- **Low Stock Alerts:** Thyroid reagent kit (KMB), Latex gloves (MYL)
- **Categories:** Consumables, Reagents, PPE, Glassware

### WhatsApp Integration Data
- **Configuration:** Enabled for tenant ID 1 (Mayiladuthurai Hub)
- **Message History:** 4 sent messages (2 reports, 2 invoices)
- **Templates:** Configured for reports and invoices
- **Phone Numbers:** All patients have valid phone numbers for testing

## Testing Workflows

### 1. Multi-Tenant Access Testing
- Login as hub admin → View all site data
- Login as franchise admin → View only site-specific data
- Verify data isolation between sites

### 2. WhatsApp Integration Testing
- Configure WhatsApp settings
- Send test reports to patients
- Send invoices via WhatsApp
- Track message delivery status

### 3. Role-Based Permission Testing
- Test each role's access limitations
- Verify unauthorized access prevention
- Test cross-site data access controls

### 4. Operational Workflow Testing
- Patient registration → Sample collection → Testing → Results → Billing
- Test the complete laboratory workflow
- Verify data flow between modules

### 5. WhatsApp End-to-End Testing Scenarios

#### Scenario A: Hub Admin WhatsApp Configuration
1. Login as `myiladuthurai` (hub admin)
2. Navigate to Admin Dashboard → WhatsApp tab
3. Click "Configure" to access WhatsApp settings
4. Verify configuration form loads with current settings
5. Test updating API credentials and templates
6. Enable/disable WhatsApp integration
7. Save configuration and verify success message

#### Scenario B: Send Test Report via WhatsApp
1. Login as `myiladuthurai` (hub admin)
2. Navigate to Results section
3. View verified result (e.g., Rajesh Kumar's Blood Glucose)
4. Scroll to WhatsApp section in result view
5. Click "Send via WhatsApp" button
6. Fill in patient details and message
7. Send message and verify success notification
8. Check message history for delivery status

#### Scenario C: Send Invoice via WhatsApp
1. Login as `myiladuthurai` (hub admin)
2. Navigate to Billing section
3. View pending invoice (e.g., Meera Nair's INV-MYL-002)
4. Scroll to WhatsApp section in billing view
5. Click "Send via WhatsApp" button
6. Fill in patient details and invoice message
7. Send message and verify success notification
8. Check message history for delivery status

#### Scenario D: WhatsApp Message History Review
1. Login as `myiladuthurai` (hub admin)
2. Navigate to Admin Dashboard → WhatsApp tab
3. Click "Message History" to view sent messages
4. Verify message list shows all sent messages
5. Check message status (sent, delivered, failed)
6. View message details and content
7. Test pagination if multiple messages exist

#### Scenario E: Multi-Site WhatsApp Access Testing
1. Login as franchise admin (e.g., `franchise_chd`)
2. Verify WhatsApp functionality is available
3. Test sending messages for site-specific patients
4. Verify message history shows only site messages
5. Confirm no access to other sites' WhatsApp data

### 6. Data Validation Testing
- Verify tenant data isolation across all modules
- Test role-based access restrictions
- Validate data consistency across related records
- Check audit trails and timestamps

## Support Information

### Technical Support
- **System Issues:** Check browser console for errors
- **API Issues:** Monitor backend logs at terminal
- **Database Issues:** Verify JSON data file integrity

### Common Troubleshooting
1. **Login Issues:** Verify username/password case sensitivity
2. **Permission Errors:** Ensure user has appropriate role
3. **WhatsApp Issues:** Check configuration and enable status
4. **Data Loading:** Refresh page or check network connectivity

---

**Last Updated:** May 22, 2025
**System Version:** RSAVINI LIS v1.0
**Documentation Version:** 1.0
