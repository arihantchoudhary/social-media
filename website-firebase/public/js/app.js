// Check authentication status
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, setup the app
            initApp(user);
        } else {
            // No user is signed in, redirect to login
            window.location.href = 'index.html';
        }
    });
});

// Initialize app with user data
function initApp(user) {
    // Set user info in the UI
    setupUserMenu(user);
    
    // Setup tabs
    setupTabs();
    
    // Setup sign out button
    document.getElementById('sign-out-button').addEventListener('click', signOut);
    
    // Add modal close handlers
    setupModalClosers();
}

// Setup user menu with profile info
function setupUserMenu(user) {
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    // Set avatar
    if (user.photoURL) {
        userAvatar.style.backgroundImage = `url(${user.photoURL})`;
    } else {
        userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        userAvatar.style.display = 'flex';
        userAvatar.style.justifyContent = 'center';
        userAvatar.style.alignItems = 'center';
    }
    
    // Set display name
    userName.textContent = user.displayName || user.email;
}

// Setup tab navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Setup modal close handlers
function setupModalClosers() {
    // Add close event listeners to all modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Find the parent modal
            const modal = button.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Sign out function
function signOut() {
    auth.signOut()
        .then(() => {
            // Sign-out successful
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // An error happened
            console.error('Sign out error:', error);
        });
}

// Helper function to open a modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Helper function to close a modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}