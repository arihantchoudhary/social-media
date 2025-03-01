// Global state for the profile editor
const profileState = {
    currentStep: 1,
    profile: {
        name: '',
        age: '',
        location: '',
        occupation: '',
        interests: [],
        likes: [],
        dislikes: [],
        fullProfile: ''
    },
    accounts: {
        twitter: { username: '', password: '' },
        instagram: { username: '', password: '' },
        facebook: { username: '', password: '' }
    },
    settings: {
        postCount: 10,
        autoKeywords: true,
        autoRanking: true,
        scrapingFrequency: 'daily' // New setting for scraping frequency
    }
};

// Sample profile text
const sampleProfile = `# User Profile: Alex Chen

## Personal Information
- Name: Alex Chen
- Age: 28
- Location: Portland, Oregon
- Occupation: UX Designer at a tech startup
- Relationship Status: Single

## Content Preferences
- Enjoys long-form articles and video essays about design, technology, and psychology
- Prefers visually-rich content with infographics and illustrations
- Regularly watches tutorial videos on design software and techniques
- Follows several cooking channels and recipe blogs

## Sports Interests
- Casual basketball fan (Portland Trail Blazers supporter)
- Actively practices rock climbing and bouldering
- Enjoys watching Olympic gymnastics and figure skating
- Recently started getting into Formula 1 racing

## Music Preferences
- Primary genres: Indie folk, alternative rock, and lo-fi beats
- Favorite artists: Bon Iver, Fleet Foxes, Phoebe Bridgers, and Japanese Breakfast
- Attends local music festivals and small venue concerts
- Plays acoustic guitar as a hobby
- Creates monthly playlists for different moods and activities

## Personality
- Generally thoughtful and introspective
- Has a dry, subtle sense of humor
- Values authenticity and depth in conversations
- Tends to be more serious in professional settings but relaxed with close friends
- Appreciates clever wordplay and satirical comedy

## News & Information
- Follows technology and design industry news closely
- Interested in environmental issues and sustainability
- Prefers in-depth analysis over breaking news headlines
- Listens to several podcasts about current events and social issues
- Skeptical of social media as a primary news source

## Social Media Habits
- Most active on Instagram and Pinterest for visual inspiration
- Uses Twitter to follow industry leaders and news
- Maintains a minimalist LinkedIn profile for professional connections
- Rarely posts personal updates but regularly shares interesting articles and design work
- Tries to limit social media use to specific times of day

## Twitter Accounts
### Likes
- @DesignMatters - For design inspiration and industry trends
- @FastCompany - Business and innovation news
- @NatGeo - Nature photography and environmental stories
- @TheEconomist - In-depth analysis on global issues
- @GoodReads - Book recommendations and literary discussions

### Doesn't Like
- @CelebrityGossip - Finds celebrity drama uninteresting
- @ClickbaitNews - Dislikes sensationalist headlines
- @PoliticalExtremist - Avoids polarizing political content
- @ConspiracyTheories - Prefers fact-based information
- @Aggressive_Marketing - Dislikes pushy promotional content

## Instagram Accounts
### Likes
- @minimaldesign - Clean, minimalist design inspiration
- @natgeotravel - Travel and nature photography
- @cookingforbeginners - Simple vegetarian recipes
- @portlandtrails - Local hiking spots and nature
- @modernarchitects - Architectural design and innovation

### Doesn't Like
- @luxurylifestyle - Finds excessive materialism off-putting
- @influencer_daily - Dislikes inauthentic sponsored content
- @extremefitness - Too intense for personal fitness philosophy
- @fastfashion_trends - Prefers sustainable, timeless fashion
- @perfect_life_illusion - Dislikes unrealistic lifestyle portrayals

## Hobbies & Interests
- Amateur photography (particularly nature and urban landscapes)
- Houseplant collection and care
- Weekend hiking and outdoor exploration
- Cooking experimental vegetarian recipes
- Attending design workshops and conferences`;

// Initialize the profile editor when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation between steps
    setupStepNavigation();
    
    // Set up form field change handlers
    setupFormHandlers();
    
    // Set up the "Load Sample Profile" button
    document.getElementById('load-sample-profile').addEventListener('click', loadSampleProfile);
    
    // Set up the "Start Curation" button
    document.getElementById('start-curation').addEventListener('click', startCurationProcess);
    
    // Add scraping frequency selector to the review step
    addScrapingFrequencySelector();
    
    // Load saved profile data from localStorage
    loadSavedProfileData();
});

