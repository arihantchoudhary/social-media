// Global variables for feed state
let currentViewMode = 'all'; // 'all' or 'friends'
let recentSearches = new Set();
let defaultSuggestions = ['politics', 'wellness', 'astronomy', 'health'];
let postsData = []; // Will be populated from Firestore

// Initialize feed when document is ready
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Load posts from database
            loadPostsFromFirestore();
            
            // Setup event listeners
            setupFeedInteractions();
        }
    });
});

// Load posts from Firestore database
function loadPostsFromFirestore() {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '<div class="loading">Loading posts...</div>';
    
    // Get current user
    const userId = auth.currentUser.uid;
    
    // Load user's friend list (if any)
    let friendIds = [];
    
    db.collection('users').doc(userId).get()
        .then(userDoc => {
            if (userDoc.exists && userDoc.data().friends) {
                friendIds = userDoc.data().friends;
            }
            
            // Load posts from Firestore
            return db.collection('posts').orderBy('rank', 'desc').get();
        })
        .then(querySnapshot => {
            postsData = [];
            
            querySnapshot.forEach(doc => {
                const post = doc.data();
                post.id = doc.id;
                
                // Check if post creator is in user's friend list
                post.isFriend = friendIds.includes(post.creatorId);
                
                // Initialize interaction to neutral
                post.userInteraction = 0;
                
                postsData.push(post);
            });
            
            // Load user interactions with these posts
            return db.collection('userInteractions')
                .where('userId', '==', userId)
                .get();
        })
        .then(interactionsSnapshot => {
            // Update posts with user interaction data
            interactionsSnapshot.forEach(doc => {
                const interaction = doc.data();
                const postIndex = postsData.findIndex(post => post.id === interaction.postId);
                
                if (postIndex !== -1) {
                    postsData[postIndex].userInteraction = interaction.interaction;
                }
            });
            
            // Load saved searches from localStorage
            loadSavedSearches();
            
            // Initialize feed UI
            updateSearchSuggestions();
            renderPosts(postsData);
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            feedContainer.innerHTML = `<div class="error-message">Error loading posts: ${error.message}</div>`;
        });
}

// Setup feed event listeners
function setupFeedInteractions() {
    // Initialize view toggle
    initViewToggle();
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    // Add filter listeners
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    
    filterButton.addEventListener('click', () => applyFilter());
    filterInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    // Make keywords clickable for filtering
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('keyword')) {
            filterInput.value = e.target.textContent;
            applyFilter(e.target.textContent);
        }
    });
}

// Load saved searches from localStorage
function loadSavedSearches() {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
        try {
            recentSearches = new Set(JSON.parse(savedSearches));
        } catch (e) {
            console.error('Error parsing saved searches:', e);
        }
    }
}

/* 
 * The following functions are adapted from your existing code with
 * modifications to work with the Firebase database
 */

// Create a post element
function createPostElement(post, index) {
    const platform = getPlatform(post.url);
    
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.keywords = post.keywords.join(',').toLowerCase();
    postElement.dataset.index = index;
    
    // Set active classes based on userInteraction value
    const likeActiveClass = post.userInteraction === 1 ? 'active' : '';
    const dislikeActiveClass = post.userInteraction === -1 ? 'active' : '';
    
    // Add friend badge if this is a friend
    const friendBadge = post.isFriend ? '<span class="friend-badge">Friend</span>' : '';
    
    postElement.innerHTML = `
        <div class="post-header" data-account-url="${post.accountUrl}">
            <img src="${post.profilePicture}" alt="${post.username}" class="profile-picture">
            <div class="user-info">
                <span class="username">${post.username}${friendBadge}</span>
            </div>
            <i class="${platform.icon} platform-icon"></i>
        </div>
        <div class="post-body">
            <div class="post-content">${post.summary}</div>
            <div class="post-keywords">
                ${post.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
            </div>
        </div>
        <div class="post-actions">
            <button class="like-button ${likeActiveClass}"><i class="fas fa-heart"></i> Like</button>
            <button class="dislike-button ${dislikeActiveClass}"><i class="fas fa-times"></i> Dislike</button>
        </div>
        <div class="swipe-feedback">
            <div class="like-feedback">Liked! <i class="fas fa-heart"></i></div>
            <div class="dislike-feedback">Disliked <i class="fas fa-times"></i></div>
        </div>
    `;
    
    // Add event listeners
    setupPostInteractions(postElement, post, index);
    
    return postElement;
}

