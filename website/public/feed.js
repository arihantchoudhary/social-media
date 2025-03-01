/**
 * Feed.js
 * 
 * This script handles the feed page functionality, including:
 * - Loading posts from the backend
 * - Rendering posts in the feed
 * - Handling post interactions (like, dislike, feedback)
 * - Filtering and sorting posts
 * - Swipe gestures for posts
 */

// Global state for the feed
const feedState = {
    posts: [],
    filteredPosts: [],
    currentSort: 'rank',
    currentPlatformFilter: 'all',
    recentSearches: new Set(),
    defaultSuggestions: ['politics', 'health', 'technology', 'sports'],
    progressState: {
        postsAnalyzed: 0,
        gpuUtilization: 0,
        inferenceProgress: 0,
        inferenceActive: false,
        activeTask: null,
        totalInferenceProgress: 0
    }
};

// Default profile pictures for different platforms
const DEFAULT_PROFILE_PICTURES = {
    twitter: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
    instagram: 'https://i.pinimg.com/originals/8b/16/7a/8b167af653c2399dd93b952a48740620.jpg',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/800px-2021_Facebook_icon.svg.png'
};

// Initialize the feed when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Feed page loaded');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load posts from the backend
    loadPosts();
    
    // Load saved searches from localStorage
    loadSavedSearches();
    
    // Update search suggestions
    updateSearchSuggestions();
    
    // Initialize progress widget
    initProgressWidget();
    
    // Initialize dark mode
    initDarkMode();
    
    // Check if we're coming from the profile page
    if (document.referrer.includes('index.html') || !localStorage.getItem('llmAnalysisShown')) {
        // Generate LLM analysis of recent posts
        generateLlmAnalysis();
        // Mark that we've shown the analysis
        localStorage.setItem('llmAnalysisShown', new Date().toISOString());
    } else {
        // Hide the analysis if not coming from profile page
        document.getElementById('llm-analysis').style.display = 'none';
    }
});

// Generate LLM analysis of recent posts
async function generateLlmAnalysis() {
    const analysisContainer = document.getElementById('llm-analysis-content');
    
    try {
        // Simulate an API call to an LLM service
        // In a real implementation, this would be a call to a backend service
        // that would process the posts and generate insights
        await simulateLlmAnalysis(analysisContainer);
    } catch (error) {
        console.error('Error generating LLM analysis:', error);
        analysisContainer.innerHTML = '<p>Unable to generate insights at this time. Please try again later.</p>';
    }
}

// Simulate an LLM analysis with a delay to mimic API call
async function simulateLlmAnalysis(container) {
    // Show loading state
    container.innerHTML = '<p>Analyzing your latest posts...</p>';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sample analysis content - in a real implementation, this would come from the LLM
    const analysisContent = `
        <p>Based on your recent posts, there's been <strong>significant discussion around AI technology</strong> in your network. Several posts highlight breakthroughs in generative models.</p>
        
        <p>A trending topic in your feed is <strong>climate change policy</strong>, with multiple high-engagement posts discussing recent legislative developments.</p>
        
        <p>There's also notable excitement about <strong>SpaceX's latest rocket launch</strong>, which appears to be generating substantial positive sentiment across platforms.</p>
        
        <p>Your personal posts about <strong>photography techniques</strong> are receiving higher-than-average engagement compared to your other content.</p>
    `;
    
    // Update the container with the analysis
    container.innerHTML = analysisContent;
}

// Initialize dark mode
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply dark mode if it was previously enabled
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Add event listener to toggle button
    darkModeToggle.addEventListener('click', () => {
        // Toggle dark mode class on body
        document.body.classList.toggle('dark-mode');
        
        // Update icon based on current state
        const isDarkModeNow = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = isDarkModeNow ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        // Save preference to localStorage
        localStorage.setItem('darkMode', isDarkModeNow);
    });
}

