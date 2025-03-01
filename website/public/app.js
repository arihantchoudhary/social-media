// Initialize Twitter widgets API
window.twttr = (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0],
      t = window.twttr || {};
    if (d.getElementById(id)) return t;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    js.charset = "utf-8";
    fjs.parentNode.insertBefore(js, fjs);
  
    t._e = [];
    t.ready = function(f) {
      t._e.push(f);
    };
  
    return t;
  }(document, "script", "twitter-wjs"));
  
  // Function to determine platform from URL
  function getPlatform(url) {
      if (url.includes('twitter.com') || url.includes('x.com')) return { name: 'Twitter', icon: 'fab fa-twitter twitter' };
      if (url.includes('facebook.com')) return { name: 'Facebook', icon: 'fab fa-facebook facebook' };
      if (url.includes('instagram.com')) return { name: 'Instagram', icon: 'fab fa-instagram instagram' };
      return { name: 'Unknown', icon: 'fas fa-globe' };
  }
  
  // Global variables to track state
  let currentViewMode = 'all'; // 'all' or 'friends'
  let recentSearches = new Set();
  let defaultSuggestions = ['politics', 'wellness', 'astronomy', 'health'];
  
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
      if (post.accountUrl.includes('twitter.com') || post.accountUrl.includes('x.com')) {
        // Extract username from Twitter URL
        let username = '';
        if (post.accountUrl.includes('twitter.com/')) {
            username = post.accountUrl.split('twitter.com/')[1].replace(/\/$/, '');
        } else if (post.accountUrl.includes('x.com/')) {
            username = post.accountUrl.split('x.com/')[1].replace(/\/$/, '');
        }
        
        // Clean up username in case it has query parameters
        if (username.includes('?')) {
            username = username.split('?')[0];
        }
        
        console.log('Embedding Twitter timeline for:', username);
        
        // Clear previous content and show loading
        embeddedContent.innerHTML = '<div class="loading">Loading tweets...</div>';
        
        // Use the Twitter oEmbed API to get the proper embed code
        const encodedUrl = encodeURIComponent(`https://twitter.com/${username}`);
        fetch(`https://publish.twitter.com/oembed?url=${encodedUrl}&omit_script=false&chrome=nofooter&dnt=true`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // The HTML returned by the API includes the necessary script and properly formatted embed code
                embeddedContent.innerHTML = data.html;
                
                // Force script execution - necessary because inserting HTML with scripts doesn't execute them
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
          // Instagram embedding - using embed API
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
  
  // Function to create and update search suggestion buttons
  function updateSearchSuggestions() {
      console.log('Updating search suggestions');
      const suggestionsContainer = document.getElementById('search-suggestions');
      suggestionsContainer.innerHTML = '';
      
      // Combine recent searches with default suggestions
      let allSuggestions = [...recentSearches, ...defaultSuggestions];
      
      // Remove duplicates and limit to max 6 suggestions
      allSuggestions = [...new Set(allSuggestions)].slice(0, 6);
      
      console.log('Showing suggestions:', allSuggestions);
      
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
  
  // Function to render posts with optional view mode filter
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
          initSwipeGestures(postElement);
      });
  }
  
  // Function to perform semantic search using Anthropic API
  async function semanticSearch(query, allKeywords) {
      try {
          const searchStatus = document.createElement('div');
          searchStatus.className = 'search-status api-searching';
          searchStatus.textContent = 'Searching with AI...';
          document.querySelector('.search-container').appendChild(searchStatus);
          
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
          
          // Remove the status indicator
          searchStatus.remove();
          
          if (!response.ok) {
              throw new Error('Failed to get semantic search results');
          }
          
          const data = await response.json();
          console.log('API returned related keywords:', data.relatedKeywords);
          
          // Add a status message showing which keywords were found
          const statusMessage = document.createElement('div');
          statusMessage.className = 'search-status';
          statusMessage.textContent = `Related terms: ${data.relatedKeywords.join(', ')}`;
          document.querySelector('.search-container').appendChild(statusMessage);
          
          // Remove status after 5 seconds
          setTimeout(() => {
              statusMessage.remove();
          }, 5000);
          
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
      
      // Add to recent searches
      if (keyword.length > 0) {
          recentSearches.add(keyword);
          updateSearchSuggestions();
      }
      
      // First try direct keyword matches
      const directMatches = postsData.filter(post => {
          const postKeywords = post.keywords.map(k => k.toLowerCase());
          return postKeywords.some(k => k.includes(keyword) || keyword.includes(k));
      });
      
      // Also match on post content
      const contentMatches = postsData.filter(post => 
          post.summary.toLowerCase().includes(keyword)
      );
      
      // Combine direct and content matches
      let matches = [...new Set([...directMatches, ...contentMatches])];
      
      // If we have enough matches, return them
      if (matches.length > 0) {
          return matches;
      }
      
      // Otherwise, try semantic search if server is running
      try {
          const allKeywords = getAllKeywords();
          const relatedKeywords = await semanticSearch(keyword, allKeywords);
          
          if (relatedKeywords && relatedKeywords.length > 0) {
              // Filter posts by the related keywords
              const semanticMatches = postsData.filter(post => {
                  const postKeywords = post.keywords.map(k => k.toLowerCase());
                  return postKeywords.some(k => 
                      relatedKeywords.some(rk => k.includes(rk.toLowerCase()) || rk.toLowerCase().includes(k))
                  );
              });
              
              return semanticMatches;
          }
      } catch (error) {
          console.error('Error during semantic search:', error);
      }
      
      // If no matches at all, return empty array
      return [];
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
  
  // Function to set up view toggle
  function initViewToggle() {
      const friendsToggle = document.getElementById('friends-toggle');
      
      friendsToggle.addEventListener('change', () => {
          currentViewMode = friendsToggle.checked ? 'friends' : 'all';
          
          // Re-apply any current filter
          const filterValue = document.getElementById('filter-input').value.trim();
          if (filterValue) {
              applyFilter(filterValue);
          } else {
              renderPosts(postsData);
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
  
  // Function to load saved search suggestions
  function loadSearchSuggestions() {
      const savedSuggestions = localStorage.getItem('recentSearches');
      
      if (savedSuggestions) {
          try {
              recentSearches = new Set(JSON.parse(savedSuggestions));
              console.log('Loaded saved search suggestions:', recentSearches);
          } catch (e) {
              console.error('Error loading saved search suggestions:', e);
          }
      }
  }
  
  // Function to save search suggestions
  function saveSearchSuggestions() {
      localStorage.setItem('recentSearches', JSON.stringify([...recentSearches]));
  }
  
  // Function to apply filter with loading indicator
  async function applyFilter(filterValue) {
      // If not provided, get from input
      if (!filterValue) {
          filterValue = document.getElementById('filter-input').value.trim();
      }
      
      // Show loading indicator
      const feedContainer = document.getElementById('feed-container');
      feedContainer.innerHTML = '<div class="loading-message">Searching posts...</div>';
      
      // Get filtered posts
      const filteredPosts = await filterPosts(filterValue);
      renderPosts(filteredPosts);
      
      // Save search suggestions
      saveSearchSuggestions();
  }
  
  // Function to check if Twitter widgets API is loaded
  function ensureTwitterWidgetsLoaded() {
      if (!window.twttr || !window.twttr.widgets) {
          console.log("Twitter widgets not loaded yet, adding script");
          const script = document.createElement('script');
          script.src = "https://platform.twitter.com/widgets.js";
          script.async = true;
          script.charset = "utf-8";
          document.head.appendChild(script);
      } else {
          console.log("Twitter widgets already loaded");
      }
  }
  
  // Initialize the feed with all posts
  document.addEventListener('DOMContentLoaded', () => {
      console.log('Document loaded, initializing...');
      
      // Ensure Twitter widgets are loaded
      ensureTwitterWidgetsLoaded();
      
      // Load any saved data
      loadPostsData();
      loadSearchSuggestions();
      
      // Sort posts by rank score (highest to lowest)
      postsData.sort((a, b) => b.rank - a.rank);
      
      // Initialize view toggle
      initViewToggle();
      
      // Initialize search suggestions
      updateSearchSuggestions();
      
      // Render the posts
      renderPosts(postsData);
      
      // Initialize keyboard navigation
      initKeyboardNavigation();
      
      // Add event listener for filter input
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
      
      console.log('Initialization complete!');
  });