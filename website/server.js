const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// API endpoint to save user profile
app.post('/api/save-profile', (req, res) => {
    try {
        const { profile } = req.body;
        
        if (!profile) {
            return res.status(400).json({ error: 'Profile data is required' });
        }
        
        // Write profile to user_profile.txt
        fs.writeFileSync(path.join(__dirname, '..', 'user_profile.txt'), profile);
        
        // Store the profile in memory for use with other scripts
        global.userProfile = profile;
        
        console.log('User profile saved successfully');
        
        res.json({ success: true, message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// API endpoint to save social media credentials
app.post('/api/save-credentials', (req, res) => {
    try {
        const { accounts } = req.body;
        
        if (!accounts) {
            return res.status(400).json({ error: 'Account data is required' });
        }
        
        // In a real app, you would securely store these credentials
        // For this demo, we'll just acknowledge receipt
        console.log('Received social media credentials');
        
        res.json({ success: true, message: 'Credentials received' });
    } catch (error) {
        console.error('Error saving credentials:', error);
        res.status(500).json({ error: 'Failed to save credentials' });
    }
});

// API endpoint to start scraping
app.post('/api/start-scraping', (req, res) => {
    try {
        const { accounts, postCount } = req.body;
        
        // Execute the social_media_scraper.py script
        const command = `python ${path.join(__dirname, '..', 'social_media_scraper.py')} --count=${postCount || 10}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute scraping script' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            res.json({ success: true, message: 'Scraping completed', output: stdout });
        });
    } catch (error) {
        console.error('Error starting scraping:', error);
        res.status(500).json({ error: 'Failed to start scraping' });
    }
});

// API endpoint to generate keywords
app.post('/api/generate-keywords', (req, res) => {
    try {
        // Execute the generate_keywords.py script
        const command = `python ${path.join(__dirname, '..', 'generate_keywords.py')}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute keyword generation script' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            res.json({ success: true, message: 'Keywords generated', output: stdout });
        });
    } catch (error) {
        console.error('Error generating keywords:', error);
        res.status(500).json({ error: 'Failed to generate keywords' });
    }
});

// API endpoint to save settings
app.post('/api/save-settings', (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings) {
            return res.status(400).json({ error: 'Settings data is required' });
        }
        
        // Store settings in memory
        global.userSettings = settings;
        
        // Write settings to a file for persistence
        fs.writeFileSync(path.join(__dirname, '..', 'user_settings.json'), JSON.stringify(settings, null, 2));
        
        console.log('User settings saved:', settings);
        
        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// API endpoint to rank posts
app.post('/api/rank-posts', (req, res) => {
    try {
        // Execute the ranking_llm.py script
        const command = `python ${path.join(__dirname, '..', 'ranking_llm.py')}`;
        
        // Set environment variables to pass the user profile
        const env = { ...process.env };
        if (global.userProfile) {
            env.USER_PROFILE_CONTENT = global.userProfile;
        }
        
        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute ranking script' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            res.json({ success: true, message: 'Posts ranked', output: stdout });
        });
    } catch (error) {
        console.error('Error ranking posts:', error);
        res.status(500).json({ error: 'Failed to rank posts' });
    }
});

// API endpoint to prepare feed
app.post('/api/prepare-feed', (req, res) => {
    try {
        // Execute the export_keywords.py script
        const command = `python ${path.join(__dirname, '..', 'export_keywords.py')}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute export script' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            res.json({ success: true, message: 'Feed prepared', output: stdout });
        });
    } catch (error) {
        console.error('Error preparing feed:', error);
        res.status(500).json({ error: 'Failed to prepare feed' });
    }
});

// API endpoint to fetch posts
app.get('/api/fetch-posts', (req, res) => {
    try {
        // Execute the view_posts_with_keywords.py script
        const command = `python ${path.join(__dirname, '..', 'view_posts_with_keywords.py')}`;
        
        // Set environment variables to pass the user profile
        const env = { ...process.env };
        if (global.userProfile) {
            env.USER_PROFILE_CONTENT = global.userProfile;
        }
        
        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            
            // Parse the output to extract posts
            const posts = parsePostsFromOutput(stdout);
            
            res.json({ success: true, posts });
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// API endpoint to submit feedback
app.post('/api/submit-feedback', (req, res) => {
    try {
        const { postId, feedbackType, textFeedback } = req.body;
        
        if (!postId || !feedbackType) {
            return res.status(400).json({ error: 'Post ID and feedback type are required' });
        }
        
        // In a real app, you would store this feedback in a database
        console.log(`Received feedback for post ${postId}: ${feedbackType}`);
        if (textFeedback) {
            console.log(`Feedback text: ${textFeedback}`);
        }
        
        res.json({ success: true, message: 'Feedback submitted' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// API endpoint to run a script
app.post('/api/run-script', (req, res) => {
    try {
        const { script, args = [] } = req.body;
        
        if (!script) {
            return res.status(400).json({ error: 'Script name is required' });
        }
        
        // Build the command
        const command = `python ${path.join(__dirname, '..', script)} ${args.join(' ')}`;
        
        // Set environment variables to pass the user profile
        const env = { ...process.env };
        if (global.userProfile) {
            env.USER_PROFILE_CONTENT = global.userProfile;
        }
        
        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute script' });
            }
            
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
            
            console.log(`Script output: ${stdout}`);
            res.json({ success: true, output: stdout });
        });
    } catch (error) {
        console.error('Error running script:', error);
        res.status(500).json({ error: 'Failed to run script' });
    }
});

// API endpoint to write to a file
app.post('/api/write-file', (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        
        if (!filePath || content === undefined) {
            return res.status(400).json({ error: 'File path and content are required' });
        }
        
        // Write to the file
        fs.writeFileSync(path.join(__dirname, '..', filePath), content);
        
        res.json({ success: true, message: 'File written successfully' });
    } catch (error) {
        console.error('Error writing to file:', error);
        res.status(500).json({ error: 'Failed to write to file' });
    }
});

// Helper function to parse posts from the output of view_posts_with_keywords.py
function parsePostsFromOutput(output) {
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
            posted_at: posted_at !== 'None' ? posted_at : null,
            scraped_at,
            keywords,
            post_text,
            views: views !== 'None' ? parseInt(views.replace(/,/g, '')) : null,
            comments: comments !== 'None' ? parseInt(comments.replace(/,/g, '')) : null,
            retweets: retweets !== 'None' ? parseInt(retweets.replace(/,/g, '')) : null,
            likes: likes !== 'None' ? parseInt(likes.replace(/,/g, '')) : null,
            saves: saves !== 'None' ? parseInt(saves.replace(/,/g, '')) : null,
            image_url: image_url !== 'None' ? image_url : null,
            platform,
            userInteraction: 0, // Default to neutral
            rank: 50 // Default rank
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
            posted_at: posted_at !== 'None' ? posted_at : null,
            scraped_at,
            keywords: [], // Empty keywords array for posts without keywords
            post_text,
            views: views !== 'None' ? parseInt(views.replace(/,/g, '')) : null,
            comments: comments !== 'None' ? parseInt(comments.replace(/,/g, '')) : null,
            retweets: retweets !== 'None' ? parseInt(retweets.replace(/,/g, '')) : null,
            likes: likes !== 'None' ? parseInt(likes.replace(/,/g, '')) : null,
            saves: saves !== 'None' ? parseInt(saves.replace(/,/g, '')) : null,
            image_url: image_url !== 'None' ? image_url : null,
            platform,
            userInteraction: 0, // Default to neutral
            rank: 50 // Default rank
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
                const posted_at = postedAtMatch ? (postedAtMatch[1] !== 'None' ? postedAtMatch[1] : null) : null;
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
                    platform,
                    userInteraction: 0,
                    rank: 50
                });
            } catch (error) {
                console.error('Error parsing post block:', error);
            }
        }
    }
    
    return posts;
}

// Schedule automatic scraping based on user settings
function scheduleAutomaticScraping() {
    // Check if we have user settings
    if (!global.userSettings) {
        console.log('No user settings found, skipping automatic scraping schedule');
        return;
    }
    
    const { scrapingFrequency, postCount } = global.userSettings;
    
    // Clear any existing scheduled tasks
    if (global.scrapingInterval) {
        clearInterval(global.scrapingInterval);
        global.scrapingInterval = null;
    }
    
    // Skip if manual only
    if (scrapingFrequency === 'manual') {
        console.log('Automatic scraping disabled (manual only)');
        return;
    }
    
    // Calculate interval in milliseconds
    let intervalMs;
    switch (scrapingFrequency) {
        case 'daily':
            intervalMs = 24 * 60 * 60 * 1000; // 24 hours
            break;
        case 'weekly':
            intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
            break;
        case 'monthly':
            intervalMs = 30 * 24 * 60 * 60 * 1000; // 30 days (approximate)
            break;
        default:
            console.log(`Unknown scraping frequency: ${scrapingFrequency}, defaulting to daily`);
            intervalMs = 24 * 60 * 60 * 1000; // 24 hours
    }
    
    console.log(`Scheduling automatic scraping every ${scrapingFrequency} (${intervalMs}ms)`);
    
    // Schedule the scraping
    global.scrapingInterval = setInterval(() => {
        console.log(`Running scheduled scraping (${scrapingFrequency})`);
        
        // Build the command
        const command = `python ${path.join(__dirname, '..', 'social_media_scraper.py')} --count=${postCount || 10}`;
        
        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing scheduled scraping: ${error.message}`);
                return;
            }
            
            if (stderr) {
                console.error(`Scheduled scraping stderr: ${stderr}`);
            }
            
            console.log(`Scheduled scraping completed: ${stdout}`);
            
            // Generate keywords after scraping
            if (global.userSettings.autoKeywords) {
                const keywordsCommand = `python ${path.join(__dirname, '..', 'generate_keywords.py')}`;
                
                exec(keywordsCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error generating keywords: ${error.message}`);
                        return;
                    }
                    
                    console.log(`Keywords generated: ${stdout}`);
                    
                    // Rank posts after generating keywords
                    if (global.userSettings.autoRanking) {
                        const rankCommand = `python ${path.join(__dirname, '..', 'ranking_llm.py')}`;
                        
                        // Set environment variables to pass the user profile
                        const env = { ...process.env };
                        if (global.userProfile) {
                            env.USER_PROFILE_CONTENT = global.userProfile;
                        }
                        
                        exec(rankCommand, { env }, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error ranking posts: ${error.message}`);
                                return;
                            }
                            
                            console.log(`Posts ranked: ${stdout}`);
                        });
                    }
                });
            }
        });
    }, intervalMs);
    
    // Also run once immediately
    console.log('Running initial scraping...');
    const command = `python ${path.join(__dirname, '..', 'social_media_scraper.py')} --count=${postCount || 10}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing initial scraping: ${error.message}`);
            return;
        }
        
        console.log(`Initial scraping completed: ${stdout}`);
    });
}

// Load saved settings on startup
function loadSavedSettings() {
    try {
        const settingsPath = path.join(__dirname, '..', 'user_settings.json');
        
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            global.userSettings = JSON.parse(settingsData);
            console.log('Loaded saved settings:', global.userSettings);
            
            // Schedule automatic scraping based on loaded settings
            scheduleAutomaticScraping();
        }
    } catch (error) {
        console.error('Error loading saved settings:', error);
    }
}

// Load saved profile on startup
function loadSavedProfile() {
    try {
        const profilePath = path.join(__dirname, '..', 'user_profile.txt');
        
        if (fs.existsSync(profilePath)) {
            global.userProfile = fs.readFileSync(profilePath, 'utf8');
            console.log('Loaded saved user profile');
        }
    } catch (error) {
        console.error('Error loading saved profile:', error);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}/index.html`);
    
    // Load saved profile and settings
    loadSavedProfile();
    loadSavedSettings();
});
