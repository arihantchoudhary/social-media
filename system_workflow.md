# Social Media Content Curation System: Workflow Overview

This document provides a comprehensive overview of the social media content curation system, detailing how each component works together to scrape, process, analyze, and present relevant content to users based on their preferences.

## System Components and Workflow

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
  - Handles edge cases like empty or None post text values
  - Updates the post record with the generated keywords (stored as JSON)
  - Maintains a separate keywords table with frequency tracking
- Can be run with `--force` to regenerate keywords for all posts

### 3. User-Based Ranking: `ranking_llm.py`

**Purpose**: Ranks posts according to user preferences defined in the user profile.

**Process**:
- Reads the user profile from `user_profile.txt`
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

## Data Flow Summary

1. **Raw Data Collection**: Social media content is scraped and stored in `x_com_posts.db`
2. **Content Enhancement**: Posts are enriched with keywords and user-based ranking scores
3. **Keyword Repository**: All unique keywords are exported to `keywords.txt` and `keywords.json`
4. **Content Discovery**: User queries are matched to keywords to find relevant posts
5. **Content Selection**: Matching posts are ranked and the best ones saved to `posts_selected.db`
6. **Validation Simulation**: An LLM simulates user validation of the selected posts
7. **Results Presentation**: Selected posts are displayed with their validation status

This system creates a sophisticated content curation pipeline that leverages LLMs at multiple stages to personalize content discovery and selection based on user preferences.
