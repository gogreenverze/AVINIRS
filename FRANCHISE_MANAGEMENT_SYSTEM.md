# AVINI Multi-Tenant Franchise Management System

## Overview

The AVINI application has been enhanced with a comprehensive multi-tenant franchise management system that provides role-based access control and data isolation across all franchise locations.

## System Architecture

### Main Hub
- **Location**: MAYILADHUTHURAI (MYD)
- **Role**: Central hub with oversight of all franchises
- **Admin Account**: `mayiladhuthurai` / `super123`
- **Access Level**: Complete system-wide access to all franchise data

### Franchise Locations

| ID | Franchise Name | Site Code | Admin Username | Password | Email |
|----|----------------|-----------|----------------|----------|-------|
| 2 | AVINI Labs Sirkazhi | SKZ | sirkazhi | sirkazhi123 | admin@sirkazhi.avinilabs.com |
| 3 | AVINI Labs Thanjavur | TNJ | thanjavur | thanjavur123 | admin@thanjavur.avinilabs.com |
| 4 | AVINI Labs Kuthalam | KTL | kuthalam | kuthalam123 | admin@kuthalam.avinilabs.com |
| 5 | AVINI Labs Aduthurai | ADT | aduthurai | aduthurai123 | admin@aduthurai.avinilabs.com |
| 6 | AVINI Labs Thiruppanandal | TPN | thiruppanandal | thiruppanandal123 | admin@thiruppanandal.avinilabs.com |
| 7 | AVINI Labs Eravancherry | ERC | eravancherry | eravancherry123 | admin@eravancherry.avinilabs.com |
| 8 | AVINI Labs Nachiyarkovil | NCK | nachiyarkovil | nachiyarkovil123 | admin@nachiyarkovil.avinilabs.com |
| 9 | My Kidney Care MYD | MKC | mykidneycare | mykidneycare123 | admin@mykidneycare.avinilabs.com |
| 10 | Velan Clinic | VCL | velanclinic | velanclinic123 | admin@velanclinic.avinilabs.com |
| 11 | AVINI Labs Swamimalai | SWM | swamimalai | swamimalai123 | admin@swamimalai.avinilabs.com |
| 12 | AVINI Labs Pandhanallur | PDN | pandhanallur | pandhanallur123 | admin@pandhanallur.avinilabs.com |
| 13 | AVINI Labs Kumbakonam | KBK | kumbakonam | kumbakonam123 | admin@kumbakonam.avinilabs.com |
| 14 | AVINI Labs Mannargudi | MNG | mannargudi | mannargudi123 | admin@mannargudi.avinilabs.com |
| 15 | AVINI Labs Thirukkattupalli | TKP | thirukkattupalli | thirukkattupalli123 | admin@thirukkattupalli.avinilabs.com |
| 16 | AVINI Labs Sembanarkovil | SBK | sembanarkovil | sembanarkovil123 | admin@sembanarkovil.avinilabs.com |
| 17 | AVINI Labs Thuvakudi | TVK | thuvakudi | thuvakudi123 | admin@thuvakudi.avinilabs.com |
| 18 | AVINI Labs Avadi | AVD | avadi | avadi123 | admin@avadi.avinilabs.com |

## Access Control Matrix

### Super Admin (MAYILADHUTHURAI)
- **Username**: `mayiladhuthurai`
- **Password**: `super123`
- **Role**: `admin`
- **Permissions**:
  - View all franchise data across the entire system
  - Switch between franchise contexts using the Tenant Switcher
  - Manage all users, inventory, billing, and reports
  - Create and manage franchise accounts
  - System-wide administrative access

### Franchise Admins
- **Role**: `franchise_admin`
- **Permissions**:
  - Access only to their own franchise data
  - Cannot view other franchises' information
  - Manage users within their franchise
  - Handle inventory, billing, and reports for their location only
  - Limited to their tenant scope

## Data Isolation Implementation

### Backend Implementation
1. **Tenant Filtering**: All data queries are filtered by `tenant_id`
2. **Access Control**: `check_tenant_access()` function validates user permissions
3. **Route Protection**: All API endpoints enforce tenant-based access control
4. **Data Creation**: New records automatically inherit the user's `tenant_id`

### Frontend Implementation
1. **Tenant Context**: React context manages current tenant information
2. **Tenant Switcher**: Super admin can switch between franchise views
3. **UI Restrictions**: Interface elements adapt based on user role and tenant access

## Key Features

### 1. Tenant Switching (Super Admin Only)
- Dropdown selector in admin dashboard
- Switch between "All Franchises" view and specific franchise view
- Persistent selection across browser sessions
- Real-time data filtering based on selected tenant

### 2. Data Isolation
- **Inventory**: Each franchise maintains separate inventory
- **Billing**: Franchise-specific billing and invoicing
- **Patients**: Patient records isolated by franchise
- **Reports**: Franchise-specific analytics and reporting

### 3. Role-Based Access Control
- **System Admin**: Full access across all tenants
- **Franchise Admin**: Access limited to own franchise
- **Staff Users**: Inherit franchise limitations from their admin

## Security Features

### 1. Authentication
- JWT-based authentication with role validation
- Password-protected accounts for each franchise
- Session management with automatic logout

### 2. Authorization
- Route-level access control
- API endpoint protection
- Data-level filtering based on tenant access

### 3. Data Protection
- Tenant ID validation on all operations
- Cross-tenant data access prevention
- Audit trails for administrative actions

## Usage Instructions

### For Super Admin (MAYILADHUTHURAI)
1. Login with `mayiladhuthurai` / `super123`
2. Use the Tenant Switcher in the admin dashboard
3. Select "All Franchises" to view aggregated data
4. Select specific franchise to view isolated data
5. All subsequent operations will be scoped to selected tenant

### For Franchise Admins
1. Login with franchise-specific credentials
2. Access is automatically limited to your franchise
3. All data views show only your franchise information
4. Cannot access other franchises' data

## Technical Implementation

### Database Schema
- All data tables include `tenant_id` field
- Foreign key relationships maintain tenant consistency
- Indexes on `tenant_id` for performance optimization

### API Endpoints
- `/api/tenants/accessible` - Get accessible tenants for user
- `/api/tenants/current` - Get current user's tenant
- `/api/admin/switch-tenant/<id>` - Switch tenant context (admin only)

### Frontend Components
- `TenantSwitcher` - Tenant selection component
- `TenantContext` - React context for tenant management
- Enhanced routing with tenant awareness

## Monitoring and Maintenance

### Health Checks
- Verify tenant data isolation
- Monitor cross-tenant access attempts
- Regular audit of user permissions

### Backup Strategy
- Tenant-specific data backups
- Cross-tenant data validation
- Recovery procedures for each franchise

## Support and Troubleshooting

### Common Issues
1. **Access Denied**: Verify user role and tenant assignment
2. **Data Not Visible**: Check tenant context and filtering
3. **Login Issues**: Confirm franchise-specific credentials

### Contact Information
- System Administrator: admin@avinilabs.com
- Technical Support: Available through main hub

## Future Enhancements

### Planned Features
1. Franchise-specific branding and themes
2. Inter-franchise data sharing controls
3. Advanced reporting and analytics
4. Mobile app with franchise isolation
5. API rate limiting per tenant

This multi-tenant franchise management system ensures complete data isolation while providing the main hub with comprehensive oversight capabilities across all AVINI franchise locations.
