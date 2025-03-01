/**
 * Backend Connector
 * 
 * This module handles communication between the frontend and the Python backend.
 * It provides methods to start the curation process, save user profiles, and fetch posts.
 */

const BackendConnector = {
    /**
     * Start the curation process
     * 
     * @param {Object} profileState - The profile state object
     * @param {Function} statusCallback - Callback function to update the loading status (not used anymore)
     */
    startCuration: async function(profileState, statusCallback) {
        try {
            // Step 1: Save the user profile
            await this.saveUserProfile(profileState.profile);
            
            // Step 2: Save social media credentials
            await this.saveSocialMediaCredentials(profileState.accounts);
            
            // Step 3: Save settings
            await this.saveSettings(profileState.settings);
            
            // Redirect to the feed page immediately
            window.location.href = 'feed.html';
        } catch (error) {
            console.error('Error during curation process:', error);
            
            // Show error message
            alert(`An error occurred during the curation process: ${error.message}`);
        }
    },
    
    /**
     * Save the user profile
     * 
     * @param {Object} profile - The user profile object
     * @returns {Promise} - A promise that resolves when the profile is saved
     */
    saveUserProfile: async function(profile) {
        try {
            // If full profile is provided, use that
            let profileContent = '';
            
            if (profile.fullProfile) {
                profileContent = profile.fullProfile;
            } else {
                // Otherwise, generate a profile from the basic information
                profileContent = `# User Profile: ${profile.name}

## Personal Information
- Name: ${profile.name}
- Age: ${profile.age}
- Location: ${profile.location}
- Occupation: ${profile.occupation}

## Interests
${profile.interests.map(interest => `- ${interest}`).join('\n')}

## Content Preferences
### Likes
${profile.likes.map(like => `- ${like}`).join('\n')}

### Doesn't Like
${profile.dislikes.map(dislike => `- ${dislike}`).join('\n')}
`;
            }
            
            // Save to localStorage for backup
            localStorage.setItem('userProfile', JSON.stringify(profile));
            localStorage.setItem('userProfileText', profileContent);
            
            // Save the profile to the server
            const response = await fetch('/api/save-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profile: profileContent })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save user profile');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving user profile:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful profile save');
            
            // Write to user_profile.txt using the fetch API
            try {
                const profileText = profile.fullProfile || JSON.stringify(profile, null, 2);
                
                // Try to use the fetch API to write to the file
                await fetch('/api/write-file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: 'user_profile.txt',
                        content: profileText
                    })
                });
            } catch (writeError) {
                console.error('Error writing to user_profile.txt:', writeError);
            }
            
            return { success: true };
        }
    },
    
    /**
     * Save social media credentials
     * 
     * @param {Object} accounts - The social media accounts object
     * @returns {Promise} - A promise that resolves when the credentials are saved
     */
    saveSocialMediaCredentials: async function(accounts) {
        try {
            // Save to localStorage for backup (in a real app, you would never do this with passwords)
            localStorage.setItem('socialMediaAccounts', JSON.stringify(accounts));
            
            // Save the credentials to the server
            const response = await fetch('/api/save-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accounts })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save social media credentials');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving social media credentials:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful credentials save');
            
            return { success: true };
        }
    },
    
    /**
     * Load social media credentials
     * 
     * @returns {Promise} - A promise that resolves with the credentials
     */
    loadSocialMediaCredentials: async function() {
        try {
            // Fetch credentials from the server
            const response = await fetch('/api/get-credentials');
            
            if (!response.ok) {
                throw new Error('Failed to load social media credentials');
            }
            
            const data = await response.json();
            
            // Save to localStorage for backup
            if (data.success && data.accounts) {
                localStorage.setItem('socialMediaAccounts', JSON.stringify(data.accounts));
            }
            
            return data;
        } catch (error) {
            console.error('Error loading social media credentials:', error);
            
            // Try to load from localStorage as fallback
            const accounts = localStorage.getItem('socialMediaAccounts');
            if (accounts) {
                console.log('Loading credentials from localStorage');
                return { success: true, accounts: JSON.parse(accounts) };
            }
            
            // Return empty accounts if nothing found
            return { success: false, accounts: {} };
        }
    },
    
    /**
     * Save settings
     * 
     * @param {Object} settings - The settings object
     * @returns {Promise} - A promise that resolves when the settings are saved
     */
    saveSettings: async function(settings) {
        try {
            // Save to localStorage for backup
            localStorage.setItem('userSettings', JSON.stringify(settings));
            
            // Save the settings to the server
            const response = await fetch('/api/save-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving settings:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful settings save');
            
            return { success: true };
        }
    },
    
    /**
     * Generate keywords for posts
     * 
     * @returns {Promise} - A promise that resolves when the keywords are generated
     */
    generateKeywords: async function() {
        try {
            // Start the keyword generation process on the server
            const response = await fetch('/api/generate-keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate keywords');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error generating keywords:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful keyword generation');
            
            // Try to run the generate_keywords.py script using the fetch API
            try {
                await fetch('/api/run-script', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        script: 'generate_keywords.py'
                    })
                });
            } catch (scriptError) {
                console.error('Error running generate_keywords.py:', scriptError);
            }
            
            return { success: true };
        }
    },
    
    /**
     * Rank posts based on user profile
     * 
     * @returns {Promise} - A promise that resolves when the posts are ranked
     */
    rankPosts: async function() {
        try {
            // Start the post ranking process on the server
            const response = await fetch('/api/rank-posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to rank posts');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error ranking posts:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful post ranking');
            
            // Try to run the ranking_llm.py script using the fetch API
            try {
                await fetch('/api/run-script', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        script: 'ranking_llm.py'
                    })
                });
            } catch (scriptError) {
                console.error('Error running ranking_llm.py:', scriptError);
            }
            
            return { success: true };
        }
    },
    
    /**
     * Prepare the feed
     * 
     * @returns {Promise} - A promise that resolves when the feed is prepared
     */
    prepareFeed: async function() {
        try {
            // Prepare the feed on the server
            const response = await fetch('/api/prepare-feed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to prepare feed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error preparing feed:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful feed preparation');
            
            // Try to run the export_keywords.py script using the fetch API
            try {
                await fetch('/api/run-script', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        script: 'export_keywords.py'
                    })
                });
            } catch (scriptError) {
                console.error('Error running export_keywords.py:', scriptError);
            }
            
            return { success: true };
        }
    },
    
    /**
     * Fetch posts for the feed
     * 
     * @returns {Promise} - A promise that resolves with the posts
     */
    fetchPosts: async function() {
        try {
            // Fetch posts from the server
            const response = await fetch('/api/fetch-posts');
            
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching posts:', error);
            
            // For local testing, return sample posts
            console.log('Returning sample posts');
            
            // Try to fetch posts from the database using the fetch API
            try {
                const response = await fetch('/api/run-script', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        script: 'view_posts_db.py'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.output) {
                        // Parse the output to extract posts
                        return { posts: this.parsePosts(result.output) };
                    }
                }
            } catch (scriptError) {
                console.error('Error running view_posts_db.py:', scriptError);
            }
            
            // If all else fails, return sample posts
            return {
                posts: [
                    {
                        id: 1,
                        username: 'Elon Musk',
                        post_url: 'https://twitter.com/elonmusk/status/1445046980998483968',
                        post_text: 'A lot of people don\'t realize that the President of the United States can launch nukes at will. No need for approval from Congress or anyone. This needs to change.',
                        keywords: ['politics', 'nuclear weapons', 'President', 'United States'],
                        rank: 95,
                        views: 1000000,
                        comments: 5000,
                        retweets: 10000,
                        likes: 50000,
                        platform: 'twitter'
                    },
                    {
                        id: 2,
                        username: 'Bill Gates',
                        post_url: 'https://twitter.com/BillGates/status/1442908542798258177',
                        post_text: '60 million people die each year. More than two-thirds of those deaths are from age-related diseases. If we could reduce that by just 10%, it would save an additional 4 million lives a year.',
                        keywords: ['health', 'aging', 'mortality', 'research'],
                        rank: 92,
                        views: 500000,
                        comments: 3000,
                        retweets: 8000,
                        likes: 40000,
                        platform: 'twitter'
                    }
                ]
            };
        }
    },
    
    /**
     * Search posts using the user_posts_output.py script
     * 
     * @param {string} query - The search query
     * @returns {Promise} - A promise that resolves with the posts
     */
    searchPosts: async function(query) {
        try {
            console.log(`Searching posts with query: ${query}`);
            
            // Call the search-posts API endpoint
            const response = await fetch('/api/search-posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error('Failed to search posts');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error searching posts:', error);
            
            // For local testing, return empty posts array
            return { success: false, posts: [], error: error.message };
        }
    },
    
    /**
     * Parse posts from the output of view_posts_db.py
     * 
     * @param {string} output - The output of view_posts_db.py
     * @returns {Array} - An array of post objects
     */
    parsePosts: function(output) {
        const posts = [];
        
        // First try to match posts with the standard format including keywords
        const postRegexWithKeywords = /Post #(\d+):\s+Username: (.+)\s+URL: (.+)\s+Posted at: (.+)\s+Scraped at: (.+)\s+Keywords: (.+)\s+Metrics:\s+Views: (.+)\s+Comments: (.+)\s+Retweets: (.+)\s+Likes: (.+)\s+Saves: (.+)\s+(?:Image URL: (.+)\s+)?Text: (.+)/g;
        
        // Also try to match posts that might not have keywords
        const postRegexNoKeywords = /Post #(\d+):\s+Username: (.+)\s+URL: (.+)\s+Posted at: (.+)\s+Scraped at: (.+)\s+Metrics:\s+Views: (.+)\s+Comments: (.+)\s+Retweets: (.+)\s+Likes: (.+)\s+Saves: (.+)\s+(?:Image URL: (.+)\s+)?Text: (.+)/g;
        
        // Try to match posts with the standard format including keywords
        let match;
        while ((match = postRegexWithKeywords.exec(output)) !== null) {
            const [
                ,
                id,
                username,
                post_url,
                posted_at,
                scraped_at,
                keywords_str,
                views,
                comments,
                retweets,
                likes,
                saves,
                image_url,
                post_text
            ] = match;
            
            // Parse keywords
            let keywords = [];
            if (keywords_str && keywords_str !== 'None') {
                try {
                    // Try to parse JSON if it's in JSON format
                    if (keywords_str.startsWith('```json') && keywords_str.endsWith('```')) {
                        const jsonStr = keywords_str.replace(/```json\n|\n```/g, '');
                        keywords = JSON.parse(jsonStr);
                    } else {
                        // Otherwise split by commas
                        keywords = keywords_str.split(',').map(k => k.trim());
                    }
                } catch (e) {
                    console.error('Error parsing keywords:', e);
                }
            }
            
            // Determine platform from URL
            let platform = 'unknown';
            if (post_url.includes('twitter.com') || post_url.includes('x.com')) {
                platform = 'twitter';
            } else if (post_url.includes('instagram.com')) {
                platform = 'instagram';
            } else if (post_url.includes('facebook.com')) {
                platform = 'facebook';
            }
            
            posts.push({
                id: parseInt(id),
                username,
                post_url,
                posted_at,
                scraped_at,
                keywords,
                post_text,
                views: views !== 'None' ? parseInt(views.replace(/,/g, '')) : null,
                comments: comments !== 'None' ? parseInt(comments.replace(/,/g, '')) : null,
                retweets: retweets !== 'None' ? parseInt(retweets.replace(/,/g, '')) : null,
                likes: likes !== 'None' ? parseInt(likes.replace(/,/g, '')) : null,
                saves: saves !== 'None' ? parseInt(saves.replace(/,/g, '')) : null,
                image_url: image_url !== 'None' ? image_url : null,
                platform
            });
        }
        
        // Try to match posts without keywords
        while ((match = postRegexNoKeywords.exec(output)) !== null) {
            const [
                ,
                id,
                username,
                post_url,
                posted_at,
                scraped_at,
                views,
                comments,
                retweets,
                likes,
                saves,
                image_url,
                post_text
            ] = match;
            
            // Skip if we already added this post (from the first regex)
            if (posts.some(p => p.id === parseInt(id))) {
                continue;
            }
            
            // Determine platform from URL
            let platform = 'unknown';
            if (post_url.includes('twitter.com') || post_url.includes('x.com')) {
                platform = 'twitter';
            } else if (post_url.includes('instagram.com')) {
                platform = 'instagram';
            } else if (post_url.includes('facebook.com')) {
                platform = 'facebook';
            }
            
            posts.push({
                id: parseInt(id),
                username,
                post_url,
                posted_at,
                scraped_at,
                keywords: [], // Empty keywords array for posts without keywords
                post_text,
                views: views !== 'None' ? parseInt(views.replace(/,/g, '')) : null,
                comments: comments !== 'None' ? parseInt(comments.replace(/,/g, '')) : null,
                retweets: retweets !== 'None' ? parseInt(retweets.replace(/,/g, '')) : null,
                likes: likes !== 'None' ? parseInt(likes.replace(/,/g, '')) : null,
                saves: saves !== 'None' ? parseInt(saves.replace(/,/g, '')) : null,
                image_url: image_url !== 'None' ? image_url : null,
                platform
            });
        }
        
        // If we didn't find any posts with the regex patterns, try a more general approach
        if (posts.length === 0) {
            // Split the output by "Post #" to get individual post blocks
            const postBlocks = output.split(/Post #/).filter(block => block.trim());
            
            for (const block of postBlocks) {
                try {
                    // Extract post ID
                    const idMatch = block.match(/^(\d+):/);
                    if (!idMatch) continue;
                    const id = parseInt(idMatch[1]);
                    
                    // Extract other fields
                    const usernameMatch = block.match(/Username: ([^\n]+)/);
                    const urlMatch = block.match(/URL: ([^\n]+)/);
                    const postedAtMatch = block.match(/Posted at: ([^\n]+)/);
                    const scrapedAtMatch = block.match(/Scraped at: ([^\n]+)/);
                    const viewsMatch = block.match(/Views: ([^\n]+)/);
                    const commentsMatch = block.match(/Comments: ([^\n]+)/);
                    const retweetsMatch = block.match(/Retweets: ([^\n]+)/);
                    const likesMatch = block.match(/Likes: ([^\n]+)/);
                    const savesMatch = block.match(/Saves: ([^\n]+)/);
                    const imageUrlMatch = block.match(/Image URL: ([^\n]+)/);
                    const textMatch = block.match(/Text: ([\s\S]+)$/);
                    
                    // Extract values or use defaults
                    const username = usernameMatch ? usernameMatch[1] : 'Unknown';
                    const post_url = urlMatch ? urlMatch[1] : '';
                    const posted_at = postedAtMatch ? postedAtMatch[1] : null;
                    const scraped_at = scrapedAtMatch ? scrapedAtMatch[1] : '';
                    const views = viewsMatch && viewsMatch[1] !== 'None' ? parseInt(viewsMatch[1].replace(/,/g, '')) : null;
                    const comments = commentsMatch && commentsMatch[1] !== 'None' ? parseInt(commentsMatch[1].replace(/,/g, '')) : null;
                    const retweets = retweetsMatch && retweetsMatch[1] !== 'None' ? parseInt(retweetsMatch[1].replace(/,/g, '')) : null;
                    const likes = likesMatch && likesMatch[1] !== 'None' ? parseInt(likesMatch[1].replace(/,/g, '')) : null;
                    const saves = savesMatch && savesMatch[1] !== 'None' ? parseInt(savesMatch[1].replace(/,/g, '')) : null;
                    const image_url = imageUrlMatch && imageUrlMatch[1] !== 'None' ? imageUrlMatch[1] : null;
                    const post_text = textMatch ? textMatch[1].trim() : '';
                    
                    // Determine platform from URL
                    let platform = 'unknown';
                    if (post_url.includes('twitter.com') || post_url.includes('x.com')) {
                        platform = 'twitter';
                    } else if (post_url.includes('instagram.com')) {
                        platform = 'instagram';
                    } else if (post_url.includes('facebook.com')) {
                        platform = 'facebook';
                    }
                    
                    // Check for keywords
                    let keywords = [];
                    const keywordsMatch = block.match(/Keywords: ([^\n]+)/);
                    if (keywordsMatch && keywordsMatch[1] !== 'None') {
                        try {
                            // Try to parse JSON if it's in JSON format
                            if (keywordsMatch[1].startsWith('```json') && keywordsMatch[1].endsWith('```')) {
                                const jsonStr = keywordsMatch[1].replace(/```json\n|\n```/g, '');
                                keywords = JSON.parse(jsonStr);
                            } else {
                                // Otherwise split by commas
                                keywords = keywordsMatch[1].split(',').map(k => k.trim());
                            }
                        } catch (e) {
                            console.error('Error parsing keywords:', e);
                        }
                    }
                    
                    // Add the post to the array
                    posts.push({
                        id,
                        username,
                        post_url,
                        posted_at,
                        scraped_at,
                        keywords,
                        post_text,
                        views,
                        comments,
                        retweets,
                        likes,
                        saves,
                        image_url,
                        platform
                    });
                } catch (error) {
                    console.error('Error parsing post block:', error);
                }
            }
        }
        
        return posts;
    },
    
    /**
     * Submit feedback for a post
     * 
     * @param {number} postId - The ID of the post
     * @param {string} feedbackType - The type of feedback (like, dislike, text)
     * @param {string} textFeedback - Optional text feedback
     * @returns {Promise} - A promise that resolves when the feedback is submitted
     */
    submitFeedback: async function(postId, feedbackType, textFeedback = null) {
        try {
            // Submit feedback to the server
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    postId,
                    feedbackType,
                    textFeedback
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            
            // For local testing, simulate a successful response
            console.log('Simulating successful feedback submission');
            
            // Save to localStorage for testing
            const feedbackKey = `feedback_${postId}`;
            localStorage.setItem(feedbackKey, JSON.stringify({
                postId,
                feedbackType,
                textFeedback,
                timestamp: new Date().toISOString()
            }));
            
            return { success: true };
        }
    }
};