// Initialize the progress widget
function initProgressWidget() {
    // Start updating the posts analyzed count
    updatePostsAnalyzed();
    
    // Start updating the GPU utilization
    updateGpuUtilization();
}

// Update the posts analyzed count
function updatePostsAnalyzed() {
    const postsAnalyzedElement = document.getElementById('posts-analyzed');
    
    // Increment the posts analyzed count every few seconds
    setInterval(() => {
        // Increment by a smaller amount (1 or 2) for slower increase
        const increment = Math.floor(Math.random() * 2) + 1;
        feedState.progressState.postsAnalyzed += increment;
        
        // Update the UI
        postsAnalyzedElement.textContent = formatNumber(feedState.progressState.postsAnalyzed);
    }, 5000); // Update every 5 seconds (slower)
    
    // Set an initial value
    feedState.progressState.postsAnalyzed = 1250;
    postsAnalyzedElement.textContent = formatNumber(feedState.progressState.postsAnalyzed);
}

// Update the GPU utilization
function updateGpuUtilization() {
    const gpuUtilizationElement = document.getElementById('gpu-utilization');
    const gpuBarElement = document.getElementById('gpu-bar');
    
    // Update the GPU utilization every second
    setInterval(() => {
        // Calculate a new GPU utilization value that's somewhat close to the previous value
        // but with less variation to simulate more stable GPU usage
        let newValue = feedState.progressState.gpuUtilization;
        
        // 85% chance to move in the same direction, 15% chance to change direction (more stable)
        const changeDirection = Math.random() > 0.85;
        
        // Current direction (1 for up, -1 for down)
        let direction = feedState.progressState.gpuDirection || 1;
        
        if (changeDirection) {
            direction *= -1;
        }
        
        // Store the direction for next time
        feedState.progressState.gpuDirection = direction;
        
        // Change by a smaller random amount between 1% and 5% (less variation)
        const change = Math.floor(Math.random() * 5) + 1;
        newValue += direction * change;
        
        // Keep within bounds (0-100%)
        newValue = Math.max(0, Math.min(100, newValue));
        
        // Update the state
        feedState.progressState.gpuUtilization = newValue;
        
        // Update the UI
        gpuUtilizationElement.textContent = `${newValue}%`;
        gpuBarElement.style.width = `${newValue}%`;
        
        // Change color based on utilization
        if (newValue < 30) {
            gpuBarElement.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        } else if (newValue < 70) {
            gpuBarElement.style.background = 'linear-gradient(90deg, #FFC107, #FF9800)';
        } else {
            gpuBarElement.style.background = 'linear-gradient(90deg, #FF5722, #F44336)';
        }
    }, 2000); // Update every 2 seconds (slower for more stability)
    
    // Set an initial value
    feedState.progressState.gpuUtilization = 35;
    gpuUtilizationElement.textContent = `${feedState.progressState.gpuUtilization}%`;
    gpuBarElement.style.width = `${feedState.progressState.gpuUtilization}%`;
}

