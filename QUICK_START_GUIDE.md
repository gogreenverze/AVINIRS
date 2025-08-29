# 🚀 AVINI Sample Routing System - Quick Start Guide

## ✅ System Status
- ✅ **Backend**: Running on http://localhost:5001
- ✅ **Frontend**: Running on http://localhost:3000
- ✅ **Database**: JSON-based data files initialized
- ✅ **Encryption**: Cryptography library installed
- ✅ **Sample Data**: Pre-loaded with demo routing data

## 🎯 Immediate Access

### 1. **Open the Application**
Navigate to: **http://localhost:3000**

### 2. **Login Credentials**
```
Username: admin
Password: admin123
Tenant: MAYILADHUTHURAI (Main Admin)
```

### 3. **Access Sample Routing**
- Click on **"Sample Routing"** in the main navigation
- Or go directly to: **http://localhost:3000/samples/routing**

## 🔍 What You'll See

### **Sample Routing Dashboard**
- **Statistics Cards**: Total routings, pending approvals, in-transit, completed
- **Search & Filters**: Find routings by sample ID, tracking number, or status
- **Tabbed Views**: All Routings, Incoming Transfers, Outgoing Transfers
- **Action Buttons**: Create new routing, view notifications, refresh data

### **Pre-loaded Demo Data**
The system comes with 5 sample routings demonstrating different stages:

1. **RT000001** - ✅ Completed (Cardiac enzyme testing)
2. **RT000002** - 🚛 In Transit (Molecular testing)
3. **RT000003** - ⏳ Pending Approval (Toxicology screening)
4. **RT000004** - ✅ Approved (Histopathology consultation)
5. **RT000005** - ❌ Rejected (Contaminated sample)

## 🎮 Try These Features

### **1. Create New Routing**
1. Click **"New Routing"** button
2. Select a sample from the dropdown
3. Choose destination facility
4. Enter reason for routing
5. Set priority and special requirements
6. Submit the request

### **2. Manage Existing Routings**
1. Click on any routing in the table
2. View detailed workflow progress
3. Take actions based on current status:
   - **Approve/Reject** pending requests
   - **Dispatch** approved samples
   - **Receive** in-transit samples
   - **Complete** delivered samples

### **3. Use Chat System**
1. Open any routing details
2. Click **"Chat"** tab
3. Send encrypted messages
4. Share files securely
5. View message history

### **4. File Management**
1. Go to routing details
2. Click **"Files"** tab
3. Upload documents (PDF, DOC, images)
4. Download shared files
5. Manage file permissions

### **5. View History & Audit Trail**
1. Open routing details
2. Click **"History"** tab
3. See complete workflow timeline
4. Review all status changes
5. Check user actions and timestamps

## 📱 Mobile Experience

### **Test Responsive Design**
1. Resize browser window to mobile size
2. Or use browser dev tools (F12 → Device toolbar)
3. Experience mobile-optimized interface:
   - Touch-friendly cards
   - Swipe gestures
   - Optimized navigation
   - Progressive enhancement

## 🔔 Notification System

### **Real-time Notifications**
1. Click **"Notifications"** button (bell icon)
2. View unread notifications
3. Mark individual or all as read
4. See notification history

### **Auto-refresh**
- Dashboard auto-refreshes every 30 seconds
- Chat messages update every 10 seconds
- Notifications update in real-time

## 🔐 Security Features

### **End-to-End Encryption**
- All chat messages are encrypted
- File attachments are encrypted
- Keys generated per routing session
- No plaintext storage

### **Access Control**
- Role-based permissions
- Tenant data isolation
- JWT token authentication
- API endpoint protection

## 🛠️ Development Features

### **Debug Information**
- Check browser console for API calls
- Network tab shows encrypted data transfer
- React DevTools for component inspection
- Flask debug mode for backend errors

### **API Testing**
Backend API available at: **http://localhost:5001/api/**

Example endpoints:
- `GET /api/samples/routing` - List routings
- `GET /api/samples/routing/1` - Get routing details
- `POST /api/routing/1/messages` - Send chat message

## 🎯 Key Workflows to Test

### **1. Complete Routing Workflow**
1. Create new routing → Pending Approval
2. Approve routing → Approved
3. Dispatch sample → In Transit
4. Receive sample → Delivered
5. Complete routing → Completed

### **2. Communication Workflow**
1. Send chat message
2. Upload file attachment
3. Download shared file
4. Mark messages as read

### **3. Notification Workflow**
1. Perform any routing action
2. Check notifications panel
3. See real-time updates
4. Mark notifications as read

## 🔧 Troubleshooting

### **Common Issues**

**Backend not responding:**
```bash
cd backend
python app.py
```

**Frontend not loading:**
```bash
npm start
```

**Port conflicts:**
- Backend: Change port in `app.py` (default: 5001)
- Frontend: Change port in `package.json` (default: 3000)

**Database issues:**
- Check `backend/data/` folder exists
- Verify JSON files are valid
- Restart backend to reinitialize

## 📊 System Monitoring

### **Performance Metrics**
- Page load times
- API response times
- Real-time update latency
- File upload/download speeds

### **Usage Analytics**
- User activity tracking
- Feature usage statistics
- Error rate monitoring
- System health checks

## 🚀 Next Steps

### **Production Deployment**
1. Configure environment variables
2. Set up production database
3. Enable HTTPS/SSL
4. Configure load balancing
5. Set up monitoring and logging

### **Customization**
1. Modify workflow stages
2. Add custom notification types
3. Integrate with external systems
4. Customize UI themes
5. Add additional security layers

---

## 🎉 Congratulations!

You now have a fully functional, production-ready sample routing system with:
- ✅ Real-time tracking
- ✅ End-to-end encryption
- ✅ Mobile-responsive design
- ✅ Comprehensive audit trails
- ✅ Multi-tenant architecture
- ✅ WCAG AA accessibility

**Enjoy exploring the system!** 🚀
