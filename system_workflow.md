# Social Media Content Curation System: Workflow Overview

This document provides a comprehensive overview of the social media content curation system, detailing how each component works together to scrape, process, analyze, and present relevant content to users based on their preferences.

## System Architecture

The system consists of two main parts:
1. **Backend Processing Pipeline**: Python scripts for data collection, analysis, and curation
2. **Web Interface**: Express.js server and frontend for user interaction

## Backend Processing Pipeline

### 1. Data Collection: `social_media_scraper.py`

**Purpose**: Scrapes content from social media platforms (primarily X/Twitter) and stores it in a database.

**Process**:
- Uses browser automation to navigate social media platforms
- Extracts post content, metrics (views, likes, comments, retweets), images, and metadata
- Stores all collected data in the primary database (`x_com_posts.db`)
- Each post record includes: username, post URL, post text, post time, metrics, image URLs, etc.

### 2. Keyword Generation: `generate_keywords.py`

**Purpose**: Analyzes post content to generate relevant keywords for each post.

**Process**:
- Connects to the `x_com_posts.db` database
- For each post without keywords:
  - Extracts the post text
  - Calls an LLM (via OpenRouter API) to generate 3-5 relevant keywords
  - Handles edge cases like empty or very short post text values
  - Updates the post record with the generated keywords (stored as JSON)
  - Maintains a separate keywords table with frequency tracking
- Can be run with `--force` to regenerate keywords for all posts
- Can be run with `--fix-missing` to specifically target posts without keywords

### 3. User-Based Ranking: `ranking_llm.py`

**Purpose**: Ranks posts according to user preferences defined in the user profile.

**Process**:
- Reads the user profile from `user_profile.txt` or `dynamic_user_profile.md` if available
- Connects to the `x_com_posts.db` database
- For each post:
  - Analyzes the post content, keywords, and metrics
  - Calls an LLM to evaluate how well the post matches the user's interests and preferences
  - Assigns a ranking score (0-100)
  - Updates the post record with the user ranking score
- Helps prioritize content that aligns with the user's interests

### 4. Keyword Export: `export_keywords.py`

**Purpose**: Exports all unique keywords from the database for use in content discovery.

**Process**:
- Connects to the `x_com_posts.db` database
- Extracts all keywords from the keywords table or from post records
- Cleans keywords by removing JSON formatting and code block markers
- Removes duplicates and merges keyword frequency data
- Exports to two formats:
  - `keywords.txt`: Simple text file with one keyword per line (alphabetically sorted)
  - `keywords.json`: JSON file with additional metadata (frequency, first seen date)
- These files serve as the keyword repository for content discovery

### 5. Content Discovery: `user_posts_output.py`

**Purpose**: Allows users to discover relevant content based on natural language queries.

**Process**:
- Loads keywords from `keywords.txt`
- Takes a user query describing desired content
- Calls the `keyword_finder_llm` to match the query against available keywords
  - Always returns 2-5 most relevant keywords
- Searches the `x_com_posts.db` database for posts matching these keywords
  - A post matches if it contains at least one of the keywords
- Ranks matching posts based on:
  - Number of matching keywords (highest priority)
  - User ranking score
  - Post metrics (views, likes, comments, retweets)
  - Recency
- Saves the top-ranked posts (up to 10) to `posts_selected.db`
  - Includes the original query, matching keyword count, and relevance score
- Displays the selected posts for review

### 6. User Validation Simulation: `user_bot_verification.py`

**Purpose**: Simulates user validation of selected posts by using an LLM to act as the user.

**Process**:
- Loads the user profile from `user_profile.txt`
- Connects to the `posts_selected.db` database
- Adds an `llm_clone_validated` column if it doesn't exist
- For each unvalidated post:
  - Formats the post information (text, metrics, keywords, etc.)
  - Calls an LLM with the user profile and instructs it to pretend to be the user
  - Asks the LLM if the user would "like" or "pass" on the post
  - Updates the post record with the validation result
- This simulates how the actual user might respond to the selected content

### 7. Results Viewing: `view_selected_posts.py`

**Purpose**: Displays the selected posts with their validation status.

