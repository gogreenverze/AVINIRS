# 🔐 AVINI Sample Routing System - Login Credentials

## 🚀 Quick Access

### **Primary Admin Account**
```
Username: admin
Password: admin123
Role: Super Admin
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Full system access, all franchises
```

### **Alternative Admin Account**
```
Username: mayiladhuthurai
Password: super123
Role: Super Admin
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Full system access, all franchises
```

## 🏢 Franchise Admin Accounts

### **All Franchise Locations**

| **Location** | **Username** | **Password** | **Tenant ID** | **Role** |
|--------------|--------------|--------------|---------------|----------|
| Sirkazhi | `sirkazhi` | `sirkazhi123` | 2 | Franchise Admin |
| Thanjavur | `thanjavur` | `thanjavur123` | 3 | Franchise Admin |
| Kuthalam | `kuthalam` | `kuthalam123` | 4 | Franchise Admin |
| Aduthurai | `aduthurai` | `aduthurai123` | 5 | Franchise Admin |
| Thiruppanandal | `thiruppanandal` | `thiruppanandal123` | 6 | Franchise Admin |
| Eravancherry | `eravancherry` | `eravancherry123` | 7 | Franchise Admin |
| Nachiyarkovil | `nachiyarkovil` | `nachiyarkovil123` | 8 | Franchise Admin |
| My Kidney Care | `mykidneycare` | `mykidneycare123` | 9 | Franchise Admin |
| Velan Clinic | `velanclinic` | `velanclinic123` | 10 | Franchise Admin |
| Swamimalai | `swamimalai` | `swamimalai123` | 11 | Franchise Admin |
| Pandhanallur | `pandhanallur` | `pandhanallur123` | 12 | Franchise Admin |
| Kumbakonam | `kumbakonam` | `kumbakonam123` | 13 | Franchise Admin |
| Mannargudi | `mannargudi` | `mannargudi123` | 14 | Franchise Admin |
| Thirukkattupalli | `thirukkattupalli` | `thirukkattupalli123` | 15 | Franchise Admin |
| Sembanarkovil | `sembanarkovil` | `sembanarkovil123` | 16 | Franchise Admin |
| Thuvakudi | `thuvakudi` | `thuvakudi123` | 17 | Franchise Admin |
| Avadi | `avadi` | `avadi123` | 18 | Franchise Admin |

## 👥 Staff Accounts

### **Lab Staff**
```
Username: lab_tech1
Password: tech123
Role: Lab Technician
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Sample processing, basic routing
```

```
Username: lab_tech2
Password: tech123
Role: Lab Technician
Tenant: Sirkazhi
Access: Sample processing, basic routing
```

### **Management**
```
Username: manager1
Password: manager123
Role: Lab Manager
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Lab operations, routing approval
```

### **Reception Staff**
```
Username: receptionist1
Password: reception123
Role: Receptionist
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Patient registration, sample intake
```

### **Medical Staff**
```
Username: doctor1
Password: doctor123
Role: Doctor
Tenant: MAYILADHUTHURAI (Main Lab)
Access: Patient consultation, test ordering
```

```
Username: pathologist1
Password: pathologist123
Role: Pathologist
Tenant: Kumbakonam
Access: Result interpretation, specialized testing
```

## 🎯 Role-Based Access Control

### **Super Admin (admin/mayiladhuthurai)**
- ✅ Full system access
- ✅ All franchise data visibility
- ✅ User management
- ✅ System configuration
- ✅ Create/approve/reject all routings
- ✅ Access all chat conversations
- ✅ Download all files
- ✅ View all notifications
- ✅ System administration

### **Franchise Admin**
- ✅ Own franchise data access
- ✅ Create outgoing routing requests
- ✅ Approve/reject incoming requests
- ✅ Manage franchise users
- ✅ Access franchise-specific chats
- ✅ Upload/download franchise files
- ✅ View franchise notifications
- ❌ Cannot access other franchise data

### **Lab Manager**
- ✅ Lab operations management
- ✅ Routing approval within franchise
- ✅ Staff supervision
- ✅ Quality control
- ✅ Sample tracking
- ❌ Limited user management

