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

// Function to save posts data (in a real app, this would save to a server or localStorage)
function savePostsData() {
    // For demonstration, we'll log to console
    console.log('Posts data updated:', postsData);
    
    // In a real implementation, you might use localStorage:
    localStorage.setItem('postsData', JSON.stringify(postsData));
}

// Function to open the account modal
function openAccountModal(post) {
    const modal = document.getElementById('account-modal');
    const modalUsername = document.getElementById('modal-username');
    const embeddedContent = document.getElementById('embedded-content');
    
    modalUsername.textContent = post.username;
    
    // Create embedded content based on platform
    if (post.accountUrl.includes('twitter.com')) {
        // Twitter embedding
        const username = post.accountUrl.split('twitter.com/')[1];
        embeddedContent.innerHTML = `
            <a class="twitter-timeline" href="https://twitter.com/${username}">Tweets by ${post.username}</a>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        `;
    } else if (post.accountUrl.includes('instagram.com')) {
        // Instagram embedding
        const username = post.accountUrl.split('instagram.com/')[1].replace(/\/$/, '');
        embeddedContent.innerHTML = `
            <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/${username}/" 
              style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px);
              width:calc(100% - 2px); margin: 0 auto;">
              <div style="padding:16px;"> <a href="https://www.instagram.com/${username}/" 
                style="background:#FFFFFF; line-height:0; padding:0 0; text-align:center; 
                text-decoration:none; width:100%;" target="_blank">
                <div style="display: flex; flex-direction: row; align-items: center;">
                  <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div>
                  <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;">
                    <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div>
                    <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div>
                  </div>
                </div>
                <div style="padding: 19% 0;"></div>
                <div style="display:block; height:50px; margin:0 auto 12px; width:50px;">
                  <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink">
                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                      <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                        <g>
                          <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>
                <div style="padding-top: 8px;">
                  <div style="color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">View this profile on Instagram</div>
                </div>
                <div style="padding: 12.5% 0;"></div>
                <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;">
                  <div>
                    <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div>
                    <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div>
                    <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div>
                  </div>
                  <div style="margin-left: 8px;">
                    <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div>
                    <div style="width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div>
                  </div>
                  <div style="margin-left: auto;">
                    <div style="width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div>
                    <div style="background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div>
                    <div style="width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;">
                  <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div>
                  <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div>
                </div>
              </a>
            </div>
            </blockquote>
            <script async src="//www.instagram.com/embed.js"></script>
        `;
    } else {
        // Generic embedding for other platforms
        embeddedContent.innerHTML = `
            <iframe src="${post.accountUrl}" title="${post.username}'s profile"></iframe>
        `;
    }
    
    modal.style.display = 'block';
    
    // Add event listener for closing the modal
    const closeButton = document.querySelector('.close-modal');
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
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

// Function to filter posts
function filterPosts(keyword) {
    if (!keyword) {
        return postsData;
    }
    
    keyword = keyword.toLowerCase();
    return postsData.filter(post => {
        const keywords = post.keywords.map(k => k.toLowerCase());
        return keywords.some(k => k.includes(keyword));
    });
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

// Function to load posts data (in a real app, this would retrieve from a server or localStorage)
function loadPostsData() {
    // Check if we have saved data in localStorage
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
    
    function applyFilter() {
        const filterValue = filterInput.value.trim();
        const filteredPosts = filterPosts(filterValue);
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