**Process**:
- Connects to the `posts_selected.db` database
- Displays detailed information about each selected post:
  - Post content, username, metrics
  - Query that found the post
  - Matching keyword count and relevance score
  - LLM validation result ("LIKE" or "PASS")
- Supports filtering by validation status (like, pass, or unvalidated)
- Provides a comprehensive view of the content curation results

### 8. User Feedback Collection: `user_feedback_sample.py`

**Purpose**: Defines the structure for user feedback on posts and provides tools for viewing feedback.

**Process**:
- Creates a `user_feedback.db` database to store user feedback
- Defines the schema for the user_feedback table:
  - post_id: The ID of the post being rated
  - feedback_type: Either "like", "dislike", or "text"
  - text_feedback: Optional text content for detailed feedback
  - feedback_timestamp: When the feedback was given
- Provides a view function to display all feedback entries
- Can generate sample feedback for testing purposes

### 9. Dynamic User Profiling: `dynamic_user_profile.py`

**Purpose**: Creates and maintains a dynamic user profile that evolves based on user feedback.

**Process**:
- Loads the base user profile from `user_profile.txt`
- Retrieves user feedback from `user_feedback.db`
  - Only processes new feedback since the last run (using timestamp tracking)
- Joins feedback with post data from `posts_selected.db`
- Formats the feedback data for LLM analysis
- Calls an LLM to generate an updated user profile that:
  - Strengthens interests confirmed by positive feedback
  - Weakens interests that receive negative feedback
  - Adds new interests based on positive feedback
  - Updates likes and dislikes based on feedback patterns
- Saves the dynamic profile to `dynamic_user_profile.md`
- Can be regenerated on demand with the `--force` flag
- Uses absolute paths to find files regardless of the current working directory

## Web Interface

### 1. Server: `website/server.js`

**Purpose**: Provides API endpoints for the frontend and connects the web interface to the backend scripts.

**Key Components**:
- Express.js server with RESTful API endpoints
- SQLite database integration for accessing post data
- File system operations for profile and settings management
- Child process execution for running Python scripts

**API Endpoints**:
- `/api/save-profile`: Save user profile to user_profile.txt
- `/api/get-profile`: Retrieve user profile
- `/api/save-credentials`: Save social media credentials
- `/api/get-credentials`: Retrieve social media credentials
- `/api/start-scraping`: Execute social_media_scraper.py
- `/api/generate-keywords`: Execute generate_keywords.py
- `/api/save-settings`: Save user settings
- `/api/rank-posts`: Execute ranking_llm.py
- `/api/prepare-feed`: Execute export_keywords.py
- `/api/fetch-posts`: Get posts from the database
- `/api/submit-feedback`: Save user feedback and update dynamic profile
- `/api/run-script`: Generic endpoint to run any Python script
- `/api/search-posts`: Search for posts using user_posts_output.py
- `/api/write-file`: Write content to a file

**Automatic Profile Updating**:
- When a user submits feedback via `/api/submit-feedback`:
  1. The feedback is saved to the user_feedback.db database
  2. The dynamic_user_profile.py script is automatically executed with --force
  3. This ensures the user profile is immediately updated based on new feedback

### 2. Frontend: Website Files

**Purpose**: Provide a user interface for interacting with the content curation system.

**Key Components**:

#### Profile Setup: `website/public/index.html`
- User profile creation and editing
- Social media account configuration
- System settings management

#### Feed Page: `website/public/feed.html` and related files
- Display curated posts in a vertical scrolling layout
- Search functionality for finding specific content
- Post interaction (like, dislike, feedback)
- Post detail view with metrics and keywords

#### JavaScript Modules:
- `backend-connector.js`: Handles communication with the server API
- `feed.js`: Manages the feed page functionality
- `profile.js`: Handles profile page interactions
- `auth.js`: Manages authentication (if applicable)

#### CSS Styling:
- `feed.css`: Styles for the feed page (vertical layout, 2/3 width)
- `styles.css`: Global styles
- `app.css`: Application-wide styles

## Data Flow and User Interaction

### Initial Setup Flow:
1. User visits the website and creates a profile (`index.html`)
2. Profile is saved to `user_profile.txt` via `/api/save-profile`
3. User configures social media accounts and settings
4. Settings are saved via `/api/save-settings`