// Start inference animation
function startInference(taskType) {
    const inferenceStatusElement = document.getElementById('inference-status');
    const inferenceProgressElement = document.getElementById('inference-progress');
    const postClassificationDot = document.querySelector('.post-classification-dot');
    const sentimentAnalysisDot = document.querySelector('.sentiment-analysis-dot');
    
    // Update state
    feedState.progressState.inferenceActive = true;
    feedState.progressState.activeTask = taskType;
    
    // Update UI
    inferenceStatusElement.textContent = 'Running';
    inferenceStatusElement.classList.add('active');
    
    // Set starting progress based on task type
    if (taskType === 'post-classification') {
        // Reset total progress for a new search
        feedState.progressState.totalInferenceProgress = 0;
        // Post classification is the first half (0-50%)
        feedState.progressState.inferenceProgress = 0;
        
        // Activate post classification dot
        postClassificationDot.classList.add('active');
        sentimentAnalysisDot.classList.remove('active');
    } else if (taskType === 'sentiment-analysis') {
        // Sentiment analysis is the second half (50-100%)
        feedState.progressState.inferenceProgress = 50;
        
        // Activate sentiment analysis dot
        sentimentAnalysisDot.classList.add('active');
        postClassificationDot.classList.add('active'); // Keep both active
    }
    
    // Update UI with current progress
    inferenceProgressElement.style.width = `${feedState.progressState.inferenceProgress}%`;
    
    // Start progress animation
    const progressInterval = setInterval(() => {
        // Increment progress
        feedState.progressState.inferenceProgress += 1;
        
        // Update UI
        inferenceProgressElement.style.width = `${feedState.progressState.inferenceProgress}%`;
        
        // Check if complete for this task
        if ((taskType === 'post-classification' && feedState.progressState.inferenceProgress >= 50) ||
            (taskType === 'sentiment-analysis' && feedState.progressState.inferenceProgress >= 100)) {
            clearInterval(progressInterval);
            
            // Only stop inference if we've completed sentiment analysis (the final task)
            if (taskType === 'sentiment-analysis') {
                stopInference();
            }
        }
    }, 50); // Update every 50ms for smooth animation
    
    // Store the interval ID for later cleanup
    feedState.progressState.progressInterval = progressInterval;
}

// Stop inference animation
function stopInference() {
    const inferenceStatusElement = document.getElementById('inference-status');
    const postClassificationDot = document.querySelector('.post-classification-dot');
    const sentimentAnalysisDot = document.querySelector('.sentiment-analysis-dot');
    
    // Update state
    feedState.progressState.inferenceActive = false;
    feedState.progressState.activeTask = null;
    
    // Update UI
    inferenceStatusElement.textContent = 'Idle';
    inferenceStatusElement.classList.remove('active');
    
    // Deactivate task dots
    postClassificationDot.classList.remove('active');
    sentimentAnalysisDot.classList.remove('active');
    
    // Clear interval if it exists
    if (feedState.progressState.progressInterval) {
        clearInterval(feedState.progressState.progressInterval);
        feedState.progressState.progressInterval = null;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Back to profile button
    document.getElementById('back-to-profile').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Filter input
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    
    filterButton.addEventListener('click', () => applyFilter());
    filterInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
        feedState.currentSort = e.target.value;
        sortPosts();
        renderPosts();
    });
    
    // Platform select
    document.getElementById('platform-select').addEventListener('change', (e) => {
        feedState.currentPlatformFilter = e.target.value;
        filterPosts();
        renderPosts();
    });
    
    // Make keywords clickable for filtering
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('keyword')) {
            filterInput.value = e.target.textContent;
            applyFilter(e.target.textContent);
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Submit feedback button
    document.getElementById('submit-feedback').addEventListener('click', submitFeedback);
    
    // Enable keyboard navigation
    initKeyboardNavigation();
}

