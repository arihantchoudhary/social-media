const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

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

// API endpoint to get user profile
app.get('/api/get-profile', (req, res) => {
    try {
        const profilePath = path.join(__dirname, '..', 'user_profile.txt');
        
        if (!fs.existsSync(profilePath)) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        // Read profile from user_profile.txt
        const profileContent = fs.readFileSync(profilePath, 'utf8');
        
        // Parse the profile content to extract basic information
        const nameMatch = profileContent.match(/Name: ([^\n]+)/);
        const ageMatch = profileContent.match(/Age: ([0-9]+)/);
        const locationMatch = profileContent.match(/Location: ([^\n]+)/);
        const occupationMatch = profileContent.match(/Occupation: ([^\n]+)/);
        
        // Extract interests
        const interestsSection = profileContent.match(/## Interests\n([^#]*)/);
        let interests = [];
        if (interestsSection) {
            interests = interestsSection[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.replace('-', '').trim());
        }
        
        // Extract likes
        const likesSection = profileContent.match(/### Likes\n([^#]*)/);
        let likes = [];
        if (likesSection) {
            likes = likesSection[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.replace('-', '').trim());
        }
        
        // Extract dislikes
        const dislikesSection = profileContent.match(/### Doesn't Like\n([^#]*)/);
        let dislikes = [];
        if (dislikesSection) {
            dislikes = dislikesSection[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.replace('-', '').trim());
        }
        
        // Create a profile object
        const profile = {
            name: nameMatch ? nameMatch[1].trim() : '',
            age: ageMatch ? ageMatch[1].trim() : '',
            location: locationMatch ? locationMatch[1].trim() : '',
            occupation: occupationMatch ? occupationMatch[1].trim() : '',
            interests: interests,
            likes: likes,
            dislikes: dislikes,
            fullProfile: profileContent
        };
        
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// API endpoint to save social media credentials
app.post('/api/save-credentials', (req, res) => {
    try {
        const { accounts } = req.body;
        
        if (!accounts) {
            return res.status(400).json({ error: 'Account data is required' });
        }
        
        // Save credentials to a file for persistence
        fs.writeFileSync(path.join(__dirname, '..', 'social_media_credentials.json'), JSON.stringify(accounts, null, 2));
        
        // Store in memory for use with other scripts
        global.socialMediaAccounts = accounts;
        
        console.log('Social media credentials saved successfully');
        
        res.json({ success: true, message: 'Credentials saved successfully' });
    } catch (error) {
        console.error('Error saving credentials:', error);
        res.status(500).json({ error: 'Failed to save credentials' });
    }
});

// API endpoint to get social media credentials
app.get('/api/get-credentials', (req, res) => {
    try {
        const credentialsPath = path.join(__dirname, '..', 'social_media_credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
            return res.status(404).json({ error: 'Credentials not found' });
        }
        
        // Read credentials from file
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
        const accounts = JSON.parse(credentialsContent);
        
        res.json({ success: true, accounts });
    } catch (error) {
        console.error('Error getting credentials:', error);
        res.status(500).json({ error: 'Failed to get credentials' });
    }
});

// API endpoint to start scraping
app.post('/api/start-scraping', (req, res) => {
    try {
        const { accounts, postCount } = req.body;
        
        // Execute the social_media_scraper.py script
        const command = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'social_media_scraper.py')} --count=${postCount || 10}`;
        
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
        const command = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'generate_keywords.py')}`;
        
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
        const command = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'ranking_llm.py')}`;
        
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
        const command = `python ${path.join(__dirname, '..', 'core', 'export_keywords.py')}`;
        
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
        const command = `python ${path.join(__dirname, '..', 'utils', 'view_posts_with_keywords.py')} --db=${path.join(__dirname, '..', 'db', 'x_com_posts.db')}`;
        
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
        
        // Connect to the user_feedback database
        const feedbackDb = new sqlite3.Database(path.join(__dirname, '..', 'user_feedback.db'));
        
        // Create the user_feedback table if it doesn't exist
        feedbackDb.run(`
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER,
                feedback_type TEXT,
                text_feedback TEXT,
                feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert the feedback into the database
        feedbackDb.run(
            `INSERT INTO user_feedback (post_id, feedback_type, text_feedback) VALUES (?, ?, ?)`,
            [postId, feedbackType, textFeedback || null],
            function(err) {
                if (err) {
                    console.error('Error inserting feedback into database:', err);
                    feedbackDb.close();
                    return res.status(500).json({ error: 'Failed to save feedback to database' });
                }
                
                console.log(`Saved feedback for post ${postId}: ${feedbackType} (ID: ${this.lastID})`);
                if (textFeedback) {
                    console.log(`Feedback text: ${textFeedback}`);
                }
                
                feedbackDb.close();
                
                // After saving feedback, update the dynamic user profile
                console.log('Updating dynamic user profile based on new feedback...');
                const dynamicProfileCommand = `python ${path.join(__dirname, '..', 'core', 'dynamic_user_profile.py')} --force`;
                
                exec(dynamicProfileCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error updating dynamic user profile: ${error.message}`);
                        // Still return success for the feedback submission
                    } else {
                        console.log(`Dynamic user profile updated: ${stdout}`);
                    }
                    
                    // Return success response for the feedback submission
                    res.json({ success: true, message: 'Feedback submitted and saved to database' });
                });
            }
        );
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

// API endpoint to search posts using the user_posts_output.py script
app.post('/api/search-posts', (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        console.log(`Searching posts with query: ${query}`);
        
        // Create a temporary file with the query to avoid command line escaping issues
        const tempQueryFile = path.join(__dirname, '..', 'config', 'temp_query.txt');
        fs.writeFileSync(tempQueryFile, query);
        
        // Build the command to run user_posts_output.py with the query file
        // Use the absolute path to the script and specify the current working directory
        const scriptPath = path.join(__dirname, '..', 'core', 'user_posts_output.py');
        const workingDir = path.join(__dirname, '..');
        const command = `cd "${workingDir}" && python "${scriptPath}" --query-file="${tempQueryFile}" --db=${path.join(__dirname, '..', 'db', 'x_com_posts.db')}`;
        
        // Set environment variables to pass the user profile
        const env = { ...process.env };
        if (global.userProfile) {
            env.USER_PROFILE_CONTENT = global.userProfile;
        }
        
        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing search script: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute search script' });
            }
            
            if (stderr) {
                console.error(`Search script stderr: ${stderr}`);
            }
            
            console.log(`Search script output: ${stdout}`);
            
            // After running the script, fetch the posts from the posts_selected.db
            const dbPath = path.join(__dirname, '..', 'posts_selected.db');
            
            // Check if the database file exists
            if (!fs.existsSync(dbPath)) {
                return res.status(404).json({ error: 'Selected posts database not found' });
            }
            
            // Connect to the database
            const db = new sqlite3.Database(dbPath);
            
            // Get the selected posts
            db.all(
                `SELECT * FROM selected_posts WHERE query = ? ORDER BY relevance_score DESC`,
                [query],
                (err, rows) => {
                    if (err) {
                        console.error(`Error fetching selected posts: ${err.message}`);
                        return res.status(500).json({ error: 'Failed to fetch selected posts' });
                    }
                    
                    // Close the database connection
                    db.close();
                    
                    // Process the posts
                    const posts = rows.map(row => {
                        // Parse keywords if they exist
                        let keywords = [];
                        if (row.keywords) {
                            try {
                                keywords = JSON.parse(row.keywords);
                            } catch (e) {
                                console.error(`Error parsing keywords: ${e}`);
                            }
                        }
                        
                        // Determine platform from URL
                        let platform = 'unknown';
                        if (row.post_url && (row.post_url.includes('twitter.com') || row.post_url.includes('x.com'))) {
                            platform = 'twitter';
                        } else if (row.post_url && row.post_url.includes('instagram.com')) {
                            platform = 'instagram';
                        } else if (row.post_url && row.post_url.includes('facebook.com')) {
                            platform = 'facebook';
                        }
                        
                        return {
                            id: row.original_post_id,
                            username: row.username,
                            post_url: row.post_url,
                            posted_at: row.post_time,
                            scraped_at: row.scraped_at,
                            keywords: keywords,
                            post_text: row.post_text,
                            views: row.views,
                            comments: row.comments,
                            retweets: row.retweets,
                            likes: row.likes,
                            image_url: row.image_url,
                            platform: platform,
                            userInteraction: 0, // Default to neutral
                            rank: row.relevance_score || 50, // Use relevance score as rank
                            matching_keyword_count: row.matching_keyword_count,
                            relevance_score: row.relevance_score
                        };
                    });
                    
                    // Run sentiment analysis on the posts
                    console.log('Running sentiment analysis on the posts...');
                    const sentimentCommand = `python ${path.join(__dirname, '..', 'core', 'sentiment_analysis.py')} "${query}"`;
                    
                    exec(sentimentCommand, (sentimentError, sentimentStdout, sentimentStderr) => {
                        let sentimentAnalysis = {
                            summary: "Sentiment analysis not available.",
                            sentiment: "neutral",
                            sentiment_score: 50,
                            key_points: []
                        };
                        
                        if (sentimentError) {
                            console.error(`Error executing sentiment analysis: ${sentimentError.message}`);
                        } else {
                            if (sentimentStderr) {
                                console.error(`Sentiment analysis stderr: ${sentimentStderr}`);
                            }
                            
                            console.log(`Sentiment analysis output: ${sentimentStdout}`);
                            
                            // Try to extract the JSON result from the output
                            try {
                                const jsonMatch = sentimentStdout.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    sentimentAnalysis = JSON.parse(jsonMatch[0]);
                                }
                            } catch (e) {
                                console.error(`Error parsing sentiment analysis output: ${e}`);
                            }
                        }
                        
                        // Return both the posts and the sentiment analysis
                        res.json({ 
                            success: true, 
                            posts: posts,
                            sentimentAnalysis: sentimentAnalysis
                        });
                    });
                }
            );
        });
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ error: 'Failed to search posts' });
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
                
                // Determine platform from URL
                let platform = 'unknown';
                if (post_url.includes('twitter.com') || post_url.includes('x.com')) {
                    platform = 'twitter';
                } else if (post_url.includes('instagram.com')) {
                    platform = 'instagram';
                } else if (post_url.includes('facebook.com')) {
                    platform = 'facebook';
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
        const command = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'social_media_scraper.py')} --count=${postCount || 10}`;
        
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
                const keywordsCommand = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'generate_keywords.py')}`;
                
                exec(keywordsCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error generating keywords: ${error.message}`);
                        return;
                    }
                    
                    console.log(`Keywords generated: ${stdout}`);
                    
                    // Rank posts after generating keywords
                    if (global.userSettings.autoRanking) {
                        const rankCommand = `python ${path.join(__dirname, '..', 'core', 'ranking_llm.py')}`;
                        
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
    const command = `cd "${path.join(__dirname, '..')}" && python ${path.join(__dirname, '..', 'core', 'social_media_scraper.py')} --count=${postCount || 10}`;
    
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

// Load saved social media credentials on startup
function loadSavedCredentials() {
    try {
        const credentialsPath = path.join(__dirname, '..', 'social_media_credentials.json');
        
        if (fs.existsSync(credentialsPath)) {
            const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
            global.socialMediaAccounts = JSON.parse(credentialsData);
            console.log('Loaded saved social media credentials');
        }
    } catch (error) {
        console.error('Error loading saved credentials:', error);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}/index.html`);
    
    // Load saved profile, settings, and credentials
    loadSavedProfile();
    loadSavedSettings();
    loadSavedCredentials();
});