### Content Collection Flow:
1. System runs `social_media_scraper.py` (manually or on schedule)
2. Posts are stored in `x_com_posts.db`
3. System runs `generate_keywords.py` to add keywords to posts
4. System runs `ranking_llm.py` to rank posts based on user profile
5. System runs `export_keywords.py` to prepare for content discovery

### Content Discovery Flow:
1. User enters a search query in the feed page
2. Query is sent to `/api/search-posts`
3. Server runs `user_posts_output.py` with the query
4. Matching posts are saved to `posts_selected.db`
5. Posts are returned to the frontend and displayed in the feed

### User Feedback Flow:
1. User interacts with posts (like, dislike, or text feedback)
2. Feedback is sent to `/api/submit-feedback`
3. Server saves feedback to `user_feedback.db`
4. Server automatically runs `dynamic_user_profile.py --force`
5. Dynamic profile is updated based on the new feedback
6. Future content ranking and discovery use the updated profile

### Automatic Scraping Flow (if enabled):
1. Server checks user settings for scraping frequency
2. At the scheduled time, server runs `social_media_scraper.py`
3. After scraping, server runs `generate_keywords.py` if auto-keywords is enabled
4. If auto-ranking is enabled, server runs `ranking_llm.py`
5. Feed is updated with new content

## File Structure and Database Schema

### Key Files:
- `user_profile.txt`: Base user profile
- `dynamic_user_profile.md`: Evolving user profile based on feedback
- `social_media_credentials.json`: Saved social media account credentials
- `user_settings.json`: User preferences and system settings
- `keywords.txt` and `keywords.json`: Exported keywords for content discovery
- `last_processed_feedback.txt`: Timestamp of last processed feedback

### Databases:
- `x_com_posts.db`: Primary database of all scraped posts
  - Table: posts
    - id, username, post_url, post_text, post_time, scraped_at, metrics, keywords, etc.
  - Table: keywords
    - id, keyword, frequency, first_seen_at
    
- `posts_selected.db`: Database of posts selected by search queries
  - Table: selected_posts
    - id, original_post_id, post_text, username, post_url, metrics, keywords, query, matching_keyword_count, relevance_score, llm_clone_validated
    
- `user_feedback.db`: Database of user feedback on posts
  - Table: user_feedback
    - id, post_id, feedback_type, text_feedback, feedback_timestamp

## Recent Improvements

### 1. Sentiment Analysis for Search Results
- Added a new `sentiment_analysis.py` script that analyzes the sentiment of search results
- When searching for posts, the system now provides:
  - A concise summary of what people are saying about the topic
  - Overall sentiment (positive, negative, mixed, or neutral)
  - A sentiment score from 0-100
  - Key points extracted from the posts
- The sentiment analysis is displayed above the search results in the feed
- Helps users quickly understand the general opinion on a topic before reading individual posts

### 2. Feed Layout Enhancement
- Changed from a grid layout to a vertical scrolling layout
- Posts now take up 2/3 of the screen width for better readability
- Improved responsive design for different screen sizes

### 3. Automatic Profile Updating
- Dynamic user profile is now automatically updated when feedback is submitted
- No need to manually run the profile update script

### 4. Incremental Feedback Processing
- Dynamic profile generation now only processes new feedback
- Uses timestamp tracking to avoid reprocessing old feedback
- More efficient and faster profile updates

### 5. Robust Path Handling
- All scripts now use absolute paths to find files
- Works correctly regardless of the current working directory
- Improved error handling and logging for file operations

### 6. Keyword Generation Improvements
- Better handling of very short posts
- Improved fallback mechanisms when the API doesn't return proper keywords
- New --fix-missing flag to specifically target posts without keywords

## Conclusion

This social media content curation system creates a sophisticated pipeline that leverages LLMs at multiple stages to personalize content discovery and selection based on user preferences. The addition of the feedback loop and dynamic user profiling creates a self-improving system that continuously adapts to the user's evolving interests and preferences.

The web interface provides an intuitive way for users to interact with the system, while the backend processing pipeline handles the complex tasks of content collection, analysis, and curation. The automatic profile updating ensures that the system becomes more personalized over time without requiring manual intervention.