// Load saved profile data from the server
async function loadSavedProfileData() {
    try {
        // First try to load profile from the server
        console.log('Loading saved profile data from server');
        
        try {
            // Fetch profile from the server
            const response = await fetch('/api/get-profile');
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.profile) {
                    const profile = result.profile;
                    
                    // Update the profile state
                    profileState.profile = { ...profileState.profile, ...profile };
                    
                    // Fill in the form fields
                    document.getElementById('profile-name').value = profile.name || '';
                    document.getElementById('profile-age').value = profile.age || '';
                    document.getElementById('profile-location').value = profile.location || '';
                    document.getElementById('profile-occupation').value = profile.occupation || '';
                    
                    if (profile.interests && Array.isArray(profile.interests)) {
                        document.getElementById('profile-interests').value = profile.interests.join(', ');
                    }
                    
                    if (profile.likes && Array.isArray(profile.likes)) {
                        document.getElementById('profile-likes').value = profile.likes.join('\n');
                    }
                    
                    if (profile.dislikes && Array.isArray(profile.dislikes)) {
                        document.getElementById('profile-dislikes').value = profile.dislikes.join('\n');
                    }
                    
                    // Fill in the full profile if available
                    if (profile.fullProfile) {
                        document.getElementById('profile-full').value = profile.fullProfile;
                    }
                    
                    console.log('Successfully loaded profile from server');
                }
            } else {
                console.warn('Failed to load profile from server, falling back to localStorage');
                loadProfileFromLocalStorage();
            }
        } catch (error) {
            console.error('Error fetching profile from server:', error);
            console.warn('Falling back to localStorage');
            loadProfileFromLocalStorage();
        }
        
        // Load social media credentials from server
        try {
            const credentialsResponse = await fetch('/api/get-credentials');
            
            if (credentialsResponse.ok) {
                const result = await credentialsResponse.json();
                
                if (result.success && result.accounts) {
                    const accounts = result.accounts;
                    
                    // Update the accounts state
                    profileState.accounts = { ...profileState.accounts, ...accounts };
                    
                    // Fill in the account fields
                    if (accounts.twitter) {
                        document.getElementById('twitter-username').value = accounts.twitter.username || '';
                        document.getElementById('twitter-password').value = accounts.twitter.password || '';
                    }
                    
                    if (accounts.instagram) {
                        document.getElementById('instagram-username').value = accounts.instagram.username || '';
                        document.getElementById('instagram-password').value = accounts.instagram.password || '';
                    }
                    
                    if (accounts.facebook) {
                        document.getElementById('facebook-username').value = accounts.facebook.username || '';
                        document.getElementById('facebook-password').value = accounts.facebook.password || '';
                    }
                    
                    console.log('Successfully loaded credentials from server');
                }
            } else {
                console.warn('Failed to load credentials from server, falling back to localStorage');
                loadAccountsFromLocalStorage();
            }
        } catch (error) {
            console.error('Error fetching credentials from server:', error);
            console.warn('Falling back to localStorage');
            loadAccountsFromLocalStorage();
        }
        
        // Load settings from localStorage
        loadSettingsFromLocalStorage();
    } catch (error) {
        console.error('Error loading saved profile data:', error);
    }
}

// Load profile from localStorage as a fallback
function loadProfileFromLocalStorage() {
    try {
        // Check if we have saved profile data
        const savedProfile = localStorage.getItem('userProfile');
        const savedProfileText = localStorage.getItem('userProfileText');
        
        if (savedProfile) {
            console.log('Loading saved profile data from localStorage');
            
            // Parse the saved profile
            const profile = JSON.parse(savedProfile);
            
            // Update the profile state
            if (profile) {
                profileState.profile = { ...profileState.profile, ...profile };
                
                // Fill in the form fields
                document.getElementById('profile-name').value = profile.name || '';
                document.getElementById('profile-age').value = profile.age || '';
                document.getElementById('profile-location').value = profile.location || '';
                document.getElementById('profile-occupation').value = profile.occupation || '';
                
                if (profile.interests && Array.isArray(profile.interests)) {
                    document.getElementById('profile-interests').value = profile.interests.join(', ');
                }
                
                if (profile.likes && Array.isArray(profile.likes)) {
                    document.getElementById('profile-likes').value = profile.likes.join('\n');
                }
                
                if (profile.dislikes && Array.isArray(profile.dislikes)) {
                    document.getElementById('profile-dislikes').value = profile.dislikes.join('\n');
                }
                
                // Fill in the full profile if available
                if (savedProfileText) {
                    document.getElementById('profile-full').value = savedProfileText;
                } else if (profile.fullProfile) {
                    document.getElementById('profile-full').value = profile.fullProfile;
                }
            }
        }
    } catch (error) {
        console.error('Error loading profile from localStorage:', error);
    }
}

