# Geo-Tagged Issue Reporting System

A modern, full-stack web application that allows citizens to report civic issues (potholes, streetlight failures, garbage dumps, etc.) with GPS coordinates. Admins can view issues on an interactive map, assign workers, and track resolution status.

## 🚀 Features

### For Citizens
- **Report Issues**: Submit civic issues with GPS-tagged locations
- **Interactive Map**: Click on map or use GPS to tag exact location
- **Photo Upload**: Attach images to issue reports
- **Track Issues**: View status of all reported issues
- **Category Selection**: Choose from predefined categories (Pothole, Streetlight Failure, Garbage Dump, Other)

### For Staff
- **Issue Queue**: View all reported issues
- **Status Updates**: Update issue resolution status
- **Map View**: See all issues plotted on an interactive map

### For Admins
- **Worker Assignment**: Assign staff members to specific issues
- **Dashboard Analytics**: View statistics (total users, total issues)
- **Full Control**: All staff capabilities plus administrative functions
- **Map Overview**: Color-coded markers showing issue status at a glance

## 🛠️ Technology Stack

### Backend
- **Java 17** with **Spring Boot 3.2.0**
- **Spring Security** with JWT authentication
- **Spring Data JPA** for database operations
- **H2 Database** (in-memory, can be switched to MySQL)
- **Lombok** for reducing boilerplate code
- **Maven** for dependency management

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Leaflet.js** for interactive maps
- **Custom CSS** with modern gradients and animations
- **Google Fonts (Inter)** for typography

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
cd /home/seba/Downloads/saravana_jpro
```

### 2. Configure Database (Optional)
The application uses H2 in-memory database by default. To switch to MySQL:

Edit `src/main/resources/application.properties`:
```properties
# Comment out H2 configuration
# spring.datasource.url=jdbc:h2:mem:geo_issue_db;DB_CLOSE_DELAY=-1
# spring.datasource.username=sa
# spring.datasource.password=
# spring.datasource.driver-class-name=org.h2.Driver

# Uncomment MySQL configuration
spring.datasource.url=jdbc:mysql://localhost:3306/geo_issue_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### 3. Build and Run
```bash
mvn clean install
mvn spring-boot:run
```

The application will start on `http://localhost:8081`

## 👥 Default Users

The application comes pre-seeded with test users:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff1`, `staff2`, `staff3` | `staff123` |
| Citizen | `citizen1` to `citizen5` | `citizen123` |

## 🎯 Usage Guide

### Reporting an Issue (Citizen)
1. Login with citizen credentials
2. Click **"Report New Issue"**
3. Fill in the form:
   - Title and description
   - Select category (Pothole, Streetlight Failure, etc.)
   - Set priority level
   - Click on map to set location OR use GPS button
   - Optionally attach an image
4. Submit the report

### Assigning Workers (Admin)
1. Login with admin credentials
2. View all issues on dashboard
3. For each issue, select a staff member from dropdown
4. Click **"Assign"** button
5. Issue status automatically updates to "ASSIGNED"

### Updating Issue Status (Staff/Admin)
1. Login with staff or admin credentials
2. Find the issue on dashboard
3. Click **"Update Status"**
4. Enter new status (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
5. Add a comment describing the update
6. Resolution time is automatically recorded when status is RESOLVED or CLOSED

### Viewing Issues on Map
1. Click **"View Map"** from any dashboard
2. See color-coded markers:
   - 🟣 Purple: NEW
   - 🟠 Orange: ASSIGNED
   - 🔵 Blue: IN_PROGRESS
   - 🟢 Green: RESOLVED
   - ⚫ Gray: CLOSED
3. Click markers to see issue summary
4. Click **"View Details"** for full information

## 🏗️ Project Structure

```
saravana_jpro/
├── src/
│   ├── main/
│   │   ├── java/com/geo/issue/
│   │   │   ├── controller/          # REST API endpoints
│   │   │   │   ├── AdminController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   └── IssueController.java
│   │   │   ├── model/               # JPA entities
│   │   │   │   ├── Issue.java
│   │   │   │   ├── User.java
│   │   │   │   ├── IssueHistory.java
│   │   │   │   └── ...
│   │   │   ├── repository/          # Data access layer
│   │   │   ├── security/            # JWT & Spring Security config
│   │   │   ├── service/             # Business logic
│   │   │   └── GeoIssueApplication.java
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/styles.css   # Modern UI styling
│   │       │   ├── js/app.js        # Frontend logic
│   │       │   └── index.html       # Main HTML
│   │       └── application.properties
│   └── test/
├── pom.xml                          # Maven dependencies
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Issues
- `GET /api/issues` - Get all issues (role-based filtering)
- `GET /api/issues/my` - Get current user's issues
- `POST /api/issues` - Create new issue (multipart/form-data)
- `PUT /api/issues/{id}/status/update` - Update issue status
- `PUT /api/issues/{id}/assign` - Assign issue to staff (Admin only)
- `GET /api/issues/nearby` - Get issues within radius

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/staff` - Get all staff members
- `GET /api/admin/dashboard` - Get dashboard statistics

## 🎨 Design Features

- **Modern Gradients**: Beautiful color gradients throughout the UI
- **Smooth Animations**: Fade-in effects, hover transitions, and micro-interactions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Custom Map Markers**: Color-coded pins based on issue status
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Shadow Hierarchy**: Consistent elevation system for depth
- **Typography**: Inter font family for clean, modern look

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption with BCrypt
- CORS configuration for API security
- Protected endpoints with Spring Security

## 📊 Database Schema

### Users Table
- id, username, password_hash, email, full_name, phone, role, created_at, updated_at

### Issues Table
- id, title, description, category, status, priority, latitude, longitude, image_path, report_time, resolution_time, reporter_id, assigned_to

### Issue History Table
- id, issue_id, changed_by, old_status, new_status, comment, changed_at

## 🚀 Future Enhancements

- [ ] Email notifications for status updates
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native/Flutter)
- [ ] Issue comments and discussions
- [ ] File attachments (PDFs, documents)
- [ ] Geofencing and area-based filtering
- [ ] Export reports to PDF/Excel

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

### Database Connection Issues
- Ensure H2 console is accessible at `/h2-console`
- Check `application.properties` for correct database URL

### Map Not Loading
- Check browser console for JavaScript errors
- Ensure Leaflet CDN is accessible
- Verify GPS permissions in browser

## 📝 License

This project is created for educational purposes.

## 👨‍💻 Developer

Built with ❤️ using Spring Boot and modern web technologies.

---

**Need Help?** Check the logs in the console or contact the development team.