// Setup interaction handlers for a post
function setupPostInteractions(postElement, post, index) {
    // Like button
    postElement.querySelector('.like-button').addEventListener('click', () => {
        handleLike(index);
        simulateSwipeRight(postElement);
    });
    
    // Dislike button
    postElement.querySelector('.dislike-button').addEventListener('click', () => {
        handleDislike(index);
        simulateSwipeLeft(postElement);
    });
    
    // Click on post header to view account
    postElement.querySelector('.post-header').addEventListener('click', () => {
        openAccountModal(post);
    });
    
    // Initialize swipe gesture
    initSwipeGesture(postElement, index);
}

// Determine platform from URL
function getPlatform(url) {
    if (url.includes('twitter.com') || url.includes('x.com')) 
        return { name: 'Twitter', icon: 'fab fa-twitter twitter' };
    if (url.includes('facebook.com')) 
        return { name: 'Facebook', icon: 'fab fa-facebook facebook' };
    if (url.includes('instagram.com')) 
        return { name: 'Instagram', icon: 'fab fa-instagram instagram' };
    if (url.includes('linkedin.com')) 
        return { name: 'LinkedIn', icon: 'fab fa-linkedin linkedin' };
    return { name: 'Unknown', icon: 'fas fa-globe' };
}

// Handle liking a post
function handleLike(index) {
    postsData[index].userInteraction = 1;
    saveUserInteraction(postsData[index].id, 1);
}

// Handle disliking a post
function handleDislike(index) {
    postsData[index].userInteraction = -1;
    saveUserInteraction(postsData[index].id, -1);
}