// Load accounts from localStorage as a fallback
function loadAccountsFromLocalStorage() {
    try {
        const savedAccounts = localStorage.getItem('socialMediaAccounts');
        
        // Load saved social media accounts
        if (savedAccounts) {
            const accounts = JSON.parse(savedAccounts);
            
            if (accounts) {
                profileState.accounts = { ...profileState.accounts, ...accounts };
                
                // Fill in the account fields
                if (accounts.twitter) {
                    document.getElementById('twitter-username').value = accounts.twitter.username || '';
                    document.getElementById('twitter-password').value = accounts.twitter.password || '';
                }
                
                if (accounts.instagram) {
                    document.getElementById('instagram-username').value = accounts.instagram.username || '';
                    document.getElementById('instagram-password').value = accounts.instagram.password || '';
                }
                
                if (accounts.facebook) {
                    document.getElementById('facebook-username').value = accounts.facebook.username || '';
                    document.getElementById('facebook-password').value = accounts.facebook.password || '';
                }
            }
        }
    } catch (error) {
        console.error('Error loading accounts from localStorage:', error);
    }
}

// Load settings from localStorage
function loadSettingsFromLocalStorage() {
    try {
        const savedSettings = localStorage.getItem('userSettings');
        
        // Load saved settings
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            if (settings) {
                profileState.settings = { ...profileState.settings, ...settings };
                
                // Fill in the settings fields
                if (settings.postCount) {
                    document.getElementById('post-count').value = settings.postCount;
                }
                
                if (settings.autoKeywords !== undefined) {
                    document.getElementById('auto-keywords').checked = settings.autoKeywords;
                }
                
                if (settings.autoRanking !== undefined) {
                    document.getElementById('auto-ranking').checked = settings.autoRanking;
                }
                
                // Set scraping frequency if it exists
                if (settings.scrapingFrequency) {
                    const frequencySelect = document.getElementById('scraping-frequency');
                    if (frequencySelect) {
                        frequencySelect.value = settings.scrapingFrequency;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading settings from localStorage:', error);
    }
}

// Add scraping frequency selector to the review step
function addScrapingFrequencySelector() {
    const reviewSection = document.querySelector('.review-section:nth-child(3)');
    
    // Create the scraping frequency selector
    const frequencyGroup = document.createElement('div');
    frequencyGroup.className = 'form-group';
    frequencyGroup.innerHTML = `
        <label for="scraping-frequency">Scrape posts automatically:</label>
        <select id="scraping-frequency">
            <option value="manual">Manually only</option>
            <option value="daily" selected>Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
        </select>
    `;
    
    // Insert before the auto-keywords checkbox
    const autoKeywordsGroup = document.querySelector('#auto-keywords').closest('.form-group');
    reviewSection.insertBefore(frequencyGroup, autoKeywordsGroup);
    
    // Add event listener
    document.getElementById('scraping-frequency').addEventListener('change', e => {
        profileState.settings.scrapingFrequency = e.target.value;
    });
}

// Set up navigation between steps
function setupStepNavigation() {
    // Next buttons
    const nextButtons = document.querySelectorAll('.next-button');
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextStep = parseInt(button.getAttribute('data-next'));
            goToStep(nextStep);
        });
    });
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevStep = parseInt(button.getAttribute('data-prev'));
            goToStep(prevStep);
        });
    });
}

