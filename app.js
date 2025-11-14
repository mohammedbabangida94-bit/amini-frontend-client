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

    if (!activityLogDiv) return; // Safety check

    if (!token) {
        activityLogDiv.innerHTML = '<li>Please log in to view your activity log.</li>';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/reports`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // CRITICAL FIX: Use 'x-auth-token' to match your existing backend logic
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

// Function to render the reports list in the HTML
function displayReports(reports) {
    const activityLogDiv = document.getElementById('activity-log');
    if (!activityLogDiv) return; // Safety check

    activityLogDiv.innerHTML = ''; // Clear existing content

    if (reports.length === 0) {
        activityLogDiv.innerHTML = '<p>No activity reports found.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'activity-list';

    reports.forEach(report => {
        const li = document.createElement('li');
        const date = new Date(report.date).toLocaleDateString();
        const time = new Date(report.date).toLocaleTimeString();
        
        li.innerHTML = `
            <strong>Sent:</strong> ${date} at ${time}<br>
            <strong>Message:</strong> ${report.message}<br>
            ${report.location && report.location.lat ? `<strong>Location:</strong> Lat ${report.location.lat.toFixed(4)}, Long ${report.location.long.toFixed(4)}` : '<strong>Location:</strong> N/A'}
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
            const email = data.message.split(', ')[1]; 
            welcomeMessage.textContent = `Welcome, ${email}!`;
            
            // --- CRITICAL FIX: CALL THE ACTIVITY LOG FETCHER ---
            fetchActivityLog(); 
            // -----------------------------------------------------

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
    // This variable will hold our coordinates
    let userLocation = null; 

    // Check if we are already logged in on page load
    fetchProfileData(); 

    // --- Registration Form ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const messageArea = document.getElementById('message-area');

            try {
                const response = await fetch(`${BACKEND_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    messageArea.textContent = 'Registration successful! You can now log in.';
                    messageArea.style.color = 'green';
                } else {
                    messageArea.textContent = `Error: ${data.message}`;
                    messageArea.style.color = 'red';
                }
            } catch (error) {
                messageArea.textContent = 'A network error occurred. Please try again.';
                messageArea.style.color = 'red';
            }
        });
    }

    // --- Login Form ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const messageArea = document.getElementById('login-message-area');

            try {
                const response = await fetch(`${BACKEND_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem(TOKEN_KEY, data.token); // Save the token
                    fetchProfileData(); // Fetch profile (this shows the app and the activity log)
                } else {
                    messageArea.textContent = `Error: ${data.message}`;
                    messageArea.style.color = 'red';
                }
            } catch (error) {
                messageArea.textContent = 'A network error occurred. Please try again.';
                messageArea.style.color = 'red';
            }
        });
    }

    // --- Update Location Button ---
    const locationButton = document.getElementById('get-location-btn');
    const locationDisplay = document.getElementById('location-display');
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
                        locationDisplay.textContent = 'Unable to get location.';
                        locationDisplay.style.color = 'red';
                    }
                );
            } else {
                locationDisplay.textContent = 'Geolocation is not available.';
            }
        });
    }

    // --- Send Secure Message Button ---
    const sendMessageButton = document.getElementById('send-message-btn');
    const messageInput = document.getElementById('secure-message-input');
    const statusLog = document.getElementById('status-log');
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
                    statusLog.innerHTML += `<p>Status: ${data.message}</p>`;
                    messageInput.value = ''; // Clear the text box
                    
                    // After successfully sending a report, refresh the log!
                    fetchActivityLog(); 
                } else {
                    statusLog.innerHTML += `<p>Error: ${data.message}</p>`;
                }
            } catch (error) {
                statusLog.innerHTML += `<p>Network error. Could not send report.</p>`;
            }
        });
    }

    // --- Logout Button ---
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem(TOKEN_KEY); // Clear the token
            // Refresh the page or call fetchProfileData to go back to login screen
            fetchProfileData();
        });
    }
});

// =================================================================
// 3. FORM TOGGLE LOGIC
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginMessage = document.getElementById('login-message-area');
    const registerMessage = document.getElementById('message-area');


    if (showRegisterLink && showLoginLink) {
        showRegisterLink.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from jumping the page
            if(loginForm) loginForm.classList.add('hidden');
            if(registerForm) registerForm.classList.remove('hidden');
            // Also clear any old error messages
            if(loginMessage) loginMessage.textContent = ''; 
        });

        showLoginLink.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from jumping the page
            if(loginForm) loginForm.classList.remove('hidden');
            if(registerForm) registerForm.classList.add('hidden');
            // Also clear any old error messages
            if(registerMessage) registerMessage.textContent = '';
        });
    }
});