// Save user interaction with a post to Firestore
function saveUserInteraction(postId, interaction) {
    const userId = auth.currentUser.uid;
    
    db.collection('userInteractions').doc(`${userId}_${postId}`).set({
        userId: userId,
        postId: postId,
        interaction: interaction, // 1 = like, -1 = dislike
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .catch((error) => {
        console.error('Error saving interaction:', error);
    });
}

// Initialize swipe gesture on a post
function initSwipeGesture(postElement, index) {
    const hammer = new Hammer(postElement);
    
    hammer.on('swipeleft', () => {
        handleDislike(index);
        simulateSwipeLeft(postElement);
    });
    
    hammer.on('swiperight', () => {
        handleLike(index);
        simulateSwipeRight(postElement);
    });
}

// Simulate swiping right (like)
function simulateSwipeRight(postElement) {
    // Show like feedback
    const likeFeedback = postElement.querySelector('.like-feedback');
    likeFeedback.style.opacity = '1';
    
    // Animate
    setTimeout(() => {
        postElement.classList.add('swiping-right');
        
        // After animation
        setTimeout(() => {
            postElement.style.display = 'none';
            
            // Show next post if available
            const nextPost = postElement.nextElementSibling;
            if (nextPost) {
                nextPost.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    }, 200);
}

// Simulate swiping left (dislike)
function simulateSwipeLeft(postElement) {
    // Show dislike feedback
    const dislikeFeedback = postElement.querySelector('.dislike-feedback');
    dislikeFeedback.style.opacity = '1';
    
    // Animate
    setTimeout(() => {
        postElement.classList.add('swiping-left');
        
        // After animation
        setTimeout(() => {
            postElement.style.display = 'none';
            
            // Show next post if available
            const nextPost = postElement.nextElementSibling;
            if (nextPost) {
                nextPost.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    }, 200);
}

// Open modal with embedded social media content
function openAccountModal(post) {
    const modal = document.getElementById('account-modal');
    const modalUsername = document.getElementById('modal-username');
    const embeddedContent = document.getElementById('embedded-content');
    
    modalUsername.textContent = post.username;
    embeddedContent.innerHTML = '<div class="loading">Loading content...</div>';
    
    // Show modal
    modal.style.display = 'block';
    
    // Handle Twitter embeds using Twitter's oEmbed API
    if (post.accountUrl.includes('twitter.com') || post.accountUrl.includes('x.com')) {
        // Extract username from URL
        let username = '';
        if (post.accountUrl.includes('twitter.com/')) {
            username = post.accountUrl.split('twitter.com/')[1].replace(/\/$/, '');
        } else if (post.accountUrl.includes('x.com/')) {
            username = post.accountUrl.split('x.com/')[1].replace(/\/$/, '');
        }
        
        // Clean up username
        if (username.includes('?')) {
            username = username.split('?')[0];
        }
        
        // Use Twitter's oEmbed API
        const encodedUrl = encodeURIComponent(`https://twitter.com/${username}`);
        fetch(`https://publish.twitter.com/oembed?url=${encodedUrl}&omit_script=false&chrome=nofooter&dnt=true`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                embeddedContent.innerHTML = data.html;
                
                // Execute scripts
                const scripts = embeddedContent.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            })
            .catch(error => {
                console.error('Error fetching Twitter embed:', error);
                embeddedContent.innerHTML = `<p>Could not load tweets from ${username}. Error: ${error.message}</p>`;
            });
    } else if (post.accountUrl.includes('instagram.com')) {
        // Instagram embedding
        const username = post.accountUrl.split('instagram.com/')[1].replace(/\/$/, '');
        
        embeddedContent.innerHTML = `
            <div class="instagram-container">
                <div class="instagram-header">
                    <img src="${post.profilePicture}" alt="${post.username}" class="instagram-avatar">
                    <div class="instagram-info">
                        <div class="instagram-username">${post.username}</div>
                    </div>
                </div>
                <iframe 
                    src="https://www.instagram.com/${username}/embed/" 
                    frameborder="0" 
                    scrolling="no" 
                    allowtransparency="true"
                    width="100%"
                    height="450">
                </iframe>
            </div>
        `;
    } else {
        // Generic embedding
        embeddedContent.innerHTML = `
            <iframe 
                src="${post.accountUrl}" 
                width="100%" 
                height="500" 
                frameborder="0"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms">
            </iframe>
        `;
    }
}

// Create and update search suggestions
function updateSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    suggestionsContainer.innerHTML = '';
    
    // Combine recent searches with default suggestions
    let allSuggestions = [...recentSearches, ...defaultSuggestions];
    
    // Remove duplicates and limit to max 6
    allSuggestions = [...new Set(allSuggestions)].slice(0, 6);
    
    allSuggestions.forEach(suggestion => {
        const button = document.createElement('button');
        button.className = 'suggestion-tag';
        button.textContent = suggestion;
        button.addEventListener('click', () => {
            document.getElementById('filter-input').value = suggestion;
            applyFilter(suggestion);
            
            // Highlight active suggestion
            document.querySelectorAll('.suggestion-tag').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
        
        suggestionsContainer.appendChild(button);
    });
}

// Render posts with view mode filter
function renderPosts(postsToRender) {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '';
    
    // Filter by view mode if needed
    if (currentViewMode === 'friends') {
        postsToRender = postsToRender.filter(post => post.isFriend);
    }
    
    if (postsToRender.length === 0) {
        feedContainer.innerHTML = '<div class="no-results">No posts match your criteria. Try a different filter or view mode.</div>';
        return;
    }
    
    postsToRender.forEach((post, index) => {
        const postElement = createPostElement(post, index);
        feedContainer.appendChild(postElement);
    });
}

// Filter posts by keyword
function filterPosts(keyword) {
    if (!keyword) {
        return postsData;
    }
    
    keyword = keyword.toLowerCase().trim();
    
    // Add to recent searches
    if (keyword.length > 0) {
        recentSearches.add(keyword);
        updateSearchSuggestions();
    }
    
    // Match by keywords
    const keywordMatches = postsData.filter(post => {
        const postKeywords = post.keywords.map(k => k.toLowerCase());
        return postKeywords.some(k => k.includes(keyword) || keyword.includes(k));
    });
    
    // Match by content
    const contentMatches = postsData.filter(post => 
        post.summary.toLowerCase().includes(keyword)
    );
    
    // Combine matches without duplicates
    return [...new Set([...keywordMatches, ...contentMatches])];
}

// Apply filter with loading indicator
function applyFilter(filterValue) {
    if (!filterValue) {
        filterValue = document.getElementById('filter-input').value.trim();
    }
    
    // Show loading indicator
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '<div class="loading-message">Searching posts...</div>';
    
    // Get filtered posts
    const filteredPosts = filterPosts(filterValue);
    renderPosts(filteredPosts);
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify([...recentSearches]));
}

// Setup friends toggle
function initViewToggle() {
    const friendsToggle = document.getElementById('friends-toggle');
    
    friendsToggle.addEventListener('change', () => {
        currentViewMode = friendsToggle.checked ? 'friends' : 'all';
        
        // Re-apply current filter
        const filterValue = document.getElementById('filter-input').value.trim();
        if (filterValue) {
            applyFilter(filterValue);
        } else {
            renderPosts(postsData);
        }
    });
}

// Enable keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        const visiblePosts = Array.from(document.querySelectorAll('.post')).filter(post => post.style.display !== 'none');
        if (visiblePosts.length === 0) return;
        
        const firstVisiblePost = visiblePosts[0];
        const index = parseInt(firstVisiblePost.dataset.index);
        
        if (event.key === 'ArrowRight') {
            // Like with right arrow
            handleLike(index);
            simulateSwipeRight(firstVisiblePost);
        } else if (event.key === 'ArrowLeft') {
            // Dislike with left arrow
            handleDislike(index);
            simulateSwipeLeft(firstVisiblePost);
        }
    });
}