// Navigate to a specific step
function goToStep(stepNumber) {
    // Validate and save data from the current step
    if (!validateCurrentStep()) {
        return;
    }
    
    // Save data from the current step
    saveCurrentStepData();
    
    // Update the current step
    profileState.currentStep = stepNumber;
    
    // Hide all steps
    document.querySelectorAll('.setup-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the current step
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // If going to step 3 (review), update the review content
    if (stepNumber === 3) {
        updateReviewContent();
    }
}

// Update the progress bar
function updateProgressBar(currentStep) {
    // Reset all steps
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    document.querySelectorAll('.progress-line').forEach(line => {
        line.classList.remove('completed');
    });
    
    // Mark completed steps
    for (let i = 1; i < currentStep; i++) {
        document.querySelector(`.progress-step[data-step="${i}"]`).classList.add('completed');
        
        // If there's a next step, mark the line as completed
        if (i < 3) {
            document.querySelectorAll('.progress-line')[i-1].classList.add('completed');
        }
    }
    
    // Mark current step as active
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
}

// Set up form field change handlers
function setupFormHandlers() {
    // Personal information fields
    document.getElementById('profile-name').addEventListener('input', e => {
        profileState.profile.name = e.target.value;
    });
    
    document.getElementById('profile-age').addEventListener('input', e => {
        profileState.profile.age = e.target.value;
    });
    
    document.getElementById('profile-location').addEventListener('input', e => {
        profileState.profile.location = e.target.value;
    });
    
    document.getElementById('profile-occupation').addEventListener('input', e => {
        profileState.profile.occupation = e.target.value;
    });
    
    // Interests field
    document.getElementById('profile-interests').addEventListener('input', e => {
        profileState.profile.interests = e.target.value.split(',').map(item => item.trim()).filter(item => item);
    });
    
    // Content preferences fields
    document.getElementById('profile-likes').addEventListener('input', e => {
        profileState.profile.likes = e.target.value.split('\n').map(item => item.trim()).filter(item => item);
    });
    
    document.getElementById('profile-dislikes').addEventListener('input', e => {
        profileState.profile.dislikes = e.target.value.split('\n').map(item => item.trim()).filter(item => item);
    });
    
    // Full profile field
    document.getElementById('profile-full').addEventListener('input', e => {
        profileState.profile.fullProfile = e.target.value;
    });
    
    // Social media account fields
    document.getElementById('twitter-username').addEventListener('input', e => {
        profileState.accounts.twitter.username = e.target.value;
    });
    
    document.getElementById('twitter-password').addEventListener('input', e => {
        profileState.accounts.twitter.password = e.target.value;
    });
    
    document.getElementById('instagram-username').addEventListener('input', e => {
        profileState.accounts.instagram.username = e.target.value;
    });
    
    document.getElementById('instagram-password').addEventListener('input', e => {
        profileState.accounts.instagram.password = e.target.value;
    });
    
    document.getElementById('facebook-username').addEventListener('input', e => {
        profileState.accounts.facebook.username = e.target.value;
    });
    
    document.getElementById('facebook-password').addEventListener('input', e => {
        profileState.accounts.facebook.password = e.target.value;
    });
    
    // Settings fields
    document.getElementById('post-count').addEventListener('input', e => {
        profileState.settings.postCount = parseInt(e.target.value);
    });
    
    document.getElementById('auto-keywords').addEventListener('change', e => {
        profileState.settings.autoKeywords = e.target.checked;
    });
    
    document.getElementById('auto-ranking').addEventListener('change', e => {
        profileState.settings.autoRanking = e.target.checked;
    });
}

// Load the sample profile
function loadSampleProfile() {
    // Set the full profile textarea
    document.getElementById('profile-full').value = sampleProfile;
    
    // Update the state
    profileState.profile.fullProfile = sampleProfile;
    
    // Extract basic information from the sample profile
    const nameMatch = sampleProfile.match(/Name: ([^\n]+)/);
    const ageMatch = sampleProfile.match(/Age: ([0-9]+)/);
    const locationMatch = sampleProfile.match(/Location: ([^\n]+)/);
    const occupationMatch = sampleProfile.match(/Occupation: ([^\n]+)/);
    
    // Update the form fields if matches were found
    if (nameMatch) {
        document.getElementById('profile-name').value = nameMatch[1].trim();
        profileState.profile.name = nameMatch[1].trim();
    }
    
    if (ageMatch) {
        document.getElementById('profile-age').value = ageMatch[1].trim();
        profileState.profile.age = ageMatch[1].trim();
    }
    
    if (locationMatch) {
        document.getElementById('profile-location').value = locationMatch[1].trim();
        profileState.profile.location = locationMatch[1].trim();
    }
    
    if (occupationMatch) {
        document.getElementById('profile-occupation').value = occupationMatch[1].trim();
        profileState.profile.occupation = occupationMatch[1].trim();
    }
    
    // Extract interests from the Hobbies & Interests section
    const hobbiesSection = sampleProfile.match(/## Hobbies & Interests\n([^#]*)/);
    if (hobbiesSection) {
        const interests = hobbiesSection[1].split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace('-', '').trim());
        
        document.getElementById('profile-interests').value = interests.join(', ');
        profileState.profile.interests = interests;
    }
    
    // Extract likes from the Content Preferences section
    const contentSection = sampleProfile.match(/## Content Preferences\n([^#]*)/);
    if (contentSection) {
        const likes = contentSection[1].split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace('-', '').trim());
        
        document.getElementById('profile-likes').value = likes.join('\n');
        profileState.profile.likes = likes;
    }
    
    // Extract dislikes from the "Doesn't Like" sections
    const dislikesPattern = /### Doesn't Like\n([^#]*)/g;
    let dislikes = [];
    let match;
    
    while ((match = dislikesPattern.exec(sampleProfile)) !== null) {
        const sectionDislikes = match[1].split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => {
                const parts = line.replace('-', '').trim().split(' - ');
                return parts[1] || parts[0];
            });
        
        dislikes = [...dislikes, ...sectionDislikes];
    }
    
    document.getElementById('profile-dislikes').value = dislikes.join('\n');
    profileState.profile.dislikes = dislikes;
    
    // Show a success message
    alert('Sample profile loaded successfully!');
}

