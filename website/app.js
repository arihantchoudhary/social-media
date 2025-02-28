// Sample database with 5 real Twitter posts
const posts = [
    {
        url: "https://twitter.com/elonmusk/status/1445046980998483968",
        summary: "A lot of people don't realize that the President of the United States can launch nukes at will. No need for approval from Congress or anyone. This needs to change.",
        keywords: ["politics", "nuclear weapons", "President", "United States"],
        rank: 95
    },
    {
        url: "https://twitter.com/BillGates/status/1442908542798258177",
        summary: "60 million people die each year. More than two-thirds of those deaths are from age-related diseases. If we could reduce that by just 10%, it would save an additional 4 million lives a year.",
        keywords: ["health", "aging", "mortality", "research"],
        rank: 92
    },
    {
        url: "https://twitter.com/BarackObama/status/1444367348225445890",
        summary: "When our kids tell us that climate change is real and they're scared about what it means for their future, we need to listen. Their generation will have to deal with the consequences of our actions—or inaction—today.",
        keywords: ["climate change", "future", "children", "environment"],
        rank: 88
    },
    {
        url: "https://twitter.com/NatGeo/status/1445783276885504001",
        summary: "The world's second-largest rainforest is located in the Congo Basin. It's home to forest elephants, gorillas, okapis, and many more species found nowhere else on Earth.",
        keywords: ["rainforest", "Congo", "wildlife", "conservation"],
        rank: 85
    },
    {
        url: "https://twitter.com/NASA/status/1445509856694190080",
        summary: "What's up in the night sky this month? Look up to see the annual Orionid meteor shower, the best view of distant Uranus, and an interesting gathering of the Moon and planets.",
        keywords: ["astronomy", "meteor shower", "planets", "night sky"],
        rank: 82
    }
];

// Sort posts by rank score (highest to lowest)
posts.sort((a, b) => b.rank - a.rank);

// Function to determine platform from URL
function getPlatform(url) {
    if (url.includes('twitter.com')) return { name: 'Twitter', icon: 'fab fa-twitter twitter' };
    if (url.includes('facebook.com')) return { name: 'Facebook', icon: 'fab fa-facebook facebook' };
    if (url.includes('instagram.com')) return { name: 'Instagram', icon: 'fab fa-instagram instagram' };
    return { name: 'Unknown', icon: 'fas fa-globe' };
}

// Function to create a post element
function createPostElement(post) {
    const platform = getPlatform(post.url);
    
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.keywords = post.keywords.join(',').toLowerCase();
    
    postElement.innerHTML = `
        <div class="post-header">
            <i class="${platform.icon} platform-icon"></i>
            <span>${platform.name}</span>
        </div>
        <div class="post-body">
            <div class="post-content">${post.summary}</div>
            <div class="post-keywords">
                ${post.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
            </div>
        </div>
        <div class="post-actions">
            <button class="like-button"><i class="fas fa-heart"></i> Like</button>
            <button class="dislike-button"><i class="fas fa-times"></i> Dislike</button>
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
        simulateSwipeRight(postElement);
    });
    
    dislikeButton.addEventListener('click', () => {
        simulateSwipeLeft(postElement);
    });
    
    return postElement;
}

// Function to initialize swipe gestures
function initSwipeGestures(postElement) {
    const hammer = new Hammer(postElement);
    
    hammer.on('swipeleft', () => {
        simulateSwipeLeft(postElement);
    });
    
    hammer.on('swiperight', () => {
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
    
    postsToRender.forEach(post => {
        const postElement = createPostElement(post);
        feedContainer.appendChild(postElement);
        initSwipeGestures(postElement);
    });
}

// Function to filter posts
function filterPosts(keyword) {
    if (!keyword) {
        return posts;
    }
    
    keyword = keyword.toLowerCase();
    return posts.filter(post => {
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
        
        if (event.key === 'ArrowRight') {
            // Like with right arrow key
            simulateSwipeRight(firstVisiblePost);
        } else if (event.key === 'ArrowLeft') {
            // Dislike with left arrow key
            simulateSwipeLeft(firstVisiblePost);
        }
    });
}

// Initialize the feed with all posts
document.addEventListener('DOMContentLoaded', () => {
    renderPosts(posts);
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