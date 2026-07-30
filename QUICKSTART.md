# 🚀 Quick Start Guide - Geo Issue Reporter

## Application is Running! ✅

**Access URL:** http://localhost:8081

---

## 📱 Test the Application

### Step 1: Login as Citizen
1. Open http://localhost:8081
2. Login with:
   - Username: `citizen1`
   - Password: `citizen123`

### Step 2: Report an Issue
1. Click **"Report New Issue"** button
2. Fill in the form:
   ```
   Title: Pothole on Main Street
   Description: Large pothole causing traffic issues
   Category: Pothole
   Priority: HIGH
   ```
3. **Set Location:**
   - Click on the map to set location, OR
   - Click "Use GPS" button to use your current location
4. Optionally upload an image
5. Click **"Submit Report"**

### Step 3: View on Map
1. Click **"View Map"** button
2. See your reported issue with a colored marker
3. Click the marker to see details
4. Click **"View Details"** for full information

### Step 4: Login as Admin
1. Logout (click username → Logout)
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 5: Assign a Worker
1. View the dashboard - you'll see all reported issues
2. Find the issue you just created
3. In the "Assign to" dropdown, select a staff member (e.g., "Staff 1")
4. Click **"Assign"** button
5. Issue status changes to "ASSIGNED"

### Step 6: Update Status
1. Click **"Update Status"** button on the issue
2. Enter new status: `IN_PROGRESS`
3. Add comment: `Working on fixing the pothole`
4. Click OK

### Step 7: Resolve the Issue
1. Click **"Update Status"** again
2. Enter status: `RESOLVED`
3. Add comment: `Pothole has been fixed`
4. Resolution time is automatically recorded!

---

## 🎨 Features to Explore

### Beautiful UI
- ✨ Modern gradient backgrounds
- 🎯 Smooth hover animations
- 📱 Fully responsive design
- 🗺️ Interactive maps with custom markers

### Map Features
- **Color-coded markers** by status:
  - 🟣 Purple = NEW
  - 🟠 Orange = ASSIGNED
  - 🔵 Blue = IN_PROGRESS
  - 🟢 Green = RESOLVED
  - ⚫ Gray = CLOSED
- Click markers for quick preview
- "View Details" for full information modal

### Role-Based Access
- **Citizens**: Report and track their issues
- **Staff**: View all issues, update status
- **Admin**: Everything + assign workers + analytics

---

## 📊 Admin Dashboard

Login as admin to access:
- **Admin Stats** button → View total users and issues
- **Assign workers** to issues
- **Full control** over all issues

---

## 🔐 All Test Accounts

### Admin
- Username: `admin` | Password: `admin123`

### Staff
- Username: `staff1` | Password: `staff123`
- Username: `staff2` | Password: `staff123`
- Username: `staff3` | Password: `staff123`

### Citizens
- Username: `citizen1` | Password: `citizen123`
- Username: `citizen2` | Password: `citizen123`
- Username: `citizen3` | Password: `citizen123`
- Username: `citizen4` | Password: `citizen123`
- Username: `citizen5` | Password: `citizen123`

---

## 🛠️ Development Commands

### Stop the Server
```bash
# Press Ctrl+C in the terminal
```

### Restart the Server
```bash
mvn spring-boot:run
```

### View H2 Database Console
1. Go to: http://localhost:8081/h2-console
2. JDBC URL: `jdbc:h2:mem:geo_issue_db`
3. Username: `sa`
4. Password: (leave empty)

---

## 📝 Sample Issues (Pre-seeded)

The database comes with 20 sample issues already created by the 5 citizens. Each citizen has reported 4 issues around London coordinates.

---

## 🎯 Key Workflows

### Citizen Workflow
1. Login → Report Issue → Track Status → View on Map

### Staff Workflow
1. Login → View Issue Queue → Update Status → Add Comments

### Admin Workflow
1. Login → View All Issues → Assign to Staff → Monitor Progress → View Analytics

---

## 💡 Tips

- **GPS Location**: Allow browser location permissions for "Use GPS" feature
- **Image Upload**: Supports common image formats (JPG, PNG, etc.)
- **Map Navigation**: Zoom in/out, drag to pan, click to select location
- **Status Updates**: Comments are tracked in issue history
- **Responsive**: Try it on mobile/tablet for responsive design

---

## 🐛 Troubleshooting

**Issue: Map not loading**
- Check internet connection (Leaflet uses CDN)
- Clear browser cache and reload

**Issue: Can't upload image**
- Check file size (max 5MB)
- Ensure file is an image format

**Issue: GPS not working**
- Allow location permissions in browser
- Use HTTPS in production (required for GPS)

---

## 🎉 Enjoy Testing!

The application is fully functional with:
- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ GPS-tagged issue reporting
- ✅ Interactive maps with custom markers
- ✅ Worker assignment
- ✅ Status tracking
- ✅ Beautiful modern UI
- ✅ Responsive design

**Happy Testing!** 🚀
