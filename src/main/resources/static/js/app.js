// Geo-Issue Reporter - Complete Working Version with All Pages Connected
const API_URL = '/api';

const store = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    setAuth: function (token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        updateNav();
    },
    logout: function () {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateNav();
        router.navigate('login');
    }
};

async function api(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = {};
    if (store.token) headers['Authorization'] = 'Bearer ' + store.token;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const config = { method, headers };
    if (body) config.body = isFormData ? body : JSON.stringify(body);
    if (isFormData) delete headers['Content-Type'];
    const response = await fetch(API_URL + endpoint, config);
    // Don't auto-logout on 401 for auth endpoints (login/register)
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        store.logout();
        return Promise.reject('Session expired. Please login again.');
    }
    if (!response.ok) {
        const text = await response.text();
        const error = new Error(text || response.statusText);
        error.status = response.status;
        throw error;
    }
    try { return await response.json(); } catch (e) { return null; }
}

const router = {
    navigate: function(page) {
        if (window.location.hash === '#' + page) {
            // Hash didn't change, manually trigger route
            handleRoute();
        } else {
            window.location.hash = page;
        }
    }
};

function updateNav() {
    const nav = document.getElementById('nav-links');
    const currentPage = window.location.hash.slice(1) || 'login';
    if (store.user) {
        const isAdmin = store.user.roles.includes('ROLE_ADMIN');
        const isCitizen = store.user.roles.includes('ROLE_CITIZEN');
        const isStaff = store.user.roles.includes('ROLE_STAFF');
        let links = '<a href="#dashboard" class="nav-link' + (currentPage === 'dashboard' ? ' active' : '') + '">Dashboard</a>';
        if (isCitizen) links += '<a href="#report" class="nav-link' + (currentPage === 'report' ? ' active' : '') + '">Report Issue</a>';
        if (isStaff) links += '<a href="#assigned" class="nav-link' + (currentPage === 'assigned' ? ' active' : '') + '">My Tasks</a>';
        links += '<a href="#map" class="nav-link' + (currentPage === 'map' ? ' active' : '') + '">Map</a>';
        if (isAdmin) links += '<a href="#admin" class="nav-link' + (currentPage === 'admin' ? ' active' : '') + '">Admin Panel</a>';
        links += '<a href="#profile" class="nav-link' + (currentPage === 'profile' ? ' active' : '') + '">Profile</a>';
        nav.innerHTML = '<span style="margin-right:1rem;">Welcome, ' + store.user.username + ' (' + store.user.roles[0].replace('ROLE_','') + ')</span>' + links + '<button class="btn btn-sm btn-danger" onclick="store.logout()" style="margin-left:1rem;">Logout</button>';
    } else {
        nav.innerHTML = '<a href="#login" class="nav-link' + (currentPage === 'login' ? ' active' : '') + '">Login</a><a href="#register" class="nav-link' + (currentPage === 'register' ? ' active' : '') + '">Register</a>';
    }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => {
    updateNav();
    if (store.user && store.token && (!window.location.hash || window.location.hash === '#' || window.location.hash === '#login')) {
        router.navigate('dashboard');
    } else {
        handleRoute();
    }
});

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'login';
    const page = hash.split('/')[0]; // support #issue/123 style routes
    if (!store.user && page !== 'login' && page !== 'register') return router.navigate('login');
    updateNav();
    switch (page) {
        case 'login': renderLogin(); break;
        case 'register': renderRegister(); break;
        case 'dashboard': renderDashboard(); break;
        case 'report': renderReport(); break;
        case 'map': renderMap(); break;
        case 'admin': renderAdmin(); break;
        case 'issue': renderIssueDetail(hash.split('/')[1]); break;
        case 'assigned': renderAssigned(); break;
        case 'profile': renderProfile(); break;
        default: store.user ? renderDashboard() : renderLogin();
    }
}

