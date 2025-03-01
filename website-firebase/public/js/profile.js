// Initialize profile page when user is authenticated
auth.onAuthStateChanged(user => {
    if (user) {
        loadUserProfile();
        
        // Setup form submission events
        setupProfileForm();
        setupSocialAccountsForm();
    }
});

// Load user's profile data from Firestore
function loadUserProfile() {
    const userId = auth.currentUser.uid;
    
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Set profile form values
                document.getElementById('display-name').value = userData.displayName || '';
                
                // Load social accounts
                if (userData.socialAccounts && userData.socialAccounts.length > 0) {
                    renderSocialAccounts(userData.socialAccounts);
                } else {
                    document.getElementById('accounts-list').innerHTML = 
                        '<p class="no-accounts">No social accounts added yet.</p>';
                }
            }
        })
        .catch(error => {
            console.error("Error loading user profile:", error);
            alert("Error loading profile data");
        });
}

// Render the list of social accounts
function renderSocialAccounts(accounts) {
    const accountsList = document.getElementById('accounts-list');
    accountsList.innerHTML = '';
    
    accounts.forEach((account, index) => {
        const platformIcon = getPlatformIcon(account.platform);
        
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        accountItem.innerHTML = `
            <i class="${platformIcon} account-icon"></i>
            <div class="account-info">
                <div class="account-platform">${capitalizeFirstLetter(account.platform)}</div>
                <div class="account-username">@${account.username}</div>
            </div>
            <div class="account-actions">
                <button class="edit-button" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-button" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        accountsList.appendChild(accountItem);
    });
    
    // Add event listeners for edit and delete buttons
    addAccountActionListeners();
}

// Get icon class for social platform
function getPlatformIcon(platform) {
    switch (platform.toLowerCase()) {
        case 'twitter': return 'fab fa-twitter twitter';
        case 'instagram': return 'fab fa-instagram instagram';
        case 'facebook': return 'fab fa-facebook facebook';
        case 'linkedin': return 'fab fa-linkedin linkedin';
        default: return 'fas fa-globe';
    }
}

// Capitalize first letter of string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add event listeners to account action buttons
function addAccountActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            editSocialAccount(index);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            deleteSocialAccount(index);
        });
    });
}

// Setup profile form submission
function setupProfileForm() {
    const profileForm = document.getElementById('profile-form');
    
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('display-name').value.trim();
        
        // Update user profile in Firestore
        const userId = auth.currentUser.uid;
        
        db.collection('users').doc(userId).update({
            displayName: displayName
        })
        .then(() => {
            // Also update Firebase Auth profile
            return auth.currentUser.updateProfile({
                displayName: displayName
            });
        })
        .then(() => {
            // Update UI
            document.getElementById('user-name').textContent = displayName;
            
            // Show success notification
            alert('Profile updated successfully!');
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert(`Error updating profile: ${error.message}`);
        });
    });
}

// Setup social accounts form
function setupSocialAccountsForm() {
    const addAccountButton = document.getElementById('add-account-button');
    const socialAccountForm = document.getElementById('social-account-form');
    
    // Show modal when add button is clicked
    addAccountButton.addEventListener('click', () => {
        // Reset form
        document.getElementById('social-modal-title').textContent = 'Add Social Account';
        document.getElementById('platform-select').value = '';
        document.getElementById('account-username').value = '';
        document.getElementById('account-password').value = '';
        document.getElementById('account-id').value = '';
        
        // Show modal
        openModal('social-account-modal');
    });
    
    // Handle form submission
    socialAccountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const platform = document.getElementById('platform-select').value;
        const username = document.getElementById('account-username').value.trim();
        const password = document.getElementById('account-password').value;
        const accountId = document.getElementById('account-id').value;
        
        // Encrypt the password
        const encryptedPassword = encryptionUtils.encrypt(password);
        
        const userId = auth.currentUser.uid;
        
        // Create account object
        const accountData = {
            platform: platform,
            username: username,
            password: encryptedPassword
        };
        
        db.collection('users').doc(userId).get()
            .then(doc => {
                let socialAccounts = [];
                
                if (doc.exists && doc.data().socialAccounts) {
                    socialAccounts = doc.data().socialAccounts;
                }
                
                if (accountId) {
                    // Update existing account
                    const index = parseInt(accountId);
                    socialAccounts[index] = accountData;
                } else {
                    // Add new account
                    socialAccounts.push(accountData);
                }
                
                // Update Firestore
                return db.collection('users').doc(userId).update({
                    socialAccounts: socialAccounts
                });
            })
            .then(() => {
                // Close modal
                closeModal('social-account-modal');
                
                // Reload accounts list
                loadUserProfile();
            })
            .catch(error => {
                console.error('Error saving social account:', error);
                alert(`Error: ${error.message}`);
            });
    });
}

// Edit social account
function editSocialAccount(index) {
    const userId = auth.currentUser.uid;
    
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists && doc.data().socialAccounts) {
                const accounts = doc.data().socialAccounts;
                const account = accounts[index];
                
                if (account) {
                    // Set form values
                    document.getElementById('social-modal-title').textContent = 'Edit Social Account';
                    document.getElementById('platform-select').value = account.platform;
                    document.getElementById('account-username').value = account.username;
                    document.getElementById('account-password').value = encryptionUtils.decrypt(account.password);
                    document.getElementById('account-id').value = index;
                    
                    // Show modal
                    openModal('social-account-modal');
                }
            }
        })
        .catch(error => {
            console.error('Error loading account for edit:', error);
            alert(`Error: ${error.message}`);
        });
}

// Delete social account
function deleteSocialAccount(index) {
    if (!confirm('Are you sure you want to delete this account?')) {
        return;
    }
    
    const userId = auth.currentUser.uid;
    
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists && doc.data().socialAccounts) {
                const accounts = doc.data().socialAccounts;
                
                // Remove the account at specified index
                accounts.splice(index, 1);
                
                // Update Firestore
                return db.collection('users').doc(userId).update({
                    socialAccounts: accounts
                });
            }
        })
        .then(() => {
            // Reload accounts list
            loadUserProfile();
        })
        .catch(error => {
            console.error('Error deleting social account:', error);
            alert(`Error: ${error.message}`);
        });
}