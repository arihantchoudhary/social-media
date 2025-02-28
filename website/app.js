// Function to determine platform from URL
function getPlatform(url) {
    if (url.includes('twitter.com')) return { name: 'Twitter', icon: 'fab fa-twitter twitter' };
    if (url.includes('facebook.com')) return { name: 'Facebook', icon: 'fab fa-facebook facebook' };
    if (url.includes('instagram.com')) return { name: 'Instagram', icon: 'fab fa-instagram instagram' };
    return { name: 'Unknown', icon: 'fas fa-globe' };
}

// Function to create a post element
function createPostElement(post, index) {
    const platform = getPlatform(post.url);
    
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.keywords = post.keywords.join(',').toLowerCase();
    postElement.dataset.index = index;
    
    // Set active classes based on userInteraction value
    const likeActiveClass = post.userInteraction === 1 ? 'active' : '';
    const dislikeActiveClass = post.userInteraction === -1 ? 'active' : '';
    
    postElement.innerHTML = `
        <div class="post-header" data-account-url="${post.accountUrl}">
            <img src="${post.profilePicture}" alt="${post.username}" class="profile-picture">
            <div class="user-info">
                <span class="username">${post.username}</span>
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
    
    // Add click event listeners for like and dislike buttons
    const likeButton = postElement.querySelector('.like-button');
    const dislikeButton = postElement.querySelector('.dislike-button');
    
    likeButton.addEventListener('click', () => {
        handleLike(index);
        simulateSwipeRight(postElement);
    });
    
    dislikeButton.addEventListener('click', () => {
        handleDislike(index);
        simulateSwipeLeft(postElement);
    });
    
    // Add click event listener for post header
    const postHeader = postElement.querySelector('.post-header');
    postHeader.addEventListener('click', () => {
        openAccountModal(post);
    });
    
    return postElement;
}

// Function to handle liking a post
function handleLike(index) {
    postsData[index].userInteraction = 1;
    savePostsData();
}

// Function to handle disliking a post
function handleDislike(index) {
    postsData[index].userInteraction = -1;
    savePostsData();
}

// Function to save posts data
function savePostsData() {
    console.log('Posts data updated:', postsData);
    localStorage.setItem('postsData', JSON.stringify(postsData));
}

// Function to open the account modal with embedded content
function openAccountModal(post) {
    const modal = document.getElementById('account-modal');
    const modalUsername = document.getElementById('modal-username');
    const embeddedContent = document.getElementById('embedded-content');
    
    modalUsername.textContent = post.username;
    embeddedContent.innerHTML = '<div class="loading">Loading content...</div>';
    
    // Show modal immediately
    modal.style.display = 'block';
    
    // Create embedded content based on platform
    if (post.accountUrl.includes('twitter.com')) {
        // Twitter embedding using Twitter Widget API
        const username = post.accountUrl.split('twitter.com/')[1].replace(/\/$/, '');
        
        embeddedContent.innerHTML = `
            <div id="twitter-timeline-container"></div>
        `;
        
        // Use Twitter's widget JS API to create the timeline
        twttr.ready(function() {
            twttr.widgets.createTimeline(
                {
                    sourceType: "profile",
                    screenName: username
                },
                document.getElementById('twitter-timeline-container'),
                {
                    height: 500,
                    chrome: "nofooter noheader"
                }
            ).then(function() {
                console.log("Twitter timeline loaded");
            }).catch(function(error) {
                embeddedContent.innerHTML = `
                    <div class="loading">
                        Could not load Twitter timeline. 
                        <a href="${post.accountUrl}" target="_blank">View on Twitter</a>
                    </div>
                `;
                console.error("Could not load timeline", error);
            });
        });
    } else if (post.accountUrl.includes('instagram.com')) {
        // Instagram embedding - direct iframe to user's page
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
        // Generic embedding for other platforms
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
    
    // Add event listener for closing the modal
    const closeButton = document.querySelector('.close-modal');
    closeButton.onclick = function() {
        modal.style.display = 'none';
        embeddedContent.innerHTML = '';
    };
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            embeddedContent.innerHTML = '';
        }
    };
}

// Function to initialize swipe gestures
function initSwipeGestures(postElement) {
    const hammer = new Hammer(postElement);
    const index = parseInt(postElement.dataset.index);
    
    hammer.on('swipeleft', () => {
        handleDislike(index);
        simulateSwipeLeft(postElement);
    });
    
    hammer.on('swiperight', () => {
        handleLike(index);
        simulateSwipeRight(postElement);
    });
}

// Function to simulate swipe right (like)
function simulateSwipeRight(postElement) {
    // Show like feedback before animation
    const likeFeedback = postElement.querySelector('.like-feedback');
    likeFeedback.style.opacity = '1';
    
    // Add a slight delay before the animation
    setTimeout(() => {
        postElement.classList.add('swiping-right');
        
        // Transition to the next post after animation completes
        setTimeout(() => {
            postElement.style.display = 'none';
            
            // Show the next post if available
            const nextPost = postElement.nextElementSibling;
            if (nextPost) {
                nextPost.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    }, 200);
}

// Function to simulate swipe left (dislike)
function simulateSwipeLeft(postElement) {
    // Show dislike feedback before animation
    const dislikeFeedback = postElement.querySelector('.dislike-feedback');
    dislikeFeedback.style.opacity = '1';
    
    // Add a slight delay before the animation
    setTimeout(() => {
        postElement.classList.add('swiping-left');
        
        // Transition to the next post after animation completes
        setTimeout(() => {
            postElement.style.display = 'none';
            
            // Show the next post if available
            const nextPost = postElement.nextElementSibling;
            if (nextPost) {
                nextPost.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    }, 200);
}

// Function to render posts
function renderPosts(postsToRender) {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '';
    
    if (postsToRender.length === 0) {
        feedContainer.innerHTML = '<div class="no-results">No posts match your filter criteria. Try a different keyword.</div>';
        return;
    }
    
    postsToRender.forEach((post, index) => {
        const postElement = createPostElement(post, index);
        feedContainer.appendChild(postElement);
        initSwipeGestures(postElement);
    });
}

// Function to perform semantic search using Anthropic API
async function semanticSearch(query, allKeywords) {
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                keywords: allKeywords
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get semantic search results');
        }
        
        const data = await response.json();
        return data.relatedKeywords;
    } catch (error) {
        console.error('Semantic search error:', error);
        // If the API call fails, fall back to basic matching
        return [];
    }
}

// Function to get all unique keywords from posts
function getAllKeywords() {
    const keywordSet = new Set();
    postsData.forEach(post => {
        post.keywords.forEach(keyword => {
            keywordSet.add(keyword.toLowerCase());
        });
    });
    
    return Array.from(keywordSet);
}

// Function to filter posts with semantic search
async function filterPosts(keyword) {
    if (!keyword) {
        return postsData;
    }
    
    keyword = keyword.toLowerCase().trim();
    
    // First try direct keyword matches
    const directMatches = postsData.filter(post => {
        const postKeywords = post.keywords.map(k => k.toLowerCase());
        return postKeywords.some(k => k.includes(keyword) || keyword.includes(k));
    });
    
    // If we have direct matches, return them
    if (directMatches.length > 0) {
        return directMatches;
    }
    
    // Otherwise, try semantic search if server is running
    try {
        const allKeywords = getAllKeywords();
        const relatedKeywords = await semanticSearch(keyword, allKeywords);
        
        if (relatedKeywords && relatedKeywords.length > 0) {
            // Filter posts by the related keywords
            return postsData.filter(post => {
                const postKeywords = post.keywords.map(k => k.toLowerCase());
                return postKeywords.some(k => 
                    relatedKeywords.some(rk => k.includes(rk.toLowerCase()))
                );
            });
        }
    } catch (error) {
        console.error('Error during semantic search:', error);
    }
    
    // If no semantic matches or API error, perform content search
    return postsData.filter(post => 
        post.summary.toLowerCase().includes(keyword)
    );
}

// Function to initialize keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        const visiblePosts = Array.from(document.querySelectorAll('.post')).filter(post => post.style.display !== 'none');
        if (visiblePosts.length === 0) return;
        
        const firstVisiblePost = visiblePosts[0];
        const index = parseInt(firstVisiblePost.dataset.index);
        
        if (event.key === 'ArrowRight') {
            // Like with right arrow key
            handleLike(index);
            simulateSwipeRight(firstVisiblePost);
        } else if (event.key === 'ArrowLeft') {
            // Dislike with left arrow key
            handleDislike(index);
            simulateSwipeLeft(firstVisiblePost);
        }
    });
}

// Function to load posts data from localStorage (if available)
function loadPostsData() {
    const savedData = localStorage.getItem('postsData');
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Update our postsData with saved userInteraction values
            parsedData.forEach((savedPost, index) => {
                if (index < postsData.length) {
                    postsData[index].userInteraction = savedPost.userInteraction;
                }
            });
            
            console.log('Loaded saved posts data:', postsData);
        } catch (e) {
            console.error('Error loading saved posts data:', e);
        }
    }
}

// Initialize the feed with all posts
document.addEventListener('DOMContentLoaded', () => {
    // Load any saved data
    loadPostsData();
    
    // Sort posts by rank score (highest to lowest)
    postsData.sort((a, b) => b.rank - a.rank);
    
    // Render the posts
    renderPosts(postsData);
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    // Add event listener for filter input
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    
    async function applyFilter() {
        const filterValue = filterInput.value.trim();
        
        // Show loading indicator
        const feedContainer = document.getElementById('feed-container');
        feedContainer.innerHTML = '<div class="loading-message">Searching posts...</div>';
        
        // Get filtered posts
        const filteredPosts = await filterPosts(filterValue);
        renderPosts(filteredPosts);
    }
    
    filterButton.addEventListener('click', applyFilter);
    filterInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    // Make keywords clickable for filtering
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('keyword')) {
            filterInput.value = e.target.textContent;
            applyFilter();
        }
    });
});