function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card" style="max-width:450px;margin:2rem auto;">'
        + '<h2>Login</h2>'
        + '<form id="login-form">'
        + '<div class="form-group"><label>Username</label><input type="text" name="username" required placeholder="Enter username"></div>'
        + '<div class="form-group"><label>Password</label><input type="password" name="password" required placeholder="Enter password"></div>'
        + '<button type="submit" class="btn btn-primary" style="width:100%;">Login</button>'
        + '</form>'
        + '<p style="margin-top:1rem;">Don\'t have an account? <a href="#register">Register</a></p>'
        + '<div id="login-error" style="display:none;margin-top:1rem;padding:0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:0.9rem;"></div>'
        + '</div>';

    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type=submit]');
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        try {
            const res = await api('/auth/login', 'POST', Object.fromEntries(new FormData(e.target)));
            if (!res || !res.token) {
                throw new Error('Invalid server response. Please try again.');
            }
            console.log('Login successful for:', res.username);
            store.setAuth(res.token, { id: res.id, username: res.username, roles: res.roles });
            router.navigate('dashboard');
        } catch (err) {
            var msg = (err.message || String(err));
            // Try to parse JSON error body from server
            try { var parsed = JSON.parse(msg); if (parsed.message) msg = parsed.message; } catch(e) {}
            // Friendly messages for common errors
            if (err.status === 401 || msg.toLowerCase().includes('bad credentials') || msg.toLowerCase().includes('unauthorized')) {
                msg = 'Invalid username or password. Please try again.';
                errorDiv.style.background = '#fef2f2';
                errorDiv.style.borderColor = '#fecaca';
                errorDiv.style.color = '#dc2626';
            } else if (err.status === 403 || msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval')) {
                errorDiv.style.background = '#fef3c7';
                errorDiv.style.borderColor = '#fcd34d';
                errorDiv.style.color = '#92400e';
            } else {
                errorDiv.style.background = '#fef2f2';
                errorDiv.style.borderColor = '#fecaca';
                errorDiv.style.color = '#dc2626';
            }
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    };
}

function renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card" style="max-width:450px;margin:2rem auto;">'
        + '<h2>Register</h2>'
        + '<form id="register-form">'
        + '<div class="form-group"><label>Full Name</label><input type="text" name="fullName" required placeholder="Enter full name"></div>'
        + '<div class="form-group"><label>Username</label><input type="text" name="username" required placeholder="Choose a username"></div>'
        + '<div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="Enter email"></div>'
        + '<div class="form-group"><label>Password</label><input type="password" name="password" required minlength="6" placeholder="Min 6 characters"></div>'
        + '<div class="form-group"><label>Role</label><select name="role"><option value="citizen">Citizen</option><option value="staff">Staff</option></select></div>'
        + '<button type="submit" class="btn btn-primary" style="width:100%;">Register</button>'
        + '</form>'
        + '<p style="margin-top:1rem;">Already have an account? <a href="#login">Login</a></p>'
        + '<div id="register-msg" style="display:none;margin-top:1rem;padding:0.75rem;border-radius:8px;font-size:0.9rem;"></div>'
        + '</div>';

    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.role = [data.role];
        const btn = e.target.querySelector('button[type=submit]');
        const msgDiv = document.getElementById('register-msg');
        btn.disabled = true;
        btn.textContent = 'Registering...';
        try {
            await api('/auth/register', 'POST', data);
            msgDiv.style.display = 'block';
            msgDiv.style.background = '#d1fae5';
            msgDiv.style.border = '1px solid #6ee7b7';
            msgDiv.style.color = '#065f46';
            msgDiv.textContent = 'Registration submitted! Your account is pending admin approval.';
            setTimeout(() => router.navigate('login'), 2500);
        } catch (err) {
            msgDiv.style.display = 'block';
            msgDiv.style.background = '#fef2f2';
            msgDiv.style.border = '1px solid #fecaca';
            msgDiv.style.color = '#dc2626';
            msgDiv.textContent = 'Registration failed: ' + (err.message || err);
            btn.disabled = false;
            btn.textContent = 'Register';
        }
    };
}