// Validate the current step
function validateCurrentStep() {
    const currentStep = profileState.currentStep;
    
    if (currentStep === 1) {
        // Check if either the basic fields or the full profile is filled
        const basicFieldsFilled = document.getElementById('profile-name').value.trim() !== '';
        const fullProfileFilled = document.getElementById('profile-full').value.trim() !== '';
        
        if (!basicFieldsFilled && !fullProfileFilled) {
            alert('Please fill in at least your name or provide a full profile.');
            return false;
        }
    } else if (currentStep === 2) {
        // Check if at least one social media account is filled
        const twitterFilled = document.getElementById('twitter-username').value.trim() !== '' && 
                             document.getElementById('twitter-password').value.trim() !== '';
        const instagramFilled = document.getElementById('instagram-username').value.trim() !== '' && 
                               document.getElementById('instagram-password').value.trim() !== '';
        const facebookFilled = document.getElementById('facebook-username').value.trim() !== '' && 
                              document.getElementById('facebook-password').value.trim() !== '';
        
        if (!twitterFilled && !instagramFilled && !facebookFilled) {
            alert('Please provide credentials for at least one social media account.');
            return false;
        }
    }
    
    return true;
}

// Save data from the current step
function saveCurrentStepData() {
    const currentStep = profileState.currentStep;
    
    if (currentStep === 1) {
        // Save profile data
        profileState.profile.name = document.getElementById('profile-name').value;
        profileState.profile.age = document.getElementById('profile-age').value;
        profileState.profile.location = document.getElementById('profile-location').value;
        profileState.profile.occupation = document.getElementById('profile-occupation').value;
        profileState.profile.interests = document.getElementById('profile-interests').value.split(',').map(item => item.trim()).filter(item => item);
        profileState.profile.likes = document.getElementById('profile-likes').value.split('\n').map(item => item.trim()).filter(item => item);
        profileState.profile.dislikes = document.getElementById('profile-dislikes').value.split('\n').map(item => item.trim()).filter(item => item);
        profileState.profile.fullProfile = document.getElementById('profile-full').value;
    } else if (currentStep === 2) {
        // Save social media account data
        profileState.accounts.twitter.username = document.getElementById('twitter-username').value;
        profileState.accounts.twitter.password = document.getElementById('twitter-password').value;
        profileState.accounts.instagram.username = document.getElementById('instagram-username').value;
        profileState.accounts.instagram.password = document.getElementById('instagram-password').value;
        profileState.accounts.facebook.username = document.getElementById('facebook-username').value;
        profileState.accounts.facebook.password = document.getElementById('facebook-password').value;
    } else if (currentStep === 3) {
        // Save settings data
        profileState.settings.postCount = parseInt(document.getElementById('post-count').value);
        profileState.settings.autoKeywords = document.getElementById('auto-keywords').checked;
        profileState.settings.autoRanking = document.getElementById('auto-ranking').checked;
        
        // Save scraping frequency if the element exists
        const frequencySelect = document.getElementById('scraping-frequency');
        if (frequencySelect) {
            profileState.settings.scrapingFrequency = frequencySelect.value;
        }
    }
}