### **Lab Technician**
- ✅ Sample processing
- ✅ Basic routing operations
- ✅ Chat communication
- ✅ File uploads
- ❌ Cannot approve routings
- ❌ Limited administrative access

### **Doctor/Pathologist**
- ✅ Medical consultation
- ✅ Test result interpretation
- ✅ Specialized routing requests
- ✅ Medical file access
- ❌ Limited administrative functions

### **Receptionist**
- ✅ Patient registration
- ✅ Sample intake
- ✅ Basic routing tracking
- ✅ Customer communication
- ❌ Cannot approve routings
- ❌ Limited system access

## 🔒 Security Features

### **Password Policy**
- Minimum 6 characters
- Alphanumeric combinations
- Regular password updates recommended
- Account lockout after failed attempts

### **Session Management**
- JWT token-based authentication
- Automatic session timeout
- Secure token storage
- Multi-device login support

### **Data Isolation**
- Tenant-based data separation
- Role-based access control
- Encrypted communication
- Audit trail logging

## 🚀 Quick Login Guide

### **Step 1: Access Application**
Navigate to: **http://localhost:3000**

### **Step 2: Choose Account Type**

**For Full System Access:**
- Username: `admin`
- Password: `admin123`

**For Franchise Testing:**
- Choose any franchise username (e.g., `thanjavur`)
- Use corresponding password (e.g., `thanjavur123`)

**For Role Testing:**
- Lab Tech: `lab_tech1` / `tech123`
- Manager: `manager1` / `manager123`
- Doctor: `doctor1` / `doctor123`

### **Step 3: Navigate to Sample Routing**
- Click "Sample Routing" in navigation
- Or go to: **http://localhost:3000/samples/routing**

## 🎮 Testing Scenarios

### **Scenario 1: Admin Workflow**
1. Login as `admin` / `admin123`
2. View all franchise routings
3. Create routing between any franchises
4. Approve/reject any requests
5. Access all chat conversations

### **Scenario 2: Franchise Workflow**
1. Login as `thanjavur` / `thanjavur123`
2. View only Thanjavur-related routings
3. Create outgoing routing to another franchise
4. Approve incoming requests to Thanjavur
5. Chat with routing participants

### **Scenario 3: Multi-User Testing**
1. Open multiple browser windows/tabs
2. Login with different accounts
3. Create routing from one franchise
4. Switch to destination franchise account
5. Approve/reject the routing
6. Test real-time chat between users

### **Scenario 4: Role-Based Testing**
1. Login as `lab_tech1` / `tech123`
2. Try to access admin functions (should be restricted)
3. Process samples and basic routing
4. Switch to `manager1` / `manager123`
5. Test manager-level approvals

## 🔧 Troubleshooting

### **Login Issues**

**"Invalid credentials" error:**
- Check username/password spelling
- Ensure caps lock is off
- Try alternative admin account

**"User not found" error:**
- Verify username exists in list above
- Check for typos in username
- Try `admin` / `admin123` as fallback

**"Access denied" error:**
- User account may be inactive
- Check role permissions
- Contact system administrator

### **Session Issues**

**Automatic logout:**
- Session timeout (normal behavior)
- Re-login with same credentials
- Check browser cookies enabled

**Permission errors:**
- Role-based restrictions (normal)
- Switch to appropriate user account
- Contact admin for role changes

## 📞 Support

### **For Development/Testing**
- All accounts are active and ready to use
- No email verification required
- Passwords are simple for testing purposes

### **For Production Deployment**
- Change all default passwords
- Implement strong password policy
- Enable multi-factor authentication
- Regular security audits

---

## 🎉 Ready to Test!

You now have complete access to the AVINI Sample Routing System with:
- ✅ **18 Franchise Locations** with admin accounts
- ✅ **Multiple User Roles** for comprehensive testing
- ✅ **Role-Based Access Control** for security
- ✅ **Multi-Tenant Architecture** for data isolation

**Start with the admin account for full system exploration!** 🚀