async function renderDashboard() {
    if (!store.user) return router.navigate('login');
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card"><h2>Dashboard</h2><p>Loading...</p></div>';
    const isCitizen = store.user.roles.includes('ROLE_CITIZEN');
    const isAdmin = store.user.roles.includes('ROLE_ADMIN');
    const isStaff = store.user.roles.includes('ROLE_STAFF');

    let staffList = [];
    if (isAdmin) {
        try { staffList = await api('/admin/staff'); } catch (e) { console.error("Failed to load staff", e); }
    }

    app.innerHTML = '<div class="card"><h2>Dashboard</h2><div class="nav-buttons" style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">'
        + (isCitizen ? '<button class="btn btn-primary" onclick="router.navigate(\'report\')">+ Report New Issue</button>' : '')
        + (isStaff ? '<button class="btn btn-warning" onclick="router.navigate(\'assigned\')">My Assigned Tasks</button>' : '')
        + (isAdmin ? '<button class="btn btn-warning" onclick="router.navigate(\'admin\')">Admin Panel</button>' : '')
        + '<button class="btn btn-success" onclick="router.navigate(\'map\')">View Map</button>'
        + '</div><h3>' + (isCitizen ? 'My Reported Issues' : 'Issue Queue (All)') + '</h3><div id="issues-list" class="dashboard-grid">Loading...</div></div>';

    try {
        const issues = await api(isCitizen ? '/issues/my' : '/issues');
        const list = document.getElementById('issues-list');
        if (!issues || issues.length === 0) return list.innerHTML = '<p>No issues found.</p>';

        list.innerHTML = issues.map(issue => {
            let assignUI = '';
            if (isAdmin && (issue.status === 'NEW' || issue.status === 'ASSIGNED')) {
                const options = staffList.map(s => '<option value="' + s.id + '" ' + (issue.assignedTo && issue.assignedTo.id === s.id ? 'selected' : '') + '>' + s.fullName + '</option>').join('');
                assignUI = '<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #eee;"><label style="font-size:0.9rem;font-weight:600;">Assign to:</label><div style="display:flex;gap:0.5rem;margin-top:0.25rem;"><select id="staff-select-' + issue.id + '" style="flex:1;padding:0.5rem;border:2px solid #e2e8f0;border-radius:6px;"><option value="">Select Staff</option>' + options + '</select><button class="btn btn-sm btn-primary" onclick="assignIssue(' + issue.id + ')">Assign</button></div></div>';
            } else if (issue.assignedTo) {
                assignUI = '<div style="margin-top:0.5rem;font-size:0.85rem;color:#64748b;">\uD83D\uDC64 Assigned to: <strong>' + issue.assignedTo.fullName + '</strong></div>';
            }

            return '<div class="issue-card clickable" onclick="router.navigate(\'issue/' + issue.id + '\')">'
                + (issue.imagePath ? '<img src="' + issue.imagePath + '" alt="Issue">' : '')
                + '<h4>' + issue.title + '</h4>'
                + '<p>' + issue.description + '</p>'
                + '<div style="margin-top:0.5rem">'
                + '<span class="status-badge status-' + issue.status + '">' + issue.status + '</span>'
                + '<span class="status-badge" style="background:#ddd;color:#333">' + issue.priority + '</span>'
                + '<span class="status-badge" style="background:#ddd;color:#333">' + (issue.category || 'N/A') + '</span>'
                + '</div>'
                + (issue.latitude && issue.longitude ? '<div style="margin-top:0.5rem;font-size:0.85rem;color:#64748b;">\uD83D\uDCCD ' + issue.latitude.toFixed(4) + ', ' + issue.longitude.toFixed(4) + '</div>' : '')
                + assignUI
                + '<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;" onclick="event.stopPropagation();">'
                + (issue.latitude && issue.longitude ? '<button class="btn btn-sm btn-success" onclick="viewIssueOnMap(' + issue.id + ',' + issue.latitude + ',' + issue.longitude + ',\'' + issue.title.replace(/'/g, "\\'") + '\')" style="flex:1;">\uD83D\uDDFA\uFE0F View on Map</button>' : '')
                + ((isStaff || isAdmin) ? '<button class="btn btn-sm btn-primary" onclick="updateIssueStatus(' + issue.id + ')" style="flex:1;">Update Status</button>' : '')
                + '<button class="btn btn-sm" style="flex:1;background:#e2e8f0;color:#334155;" onclick="router.navigate(\'issue/' + issue.id + '\')">View Details</button>'
                + '</div></div>';
        }).join('');
    } catch (err) {
        document.getElementById('issues-list').innerHTML = '<p>Error loading issues.</p>';
    }
}

async function assignIssue(issueId) {
    const select = document.getElementById('staff-select-' + issueId);
    const staffId = select.value;
    if (!staffId) return alert("⚠️ Please select a staff member");
    try {
        await api('/issues/' + issueId + '/assign?staffId=' + staffId, 'PUT');
        alert("✅ Worker assigned successfully!");
        renderDashboard();
    } catch (err) {
        alert("❌ Failed to assign: " + err.message);
    }
}

async function updateIssueStatus(id) {
    const status = prompt("Enter new status (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED):");
    if (!status) return;
    const comment = prompt("Enter comment:");
    try {
        await api('/issues/' + id + '/status/update?status=' + status + '&comment=' + encodeURIComponent(comment || ''), 'PUT');
        alert("✅ Status updated");
        renderDashboard();
    } catch (err) {
        alert("❌ Update failed: " + err.message);
    }
}

window.viewIssueOnMap = (id, lat, lng, title) => {
    sessionStorage.setItem('focusIssue', JSON.stringify({ id, lat, lng, title: title || 'Issue #' + id }));
    router.navigate('map');
};

async function renderAdmin() {
    if (!store.user || !store.user.roles.includes('ROLE_ADMIN')) return router.navigate('dashboard');
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card">'
        + '<h2>Admin Panel</h2>'
        + '<div style="margin-bottom:1.5rem;"><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Back to Dashboard</button></div>'
        + '<div id="stats" class="dashboard-grid">Loading stats...</div>'
        + '<h3 style="margin-top:2rem;color:#f59e0b;">\u23F3 Pending Approvals</h3>'
        + '<div id="pending-list" class="dashboard-grid">Loading...</div>'
        + '<h3 style="margin-top:2rem;">All Approved Users</h3>'
        + '<div id="users-list" class="dashboard-grid">Loading users...</div>'
        + '</div>';

    // Load stats
    try {
        var stats = await api('/admin/dashboard');
        document.getElementById('stats').innerHTML = ''
            + '<div class="issue-card" style="text-align:center;"><h3 style="font-size:2.5rem;color:#667eea;">'+stats.totalUsers+'</h3><p style="font-weight:600;color:#64748b;">Total Users</p></div>'
            + '<div class="issue-card" style="text-align:center;"><h3 style="font-size:2.5rem;color:#f5576c;">'+stats.totalIssues+'</h3><p style="font-weight:600;color:#64748b;">Total Issues</p></div>'
            + '<div class="issue-card" style="text-align:center;"><h3 style="font-size:2.5rem;color:#f59e0b;">'+stats.pendingApprovals+'</h3><p style="font-weight:600;color:#64748b;">Pending Approvals</p></div>';
    } catch (err) {
        document.getElementById('stats').innerHTML = '<p style="color:#dc2626;">Failed to load stats</p>';
    }

    // Load pending users
    try {
        var pending = await api('/admin/pending');
        var pendingDiv = document.getElementById('pending-list');
        if (!pending || pending.length === 0) {
            pendingDiv.innerHTML = '<p style="color:#64748b;padding:1rem;">No pending approvals.</p>';
        } else {
            pendingDiv.innerHTML = pending.map(function(u) {
                return '<div class="issue-card" style="border-left:4px solid #f59e0b;">'
                    + '<h4>' + u.fullName + '</h4>'
                    + '<p style="margin:0.25rem 0;">Username: <strong>' + u.username + '</strong></p>'
                    + '<p style="margin:0.25rem 0;">Email: ' + (u.email||'N/A') + '</p>'
                    + '<span class="status-badge" style="background:' + (u.role==='STAFF'?'#f59e0b':'#10b981') + ';">' + u.role + '</span>'
                    + '<div style="margin-top:1rem;display:flex;gap:0.5rem;">'
                    + '<button class="btn btn-sm btn-success" onclick="approveUser('+u.id+')">\u2705 Approve</button>'
                    + '<button class="btn btn-sm btn-danger" onclick="rejectUser('+u.id+')">\u274C Reject</button>'
                    + '</div></div>';
            }).join('');
        }
    } catch (err) {
        document.getElementById('pending-list').innerHTML = '<p style="color:#dc2626;">Failed to load pending users</p>';
    }

    // Load approved users
    try {
        var users = await api('/admin/users');
        var approvedUsers = users.filter(function(u) { return u.approved; });
        var usersList = document.getElementById('users-list');
        if (!approvedUsers || approvedUsers.length === 0) {
            usersList.innerHTML = '<p>No approved users.</p>';
        } else {
            usersList.innerHTML = approvedUsers.map(function(u) {
                return '<div class="issue-card">'
                    + '<h4>' + u.fullName + '</h4>'
                    + '<p style="margin:0.25rem 0;">Username: <strong>' + u.username + '</strong></p>'
                    + '<p style="margin:0.25rem 0;">Email: ' + (u.email||'N/A') + '</p>'
                    + '<span class="status-badge" style="background:' + (u.role==='ADMIN'?'#ef4444':u.role==='STAFF'?'#f59e0b':'#10b981') + ';">' + u.role + '</span>'
                    + (u.role !== 'ADMIN' ? '<div style="margin-top:0.75rem;"><button class="btn btn-sm btn-danger" onclick="deleteUser('+u.id+')">Delete</button></div>' : '')
                    + '</div>';
            }).join('');
        }
    } catch (err) {
        document.getElementById('users-list').innerHTML = '<p style="color:#dc2626;">Failed to load users</p>';
    }
}

async function approveUser(id) {
    if (!confirm('Approve this user?')) return;
    try {
        await api('/admin/users/' + id + '/approve', 'PUT');
        alert('\u2705 User approved!');
        renderAdmin();
    } catch (err) { alert('\u274C Failed: ' + (err.message||err)); }
}

async function rejectUser(id) {
    if (!confirm('Reject and remove this user?')) return;
    try {
        await api('/admin/users/' + id + '/reject', 'PUT');
        alert('\u2705 User rejected and removed.');
        renderAdmin();
    } catch (err) { alert('\u274C Failed: ' + (err.message||err)); }
}

async function deleteUser(id) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        await api('/admin/users/' + id, 'DELETE');
        alert('\u2705 User deleted.');
        renderAdmin();
    } catch (err) { alert('\u274C Failed: ' + (err.message||err)); }
}