// Update the review content
function updateReviewContent() {
    // Update profile summary
    const profileSummary = document.getElementById('profile-summary');
    profileSummary.innerHTML = '';
    
    if (profileState.profile.fullProfile) {
        // If full profile is provided, show a summary
        profileSummary.innerHTML = `
            <div class="review-item">
                <div class="review-label">Full Profile:</div>
                <div class="review-value">Detailed profile provided (${profileState.profile.fullProfile.length} characters)</div>
            </div>
        `;
    } else {
        // Otherwise, show the basic information
        profileSummary.innerHTML = `
            <div class="review-item">
                <div class="review-label">Name:</div>
                <div class="review-value">${profileState.profile.name || 'Not provided'}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Age:</div>
                <div class="review-value">${profileState.profile.age || 'Not provided'}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Location:</div>
                <div class="review-value">${profileState.profile.location || 'Not provided'}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Occupation:</div>
                <div class="review-value">${profileState.profile.occupation || 'Not provided'}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Interests:</div>
                <div class="review-value">${profileState.profile.interests.join(', ') || 'Not provided'}</div>
            </div>
        `;
    }
    
    // Update accounts summary
    const accountsSummary = document.getElementById('accounts-summary');
    accountsSummary.innerHTML = '';
    
    // Twitter account
    if (profileState.accounts.twitter.username) {
        accountsSummary.innerHTML += `
            <div class="account-review">
                <i class="fab fa-twitter twitter"></i>
                <div class="account-review-details">
                    <div class="account-review-username">@${profileState.accounts.twitter.username}</div>
                </div>
            </div>
        `;
    }
    
    // Instagram account
    if (profileState.accounts.instagram.username) {
        accountsSummary.innerHTML += `
            <div class="account-review">
                <i class="fab fa-instagram instagram"></i>
                <div class="account-review-details">
                    <div class="account-review-username">${profileState.accounts.instagram.username}</div>
                </div>
            </div>
        `;
    }
    
    // Facebook account
    if (profileState.accounts.facebook.username) {
        accountsSummary.innerHTML += `
            <div class="account-review">
                <i class="fab fa-facebook facebook"></i>
                <div class="account-review-details">
                    <div class="account-review-username">${profileState.accounts.facebook.username}</div>
                </div>
            </div>
        `;
    }
    
    // If no accounts are provided
    if (!profileState.accounts.twitter.username && !profileState.accounts.instagram.username && !profileState.accounts.facebook.username) {
        accountsSummary.innerHTML = '<div class="review-value">No accounts provided</div>';
    }
    
    // Update settings
    document.getElementById('post-count').value = profileState.settings.postCount;
    document.getElementById('auto-keywords').checked = profileState.settings.autoKeywords;
    document.getElementById('auto-ranking').checked = profileState.settings.autoRanking;
    
    // Update scraping frequency if the element exists
    const frequencySelect = document.getElementById('scraping-frequency');
    if (frequencySelect) {
        frequencySelect.value = profileState.settings.scrapingFrequency;
    }
}

// Start the curation process
function startCurationProcess() {
    // Save the current step data
    saveCurrentStepData();
    
    // Save the user profile to the server
    saveUserProfile().then(() => {
        // Redirect directly to the feed page
        window.location.href = 'feed.html';
    }).catch(error => {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    });
}

// Save the user profile to the server
async function saveUserProfile() {
    try {
        // Generate profile content
        let profileContent = '';
        
        if (profileState.profile.fullProfile) {
            profileContent = profileState.profile.fullProfile;
        } else {
            // Otherwise, generate a profile from the basic information
            profileContent = `# User Profile: ${profileState.profile.name}

## Personal Information
- Name: ${profileState.profile.name}
- Age: ${profileState.profile.age}
- Location: ${profileState.profile.location}
- Occupation: ${profileState.profile.occupation}

## Interests
${profileState.profile.interests.map(interest => `- ${interest}`).join('\n')}

## Content Preferences
### Likes
${profileState.profile.likes.map(like => `- ${like}`).join('\n')}

### Doesn't Like
${profileState.profile.dislikes.map(dislike => `- ${dislike}`).join('\n')}
`;
        }
        
        // Save to localStorage for backup
        localStorage.setItem('userProfile', JSON.stringify(profileState.profile));
        localStorage.setItem('userProfileText', profileContent);
        
        // Save to server
        const response = await fetch('/api/save-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profile: profileContent })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save profile');
        }
        
        // Save social media accounts
        await fetch('/api/save-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accounts: profileState.accounts })
        });
        
        // Save scraping settings
        await fetch('/api/save-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ settings: profileState.settings })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error saving profile:', error);
        throw error;
    }
}

// Update the loading status
function updateLoadingStatus(status, progress) {
    document.getElementById('loading-status').textContent = status;
    
    if (progress !== undefined) {
        document.querySelector('.progress-bar-fill').style.width = `${progress}%`;
        document.querySelector('.progress-percentage').textContent = `${progress}%`;
    }
}
