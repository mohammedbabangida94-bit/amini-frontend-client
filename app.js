// =================================================================
// GLOBAL CONFIGURATION
// =================================================================
const BACKEND_URL = 'https://amini-app-new.onrender.com';
const TOKEN_KEY = 'amini-token'; // Unified local storage key

// =================================================================
// 1. GLOBAL FUNCTIONS
// =================================================================

// Function to fetch and display the activity log
async function fetchActivityLog() {
    const activityLogDiv = document.getElementById('activity-log');
    const token = localStorage.getItem(TOKEN_KEY);

    if (!activityLogDiv) return;

    if (!token) {
        activityLogDiv.innerHTML = '<li>Please log in to view your activity log.</li>';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/reports`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token 
            }
        });

        if (response.ok) {
            const reports = await response.json();
            displayReports(reports);

        } else if (response.status === 401) {
            activityLogDiv.innerHTML = '<li>Session expired. Please log in again.</li>';
        } else {
            activityLogDiv.innerHTML = `<li>Failed to fetch activity log. Status: ${response.status}. Check backend logs.</li>`;
        }
    } catch (error) {
        console.error('Error fetching activity log:', error);
        activityLogDiv.innerHTML = '<li>Network error or server connection failed.</li>';
    }
}

// Function to render the reports list in the HTML (UPDATED FOR CLEAN FORMATTING)
function displayReports(reports) {
    const activityLogDiv = document.getElementById('activity-log');
    if (!activityLogDiv) return;

    activityLogDiv.innerHTML = ''; // Clear existing content

    if (reports.length === 0) {
        activityLogDiv.innerHTML = '<p>No activity reports found.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'activity-list';

    reports.forEach(report => {
        const li = document.createElement('li');
        
        // --- IMPROVED DATE FORMATTING ---
        const reportDate = new Date(report.date);
        const formattedDate = reportDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
        }).replace(',', ' at'); // <<< ADD THIS .replace(',', ' at') to fix the formatting issue
// ...

        
        // --- LOCATION FORMATTING ---
        const locationHTML = report.location && report.location.lat 
            ? `<strong>Location:</strong> Lat ${report.location.lat.toFixed(4)}, Long ${report.location.long.toFixed(4)}` 
            : '<strong>Location:</strong> N/A (GPS not available)';
        
        li.innerHTML = `
            <strong>Sent:</strong> ${formattedDate}<br>
            <strong>Message:</strong> ${report.message}<br>
            ${locationHTML}
        `;
        ul.appendChild(li);
    });

    activityLogDiv.appendChild(ul);
}


// This function runs on page load and after login
async function fetchProfileData() {
    const token = localStorage.getItem(TOKEN_KEY); 
    const welcomeMessage = document.getElementById('welcome-message');

    if (!token) {
        document.getElementById('register-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/profile`, {
            method: 'GET',
            headers: {
                'x-auth-token': token // Send the token in the header
            }
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS! Token is valid.
            document.getElementById('register-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');

            // Update the welcome message
            const email = data.user.email; // ASSUMING your profile route returns { user: { id, email } }
            welcomeMessage.textContent = `Welcome, ${email}!`;
            
            fetchActivityLog(); 

        } else {
            // Token was bad (e.g., expired)
            localStorage.removeItem(TOKEN_KEY);
            document.getElementById('register-screen').classList.remove('hidden');
            document.getElementById('main-app').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// =================================================================
// 2. PAGE LOAD LISTENER (MAIN CODE)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // This variable will hold our coordinates, MUST be outside the event listeners
    let userLocation = {lat: null, long: null}; 

    // Check if we are already logged in on page load
    fetchProfileData(); 

    // --- ELEMENT LOOKUPS ---
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginMessage = document.getElementById('login-message-area');
    const registerMessage = document.getElementById('message-area');
    const locationButton = document.getElementById('get-location-btn');
    const locationDisplay = document.getElementById('location-display');
    const sendMessageButton = document.getElementById('send-message-btn');
    const messageInput = document.getElementById('secure-message-input');
    const statusLog = document.getElementById('status-log');
    const logoutButton = document.getElementById('logout-btn');
    
    // Password Toggle Variables (CRITICAL: Define them here!)
    const passwordInput = document.getElementById('passwordInput');
    const passwordToggle = document.getElementById('passwordToggle');
    const toggleIcon = document.getElementById('toggleIcon');


    // -----------------------------------------------------------
    // --- A. FORM SUBMISSION HANDLERS ---
    // -----------------------------------------------------------

    // --- Registration Form ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            const email = document.getElementById('register-email').value;
            // NOTE: The password input ID in HTML is 'passwordInput', not 'register-password'
            const password = passwordInput.value; 
            
            try {
                const response = await fetch(`${BACKEND_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = 'Registration successful! You can now log in.';
                    registerMessage.style.color = 'green';
                } else {
                    registerMessage.textContent = `Error: ${data.message}`;
                    registerMessage.style.color = 'red';
                }
            } catch (error) {
                registerMessage.textContent = 'A network error occurred. Please try again.';
                registerMessage.style.color = 'red';
            }
        });
    }

    // --- Login Form ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value; // Using the login form's specific ID
            
            try {
                const response = await fetch(`${BACKEND_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem(TOKEN_KEY, data.token); // Save the token
                    fetchProfileData(); // Show app screen
                } else {
                    loginMessage.textContent = `Error: ${data.message}`;
                    loginMessage.style.color = 'red';
                }
            } catch (error) {
                loginMessage.textContent = 'A network error occurred. Please try again.';
                loginMessage.style.color = 'red';
            }
        });
    }

    // --- Send Secure Message Button (SOS) ---
    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', async () => {
            const message = messageInput.value;
            const token = localStorage.getItem(TOKEN_KEY);

            if (!message) { alert('Please type a message first.'); return; }
            if (!token) { alert('You must be logged in.'); return; }

            try {
                const response = await fetch(`${BACKEND_URL}/api/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({
                        message: message,
                        location: userLocation // Send the location data
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    statusLog.innerHTML += `<p style="color: green;">Status: ${data.message}</p>`;
                    messageInput.value = ''; // Clear the text box
                    fetchActivityLog(); 
                } else {
                    statusLog.innerHTML += `<p style="color: red;">Error: ${data.message}</p>`;
                }
            } catch (error) {
                statusLog.innerHTML += `<p style="color: red;">Network error. Could not send report.</p>`;
            }
        });
    }

    // -----------------------------------------------------------
    // --- B. UTILITY HANDLERS ---
    // -----------------------------------------------------------

    // 1. Form Switching Handlers
    if (showRegisterLink && showLoginLink) {
        showRegisterLink.addEventListener('click', (event) => {
            event.preventDefault(); 
            if(loginForm) loginForm.classList.add('hidden');
            if(registerForm) registerForm.classList.remove('hidden');
            if(loginMessage) loginMessage.textContent = ''; 
        });

        showLoginLink.addEventListener('click', (event) => {
            event.preventDefault(); 
            if(loginForm) loginForm.classList.remove('hidden');
            if(registerForm) registerForm.classList.add('hidden');
            if(registerMessage) registerMessage.textContent = ''; 
        });
    }

    // 2. Password Toggle Listener (The UX Fix)
    if (passwordToggle && passwordInput && toggleIcon) {
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            
            if (isPassword) {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        });
    }
    
    // 3. Update Location Button
    if (locationButton) {
        locationButton.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                locationDisplay.textContent = 'Finding your location...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = { // Save the coordinates
                            lat: position.coords.latitude,
                            long: position.coords.longitude
                        };
                        locationDisplay.textContent = `Location updated: ${userLocation.lat.toFixed(4)}, ${userLocation.long.toFixed(4)}`;
                        locationDisplay.style.color = 'green';
                    },
                    (error) => {
                        locationDisplay.textContent = 'Unable to get location. Check permissions.';
                        locationDisplay.style.color = 'red';
                    }
                );
            } else {
                locationDisplay.textContent = 'Geolocation is not available on this browser.';
            }
        });
    }

    // 4. Logout Button
    if (logoutButton) {
        
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem(TOKEN_KEY); 
            fetchProfileData(); // Go back to login screen
        });
    }
});