function renderReport() {
    if (!store.user) return router.navigate('login');
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card"><h2>Report New Issue</h2><div style="margin-bottom:1.5rem;"><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">&larr; Back to Dashboard</button></div><form id="report-form"><div class="form-group"><label>Title</label><input type="text" name="title" required placeholder="Brief title for the issue"></div><div class="form-group"><label>Description</label><textarea name="description" required rows="3" placeholder="Describe the issue in detail"></textarea></div><div class="form-group"><label>Category</label><select name="category"><option value="Pothole">Pothole</option><option value="Streetlight Failure">Streetlight Failure</option><option value="Garbage Dump">Garbage Dump</option><option value="Water Leak">Water Leak</option><option value="Road Damage">Road Damage</option><option value="Other">Other</option></select></div><div class="form-group"><label>Priority</label><select name="priority"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option></select></div><div class="form-group"><label>Location</label><button type="button" id="btn-use-current" class="btn btn-success" style="width:100%;margin-bottom:0.5rem;">📌 Use Current Location (GPS)</button><div id="report-map" style="height:300px;border:2px solid #e2e8f0;border-radius:8px;"></div><input type="hidden" name="latitude" id="lat" required><input type="hidden" name="longitude" id="lng" required><p id="loc-status" style="margin-top:0.5rem;padding:0.5rem;background:#f0f9ff;border-radius:6px;font-size:0.9rem;"><strong>📍 Location:</strong> Click on map or use GPS button above</p></div><div class="form-group"><label>Image (Optional)</label><input type="file" name="image" accept="image/*"></div><button type="submit" class="btn btn-primary" style="width:100%;">Submit Report</button></form></div>';

    const map = L.map('report-map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    let marker;

    function setLocation(lat, lng) {
        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map).bindPopup('<b>Issue Location</b>').openPopup();
        document.getElementById('loc-status').innerHTML = '<strong>✅ Location Set:</strong> ' + lat.toFixed(6) + ', ' + lng.toFixed(6);
        document.getElementById('loc-status').style.background = '#d1fae5';
    }

    map.on('click', (e) => setLocation(e.latlng.lat, e.latlng.lng));

    document.getElementById('btn-use-current').onclick = function () {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        this.innerHTML = '⏳ Getting location...';
        this.disabled = true;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation(pos.coords.latitude, pos.coords.longitude);
                map.setView([pos.coords.latitude, pos.coords.longitude], 16);
                this.innerHTML = '✅ Location Set';
                setTimeout(() => { this.innerHTML = '📌 Use Current Location'; this.disabled = false; }, 2000);
            },
            (err) => {
                alert('Unable to get location: ' + err.message);
                this.innerHTML = '📌 Use Current Location';
                this.disabled = false;
            },
            { enableHighAccuracy: true }
        );
    };

    document.getElementById('report-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        if (!formData.get('latitude') || !formData.get('longitude')) return alert('Please set a location');
        try {
            await api('/issues', 'POST', formData, true);
            alert('✅ Issue reported successfully!');
            router.navigate('dashboard');
        } catch (err) {
            alert('❌ Failed to report: ' + err.message);
        }
    };

    setTimeout(() => map.invalidateSize(), 100);
}