// Load posts from the backend
async function loadPosts() {
    try {
        const feedContainer = document.getElementById('feed-container');
        feedContainer.innerHTML = '<div class="loading">Loading your personalized feed...</div>';
        
        // Fetch posts from the backend
        const result = await BackendConnector.fetchPosts();
        
        if (result && result.posts) {
            feedState.posts = result.posts;
            feedState.filteredPosts = [...feedState.posts];
            
            // Sort posts
            sortPosts();
            
            // Render posts
            renderPosts();
        } else {
            feedContainer.innerHTML = '<div class="no-results">No posts found. Try adjusting your filters or adding more social media accounts.</div>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('feed-container').innerHTML = `<div class="no-results">Error loading posts: ${error.message}</div>`;
    }
}

// Sort posts based on the current sort option
function sortPosts() {
    const { currentSort } = feedState;
    
    feedState.filteredPosts.sort((a, b) => {
        if (currentSort === 'rank') {
            return b.rank - a.rank;
        } else if (currentSort === 'date') {
            // Parse dates and compare
            const dateA = a.posted_at ? new Date(a.posted_at) : new Date(a.scraped_at);
            const dateB = b.posted_at ? new Date(b.posted_at) : new Date(b.scraped_at);
            return dateB - dateA;
        } else if (currentSort === 'likes') {
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            return likesB - likesA;
        } else if (currentSort === 'comments') {
            const commentsA = a.comments || 0;
            const commentsB = b.comments || 0;
            return commentsB - commentsA;
        }
        
        return 0;
    });
}

    // Filter posts based on the current platform filter
    function filterPosts(keyword = null) {
        const { currentPlatformFilter, posts } = feedState;
        
        // Start with all posts
        let filtered = [...posts];
        
        // Apply platform filter
        if (currentPlatformFilter !== 'all') {
            filtered = filtered.filter(post => post.platform === currentPlatformFilter);
        }
        
        // Apply keyword filter if provided
        if (keyword) {
            const lowercaseKeyword = keyword.toLowerCase();
            
            filtered = filtered.filter(post => {
                // Check if keyword is in post text
                if (post.post_text && post.post_text.toLowerCase().includes(lowercaseKeyword)) {
                    return true;
                }
                
                // Check if keyword is in post keywords (if keywords exist)
                if (post.keywords && Array.isArray(post.keywords) && post.keywords.length > 0) {
                    if (post.keywords.some(k => k && k.toLowerCase().includes(lowercaseKeyword))) {
                        return true;
                    }
                }
                
                // Check if keyword is in username
                if (post.username && post.username.toLowerCase().includes(lowercaseKeyword)) {
                    return true;
                }
                
                return false;
            });
        
        // Add to recent searches
        if (keyword.length > 0) {
            feedState.recentSearches.add(keyword);
            updateSearchSuggestions();
            saveSearchSuggestions();
        }
    }
    
    feedState.filteredPosts = filtered;
}

// Apply filter with loading indicator
async function applyFilter(filterValue) {
    // If not provided, get from input
    if (!filterValue) {
        filterValue = document.getElementById('filter-input').value.trim();
    }
    
    // Show loading indicator
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '<div class="loading">Searching for relevant posts...</div>';
    
    // Start post classification inference animation
    startInference('post-classification');
    
    try {
        // Use the user_posts_output.py script to find relevant posts
        const result = await BackendConnector.searchPosts(filterValue);
        
        if (result && result.success && result.posts && result.posts.length > 0) {
            // Update the feed state with the search results
            feedState.filteredPosts = result.posts;
            
            // If we have posts, start sentiment analysis inference animation
            if (result.posts.length > 0) {
                startInference('sentiment-analysis');
                
                // Simulate a delay for sentiment analysis (in a real app, this would be the actual API call time)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Store sentiment analysis if available
            if (result.sentimentAnalysis) {
                feedState.currentSentimentAnalysis = result.sentimentAnalysis;
            } else {
                feedState.currentSentimentAnalysis = null;
            }
            
            // Add to recent searches
            if (filterValue.length > 0) {
                feedState.recentSearches.add(filterValue);
                updateSearchSuggestions();
                saveSearchSuggestions();
            }
            
            // Sort posts
            sortPosts();
            
            // Render posts with sentiment analysis
            renderPosts();
        } else {
            // If no results from the search API, fall back to client-side filtering
            console.log('No results from search API, falling back to client-side filtering');
            
            // Apply filter
            filterPosts(filterValue);
            
            // Sort posts
            sortPosts();
            
            // Clear sentiment analysis
            feedState.currentSentimentAnalysis = null;
            
            // Render posts
            renderPosts();
            
            // Stop inference animation
            stopInference();
        }
    } catch (error) {
        console.error('Error searching posts:', error);
        
        // Stop any running inference animations
        stopInference();
        
        // Fall back to client-side filtering
        filterPosts(filterValue);
        sortPosts();
        feedState.currentSentimentAnalysis = null;
        renderPosts();
    }
}

// Render sentiment analysis summary
function renderSentimentAnalysis() {
    const { currentSentimentAnalysis } = feedState;
    
    // If no sentiment analysis is available, return null
    if (!currentSentimentAnalysis) {
        return null;
    }
    
    // Create sentiment analysis container
    const sentimentContainer = document.createElement('div');
    sentimentContainer.className = 'sentiment-analysis-container';
    
    // Determine sentiment class based on sentiment score
    let sentimentClass = 'neutral';
    if (currentSentimentAnalysis.sentiment_score >= 70) {
        sentimentClass = 'positive';
    } else if (currentSentimentAnalysis.sentiment_score <= 30) {
        sentimentClass = 'negative';
    } else if (currentSentimentAnalysis.sentiment === 'mixed') {
        sentimentClass = 'mixed';
    }
    
    // Create HTML for sentiment analysis
    sentimentContainer.innerHTML = `
        <div class="sentiment-header">
            <h2>Sentiment Analysis</h2>
            <div class="sentiment-badge ${sentimentClass}">
                ${currentSentimentAnalysis.sentiment.toUpperCase()}
                <span class="sentiment-score">${currentSentimentAnalysis.sentiment_score}/100</span>
            </div>
        </div>
        <div class="sentiment-summary">
            <p>${currentSentimentAnalysis.summary}</p>
        </div>
        <div class="sentiment-key-points">
            <h3>Key Points:</h3>
            <ul>
                ${currentSentimentAnalysis.key_points ? 
                    currentSentimentAnalysis.key_points.map(point => `<li>${point}</li>`).join('') : 
                    '<li>No key points available</li>'}
            </ul>
        </div>
    `;
    
    return sentimentContainer;
}

// Render posts in the feed
function renderPosts() {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '';
    
    const { filteredPosts } = feedState;
    
    if (filteredPosts.length === 0) {
        feedContainer.innerHTML = '<div class="no-results">No posts match your criteria. Try adjusting your filters.</div>';
        return;
    }
    
    // Render sentiment analysis if available
    const sentimentElement = renderSentimentAnalysis();
    if (sentimentElement) {
        feedContainer.appendChild(sentimentElement);
    }
    
    // Get the post template
    const template = document.getElementById('post-template');
    
    // Create a post element for each post
    filteredPosts.forEach((post, index) => {
        const postElement = createPostElement(post, template, index);
        feedContainer.appendChild(postElement);
    });
}

// Create a post element from the template
function createPostElement(post, template, index) {
    // Clone the template
    const postElement = template.content.cloneNode(true).querySelector('.post');
    
    // Set post data attributes
    postElement.dataset.id = post.id;
    postElement.dataset.index = index;
    
    // Set profile picture
    const profilePicture = postElement.querySelector('.profile-picture');
    profilePicture.src = post.profile_picture || DEFAULT_PROFILE_PICTURES[post.platform] || DEFAULT_PROFILE_PICTURES.twitter;
    profilePicture.alt = post.username;
    
    // Set username and date
    postElement.querySelector('.username').textContent = post.username;
    
    const postDate = postElement.querySelector('.post-date');
    if (post.posted_at && post.posted_at !== 'None') {
        postDate.textContent = formatDate(post.posted_at);
    } else {
        postDate.textContent = 'Date unknown';
    }
    
    // Set platform icon
    const platformIcon = postElement.querySelector('.platform-icon');
    if (post.platform === 'twitter') {
        platformIcon.className = 'fab fa-twitter twitter platform-icon';
    } else if (post.platform === 'instagram') {
        platformIcon.className = 'fab fa-instagram instagram platform-icon';
    } else if (post.platform === 'facebook') {
        platformIcon.className = 'fab fa-facebook facebook platform-icon';
    } else {
        platformIcon.className = 'fas fa-globe platform-icon';
    }
    
    // Set post content
    postElement.querySelector('.post-content').textContent = post.post_text;
    
    // Set post image if available
    const imageContainer = postElement.querySelector('.post-image-container');
    const postImage = postElement.querySelector('.post-image');
    
    if (post.image_url) {
        postImage.src = post.image_url;
        postImage.alt = 'Post image';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Set post keywords
    const keywordsContainer = postElement.querySelector('.post-keywords');
    if (post.keywords && Array.isArray(post.keywords) && post.keywords.length > 0) {
        post.keywords.forEach(keyword => {
            if (keyword) {  // Only add non-empty keywords
                const keywordElement = document.createElement('span');
                keywordElement.className = 'keyword';
                keywordElement.textContent = keyword;
                keywordsContainer.appendChild(keywordElement);
            }
        });
        
        // If no valid keywords were added, hide the container
        if (keywordsContainer.children.length === 0) {
            keywordsContainer.style.display = 'none';
        }
    } else {
        keywordsContainer.style.display = 'none';
    }
    
    // Set post metrics
    if (post.views) {
        postElement.querySelector('.views-count').textContent = formatNumber(post.views);
    } else {
        postElement.querySelector('.views-count').textContent = '-';
    }
    
    if (post.comments) {
        postElement.querySelector('.comments-count').textContent = formatNumber(post.comments);
    } else {
        postElement.querySelector('.comments-count').textContent = '-';
    }
    
    if (post.retweets) {
        postElement.querySelector('.retweets-count').textContent = formatNumber(post.retweets);
    } else {
        postElement.querySelector('.retweets-count').textContent = '-';
    }
    
    if (post.likes) {
        postElement.querySelector('.likes-count').textContent = formatNumber(post.likes);
    } else {
        postElement.querySelector('.likes-count').textContent = '-';
    }
    
    // Set up post actions
    const likeButton = postElement.querySelector('.like-button');
    const dislikeButton = postElement.querySelector('.dislike-button');
    const feedbackButton = postElement.querySelector('.feedback-button');
    
    // Check if post has been liked or disliked
    if (post.userInteraction === 1) {
        likeButton.classList.add('active');
    } else if (post.userInteraction === -1) {
        dislikeButton.classList.add('active');
    }
    
    // Add event listeners
    likeButton.addEventListener('click', () => {
        handleLike(post.id, index);
        simulateSwipeRight(postElement);
    });
    
    dislikeButton.addEventListener('click', () => {
        handleDislike(post.id, index);
        simulateSwipeLeft(postElement);
    });
    
    feedbackButton.addEventListener('click', () => {
        openFeedbackModal(post);
    });
    
    // Add click event listener for post header
    postElement.querySelector('.post-header').addEventListener('click', () => {
        openPostModal(post);
    });
    
    // Initialize swipe gestures
    initSwipeGesture(postElement, post.id, index);
    
    return postElement;
}

// Initialize swipe gesture on a post
function initSwipeGesture(postElement, postId, index) {
    const hammer = new Hammer(postElement);
    
    hammer.on('swipeleft', () => {
        handleDislike(postId, index);
        simulateSwipeLeft(postElement);
    });
    
    hammer.on('swiperight', () => {
        handleLike(postId, index);
        simulateSwipeRight(postElement);
    });
}

// Handle liking a post
function handleLike(postId, index) {
    // Update the post in the state
    feedState.posts[index].userInteraction = 1;
    
    // Submit feedback to the backend
    BackendConnector.submitFeedback(postId, 'like');
}

// Handle disliking a post
function handleDislike(postId, index) {
    // Update the post in the state
    feedState.posts[index].userInteraction = -1;
    
    // Submit feedback to the backend
    BackendConnector.submitFeedback(postId, 'dislike');
}

// Simulate swiping right (like)
function simulateSwipeRight(postElement) {
    // Show like feedback
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

// Simulate swiping left (dislike)
function simulateSwipeLeft(postElement) {
    // Show dislike feedback
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

// Open the post modal
function openPostModal(post) {
    const modal = document.getElementById('post-modal');
    const postDetailContainer = document.getElementById('post-detail-container');
    
    // Create post detail HTML
    postDetailContainer.innerHTML = `
        <div class="post-detail">
            <div class="post-detail-header">
                <img src="${post.profile_picture || DEFAULT_PROFILE_PICTURES[post.platform] || DEFAULT_PROFILE_PICTURES.twitter}" alt="${post.username}" class="post-detail-profile">
                <div class="post-detail-info">
                    <div class="post-detail-username">${post.username}</div>
                    <div class="post-detail-date">${formatDate(post.posted_at || post.scraped_at)}</div>
                </div>
                <i class="${getPlatformIconClass(post.platform)} post-detail-platform"></i>
            </div>
            
            <div class="post-detail-content">${post.post_text}</div>
            
            ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-detail-image">` : ''}
            
            <div class="post-detail-metrics">
                <div class="post-detail-metric">
                    <div class="metric-value">${formatNumber(post.views || 0)}</div>
                    <div class="metric-label">Views</div>
                </div>
                <div class="post-detail-metric">
                    <div class="metric-value">${formatNumber(post.comments || 0)}</div>
                    <div class="metric-label">Comments</div>
                </div>
                <div class="post-detail-metric">
                    <div class="metric-value">${formatNumber(post.retweets || 0)}</div>
                    <div class="metric-label">Retweets</div>
                </div>
                <div class="post-detail-metric">
                    <div class="metric-value">${formatNumber(post.likes || 0)}</div>
                    <div class="metric-label">Likes</div>
                </div>
            </div>
            
            <div class="post-detail-keywords">
                <h3>Keywords</h3>
                <div class="post-keywords">
                    ${post.keywords ? post.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('') : 'No keywords available'}
                </div>
            </div>
            
            <div class="post-detail-actions">
                <button class="post-detail-button detail-like-button ${post.userInteraction === 1 ? 'active' : ''}">
                    <i class="fas fa-heart"></i> Like
                </button>
                <button class="post-detail-button detail-dislike-button ${post.userInteraction === -1 ? 'active' : ''}">
                    <i class="fas fa-times"></i> Dislike
                </button>
                <button class="post-detail-button detail-feedback-button">
                    <i class="fas fa-comment-alt"></i> Feedback
                </button>
                <a href="${post.post_url}" target="_blank" class="post-detail-button detail-view-original">
                    <i class="fas fa-external-link-alt"></i> View Original
                </a>
            </div>
        </div>
    `;
    
    // Add event listeners to the buttons
    const index = feedState.posts.findIndex(p => p.id === post.id);
    
    const likeButton = postDetailContainer.querySelector('.detail-like-button');
    const dislikeButton = postDetailContainer.querySelector('.detail-dislike-button');
    const feedbackButton = postDetailContainer.querySelector('.detail-feedback-button');
    
    likeButton.addEventListener('click', () => {
        handleLike(post.id, index);
        likeButton.classList.add('active');
        dislikeButton.classList.remove('active');
    });
    
    dislikeButton.addEventListener('click', () => {
        handleDislike(post.id, index);
        dislikeButton.classList.add('active');
        likeButton.classList.remove('active');
    });
    
    feedbackButton.addEventListener('click', () => {
        modal.style.display = 'none';
        openFeedbackModal(post);
    });
    
    // Show the modal
    modal.style.display = 'block';
}

// Open the feedback modal
function openFeedbackModal(post) {
    const modal = document.getElementById('feedback-modal');
    const feedbackPostPreview = document.getElementById('feedback-post-preview');
    const feedbackText = document.getElementById('feedback-text');
    
    // Set the post preview
    feedbackPostPreview.textContent = post.post_text;
    
    // Clear any previous feedback
    feedbackText.value = '';
    
    // Set the post ID on the submit button
    document.getElementById('submit-feedback').dataset.postId = post.id;
    document.getElementById('submit-feedback').dataset.postIndex = feedState.posts.findIndex(p => p.id === post.id);
    
    // Show the modal
    modal.style.display = 'block';
}

// Submit feedback
function submitFeedback() {
    const feedbackText = document.getElementById('feedback-text').value.trim();
    const postId = parseInt(document.getElementById('submit-feedback').dataset.postId);
    const postIndex = parseInt(document.getElementById('submit-feedback').dataset.postIndex);
    
    if (feedbackText) {
        // Submit feedback to the backend
        BackendConnector.submitFeedback(postId, 'text', feedbackText);
        
        // Close the modal
        document.getElementById('feedback-modal').style.display = 'none';
        
        // Show a success message
        alert('Thank you for your feedback!');
    } else {
        alert('Please enter some feedback before submitting.');
    }
}

// Initialize keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        // Only handle arrow keys if no modal is open
        if (document.querySelector('.modal[style*="display: block"]')) {
            return;
        }
        
        const visiblePosts = Array.from(document.querySelectorAll('.post')).filter(post => post.style.display !== 'none');
        if (visiblePosts.length === 0) return;
        
        const firstVisiblePost = visiblePosts[0];
        const postId = parseInt(firstVisiblePost.dataset.id);
        const index = parseInt(firstVisiblePost.dataset.index);
        
        if (event.key === 'ArrowRight') {
            // Like with right arrow key
            handleLike(postId, index);
            simulateSwipeRight(firstVisiblePost);
        } else if (event.key === 'ArrowLeft') {
            // Dislike with left arrow key
            handleDislike(postId, index);
            simulateSwipeLeft(firstVisiblePost);
        } else if (event.key === 'ArrowUp') {
            // Open post detail with up arrow key
            const post = feedState.filteredPosts[index];
            openPostModal(post);
        } else if (event.key === 'ArrowDown') {
            // Open feedback modal with down arrow key
            const post = feedState.filteredPosts[index];
            openFeedbackModal(post);
        }
    });
}

// Create and update search suggestions
function updateSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    suggestionsContainer.innerHTML = '';
    
    // Combine recent searches with default suggestions
    let allSuggestions = [...feedState.recentSearches, ...feedState.defaultSuggestions];
    
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

// Load saved searches from localStorage
function loadSavedSearches() {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
        try {
            feedState.recentSearches = new Set(JSON.parse(savedSearches));
        } catch (e) {
            console.error('Error parsing saved searches:', e);
        }
    }
}

// Save search suggestions to localStorage
function saveSearchSuggestions() {
    localStorage.setItem('recentSearches', JSON.stringify([...feedState.recentSearches]));
}

// Helper function to get platform icon class
function getPlatformIconClass(platform) {
    if (platform === 'twitter') {
        return 'fab fa-twitter twitter';
    } else if (platform === 'instagram') {
        return 'fab fa-instagram instagram';
    } else if (platform === 'facebook') {
        return 'fab fa-facebook facebook';
    } else {
        return 'fas fa-globe';
    }
}

// Helper function to format numbers
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    
    // Always return the full number as a string
    return num.toString();
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString || dateString === 'None') return 'Date unknown';
    
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            // Try to parse Twitter-style dates like "14h" or "Feb 27"
            if (dateString.endsWith('h')) {
                const hours = parseInt(dateString);
                if (!isNaN(hours)) {
                    const now = new Date();
                    now.setHours(now.getHours() - hours);
                    return `${hours}h ago`;
                }
            } else if (dateString.includes(' ')) {
                // Format like "Feb 27"
                return dateString;
            }
            
            return dateString;
        }
        
        // Calculate time difference
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        // Format based on time difference
        if (diffDay > 30) {
            return date.toLocaleDateString();
        } else if (diffDay > 0) {
            return `${diffDay}d ago`;
        } else if (diffHour > 0) {
            return `${diffHour}h ago`;
        } else if (diffMin > 0) {
            return `${diffMin}m ago`;
        } else {
            return 'Just now';
        }
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}