async function renderMap() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card"><h2>Issue Map</h2>'
        + '<div class="breadcrumb"><a href="#dashboard">\u2190 Dashboard</a> / <span>Map View</span></div>'
        + '<div id="map-view" style="height:500px;border-radius:8px;border:2px solid #e2e8f0;"></div>'
        + '<div id="map-legend" style="margin-top:1rem;padding:1rem;background:#f8fafc;border-radius:8px;display:flex;gap:1rem;flex-wrap:wrap;">'
        + '<strong>Legend:</strong> '
        + '<span><span class="status-badge status-NEW">NEW</span></span>'
        + '<span><span class="status-badge status-ASSIGNED">ASSIGNED</span></span>'
        + '<span><span class="status-badge status-IN_PROGRESS">IN PROGRESS</span></span>'
        + '<span><span class="status-badge status-RESOLVED">RESOLVED</span></span>'
        + '<span><span class="status-badge status-CLOSED">CLOSED</span></span>'
        + '</div></div>';

    // Check if we should focus on a specific issue
    let focusData = null;
    try {
        const raw = sessionStorage.getItem('focusIssue');
        if (raw) {
            focusData = JSON.parse(raw);
            sessionStorage.removeItem('focusIssue');
        }
    } catch(e) {}

    const defaultCenter = focusData ? [focusData.lat, focusData.lng] : [51.505, -0.09];
    const defaultZoom = focusData ? 17 : 13;

    const map = L.map('map-view').setView(defaultCenter, defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '\u00A9 OpenStreetMap' }).addTo(map);

    // Try to center on user's location if no focus
    if (!focusData && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 14),
            () => {}, { enableHighAccuracy: false, timeout: 5000 }
        );
    }

    const statusColors = {
        'NEW': '#667eea', 'ASSIGNED': '#f59e0b', 'IN_PROGRESS': '#3b82f6',
        'RESOLVED': '#10b981', 'CLOSED': '#6b7280'
    };

    try {
        const issues = await api('/issues');
        issues.forEach(issue => {
            if (issue.latitude && issue.longitude) {
                const color = statusColors[issue.status] || '#667eea';
                const isFocused = focusData && focusData.id === issue.id;

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background:' + color + ';width:' + (isFocused ? '20' : '14') + 'px;height:' + (isFocused ? '20' : '14') + 'px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);' + (isFocused ? 'animation:pulse-animation 1.5s ease-out infinite;' : '') + '"></div>',
                    iconSize: [isFocused ? 26 : 20, isFocused ? 26 : 20],
                    iconAnchor: [isFocused ? 13 : 10, isFocused ? 13 : 10]
                });

                const marker = L.marker([issue.latitude, issue.longitude], { icon })
                    .addTo(map)
                    .bindPopup(
                        '<div style="min-width:200px;">'
                        + '<h4 style="margin:0 0 0.5rem 0;">' + issue.title + '</h4>'
                        + '<p style="margin:0 0 0.5rem 0;color:#64748b;font-size:0.9rem;">' + issue.description + '</p>'
                        + '<span class="status-badge status-' + issue.status + '">' + issue.status + '</span>'
                        + '<span class="status-badge" style="background:#ddd;color:#333">' + (issue.category || 'N/A') + '</span>'
                        + (issue.reporter ? '<div style="margin-top:0.5rem;font-size:0.85rem;color:#64748b;">Reported by: ' + issue.reporter.fullName + '</div>' : '')
                        + '<div style="margin-top:0.75rem;"><a href="#issue/' + issue.id + '" style="color:#667eea;font-weight:600;text-decoration:none;">View Details \u2192</a></div>'
                        + '</div>'
                    );

                if (isFocused) {
                    marker.openPopup();
                }
            }
        });
    } catch (err) { console.error(err); }

    setTimeout(() => map.invalidateSize(), 100);
}

// === Issue Detail Page ===
async function renderIssueDetail(issueId) {
    if (!store.user) return router.navigate('login');
    if (!issueId) return router.navigate('dashboard');
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card"><h2>Issue Details</h2><p>Loading...</p></div>';

    const isAdmin = store.user.roles.includes('ROLE_ADMIN');
    const isStaff = store.user.roles.includes('ROLE_STAFF');

    try {
        const [issue, history] = await Promise.all([
            api('/issues/' + issueId),
            api('/issues/' + issueId + '/history')
        ]);

        if (!issue) return app.innerHTML = '<div class="card"><h2>Issue Not Found</h2><p>This issue does not exist.</p><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Back</button></div>';

        const reportedDate = issue.reportTime ? new Date(issue.reportTime).toLocaleString() : 'Unknown';
        const resolvedDate = issue.resolutionTime ? new Date(issue.resolutionTime).toLocaleString() : null;

        let historyHTML = '<p style="color:#64748b;">No history available.</p>';
        if (history && history.length > 0) {
            historyHTML = '<div class="timeline">' + history.map(h => {
                const date = h.changedAt ? new Date(h.changedAt).toLocaleString() : '';
                return '<div class="timeline-item">'
                    + '<div class="timeline-dot"></div>'
                    + '<div class="timeline-content">'
                    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">'
                    + '<strong>' + (h.changedBy ? h.changedBy.fullName : 'System') + '</strong>'
                    + '<span style="font-size:0.8rem;color:#94a3b8;">' + date + '</span>'
                    + '</div>'
                    + (h.oldStatus ? '<div style="margin:0.25rem 0;"><span class="status-badge status-' + h.oldStatus + '" style="font-size:0.7rem;">' + h.oldStatus + '</span> \u2192 <span class="status-badge status-' + h.newStatus + '" style="font-size:0.7rem;">' + h.newStatus + '</span></div>' : '<span class="status-badge status-' + h.newStatus + '" style="font-size:0.7rem;">' + h.newStatus + '</span>')
                    + (h.comment ? '<p style="margin:0.25rem 0;color:#64748b;font-size:0.9rem;">' + h.comment + '</p>' : '')
                    + '</div></div>';
            }).join('') + '</div>';
        }

        app.innerHTML = '<div class="card">'
            + '<div class="breadcrumb"><a href="#dashboard">\u2190 Dashboard</a> / <span>Issue #' + issue.id + '</span></div>'
            + '<h2>' + issue.title + '</h2>'
            + '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;">'
            + '<span class="status-badge status-' + issue.status + '">' + issue.status + '</span>'
            + '<span class="status-badge" style="background:#ddd;color:#333">' + issue.priority + '</span>'
            + '<span class="status-badge" style="background:#ddd;color:#333">' + (issue.category || 'N/A') + '</span>'
            + '</div>'
            + (issue.imagePath ? '<div style="margin-bottom:1.5rem;"><img src="' + issue.imagePath + '" alt="Issue Photo" style="max-width:100%;max-height:400px;border-radius:12px;box-shadow:var(--shadow-md);object-fit:cover;"></div>' : '')
            + '<div class="detail-grid">'
            + '<div class="detail-section">'
            + '<h3>Description</h3>'
            + '<p>' + issue.description + '</p>'
            + '<div class="detail-row"><strong>Reported by:</strong> ' + (issue.reporter ? issue.reporter.fullName : 'Unknown') + '</div>'
            + '<div class="detail-row"><strong>Reported on:</strong> ' + reportedDate + '</div>'
            + (issue.assignedTo ? '<div class="detail-row"><strong>Assigned to:</strong> ' + issue.assignedTo.fullName + '</div>' : '')
            + (resolvedDate ? '<div class="detail-row"><strong>Resolved on:</strong> ' + resolvedDate + '</div>' : '')
            + '</div>'
            + (issue.latitude && issue.longitude ? '<div class="detail-section"><h3>Location</h3><div id="detail-map" style="height:250px;border-radius:8px;border:2px solid #e2e8f0;"></div><p style="margin-top:0.5rem;font-size:0.9rem;color:#64748b;">\uD83D\uDCCD ' + issue.latitude.toFixed(6) + ', ' + issue.longitude.toFixed(6) + '</p></div>' : '')
            + '</div>'
            + '<div style="margin-top:2rem;display:flex;gap:0.5rem;flex-wrap:wrap;">'
            + (issue.latitude && issue.longitude ? '<button class="btn btn-success" onclick="viewIssueOnMap(' + issue.id + ',' + issue.latitude + ',' + issue.longitude + ',\'' + issue.title.replace(/'/g, "\\'") + '\')">\uD83D\uDDFA\uFE0F View on Full Map</button>' : '')
            + ((isStaff || isAdmin) ? '<button class="btn btn-primary" onclick="updateIssueStatus(' + issue.id + ')">Update Status</button>' : '')
            + '</div>'
            + '<div style="margin-top:2rem;"><h3>Activity History</h3>' + historyHTML + '</div>'
            + '</div>';

        // Initialize detail map
        if (issue.latitude && issue.longitude) {
            setTimeout(() => {
                const detailMap = L.map('detail-map').setView([issue.latitude, issue.longitude], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '\u00A9 OpenStreetMap' }).addTo(detailMap);
                L.marker([issue.latitude, issue.longitude]).addTo(detailMap).bindPopup('<b>' + issue.title + '</b>').openPopup();
                setTimeout(() => detailMap.invalidateSize(), 100);
            }, 50);
        }
    } catch (err) {
        app.innerHTML = '<div class="card"><h2>Error</h2><p>Failed to load issue details: ' + (err.message || err) + '</p><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Back</button></div>';
    }
}

// === Staff Assigned Issues Page ===
async function renderAssigned() {
    if (!store.user) return router.navigate('login');
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card"><h2>My Assigned Tasks</h2><p>Loading...</p></div>';

    try {
        const issues = await api('/issues/assigned');
        app.innerHTML = '<div class="card">'
            + '<div class="breadcrumb"><a href="#dashboard">\u2190 Dashboard</a> / <span>My Tasks</span></div>'
            + '<h2>My Assigned Tasks</h2>'
            + '<div style="margin-bottom:1rem;display:flex;gap:0.5rem;"><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Dashboard</button><button class="btn btn-success" onclick="router.navigate(\'map\')">View Map</button></div>'
            + '<div id="assigned-list" class="dashboard-grid"></div>'
            + '</div>';

        const list = document.getElementById('assigned-list');
        if (!issues || issues.length === 0) {
            list.innerHTML = '<p style="color:#64748b;">No tasks assigned to you yet.</p>';
            return;
        }

        list.innerHTML = issues.map(issue => {
            return '<div class="issue-card clickable" onclick="router.navigate(\'issue/' + issue.id + '\')">'
                + (issue.imagePath ? '<img src="' + issue.imagePath + '" alt="Issue">' : '')
                + '<h4>' + issue.title + '</h4>'
                + '<p>' + issue.description + '</p>'
                + '<div style="margin-top:0.5rem">'
                + '<span class="status-badge status-' + issue.status + '">' + issue.status + '</span>'
                + '<span class="status-badge" style="background:#ddd;color:#333">' + issue.priority + '</span>'
                + '<span class="status-badge" style="background:#ddd;color:#333">' + (issue.category || 'N/A') + '</span>'
                + '</div>'
                + (issue.reporter ? '<div style="margin-top:0.5rem;font-size:0.85rem;color:#64748b;">Reported by: ' + issue.reporter.fullName + '</div>' : '')
                + '<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;" onclick="event.stopPropagation();">'
                + '<button class="btn btn-sm btn-primary" onclick="updateIssueStatus(' + issue.id + ')" style="flex:1;">Update Status</button>'
                + (issue.latitude && issue.longitude ? '<button class="btn btn-sm btn-success" onclick="viewIssueOnMap(' + issue.id + ',' + issue.latitude + ',' + issue.longitude + ',\'' + issue.title.replace(/'/g, "\\'") + '\')" style="flex:1;">\uD83D\uDDFA\uFE0F Map</button>' : '')
                + '</div></div>';
        }).join('');
    } catch (err) {
        app.innerHTML = '<div class="card"><h2>My Assigned Tasks</h2><p style="color:#dc2626;">Error loading tasks: ' + (err.message || err) + '</p><button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Back</button></div>';
    }
}

// === Profile Page ===
function renderProfile() {
    if (!store.user) return router.navigate('login');
    const app = document.getElementById('app');
    const user = store.user;
    const roleName = user.roles[0].replace('ROLE_', '');
    const roleColor = roleName === 'ADMIN' ? '#ef4444' : roleName === 'STAFF' ? '#f59e0b' : '#10b981';

    app.innerHTML = '<div class="card" style="max-width:600px;margin:2rem auto;">'
        + '<div class="breadcrumb"><a href="#dashboard">\u2190 Dashboard</a> / <span>Profile</span></div>'
        + '<h2>My Profile</h2>'
        + '<div style="text-align:center;margin-bottom:2rem;">'
        + '<div style="width:80px;height:80px;border-radius:50%;background:var(--primary-gradient);color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;margin:0 auto 1rem;">' + user.username.charAt(0).toUpperCase() + '</div>'
        + '<h3 style="margin:0;">' + user.username + '</h3>'
        + '<span class="status-badge" style="background:' + roleColor + ';margin-top:0.5rem;">' + roleName + '</span>'
        + '</div>'
        + '<div style="background:#f8fafc;border-radius:12px;padding:1.5rem;">'
        + '<div class="detail-row"><strong>User ID:</strong> ' + user.id + '</div>'
        + '<div class="detail-row"><strong>Username:</strong> ' + user.username + '</div>'
        + '<div class="detail-row"><strong>Role:</strong> ' + roleName + '</div>'
        + '</div>'
        + '<div style="margin-top:2rem;display:flex;gap:0.5rem;flex-wrap:wrap;">'
        + '<button class="btn btn-primary" onclick="router.navigate(\'dashboard\')">\u2190 Dashboard</button>'
        + '<button class="btn btn-danger" onclick="store.logout()">Logout</button>'
        + '</div>'
        + '</div>';
}

// Make functions globally accessible for onclick handlers
window.assignIssue = assignIssue;
window.updateIssueStatus = updateIssueStatus;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.deleteUser = deleteUser;
window.router = router;
window.store = store;

console.log('\u2705 App loaded successfully with all pages connected!');
