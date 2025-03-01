# Social Media Content Curation System: Files and Commands

This document provides a comprehensive list of all files in the system and the commands to run each component in the correct order.

## System Files

### Core Components

1. `social_media_scraper.py` - Scrapes content from social media platforms
2. `generate_keywords.py` - Generates keywords for posts
3. `ranking_llm.py` - Ranks posts based on user preferences
4. `export_keywords.py` - Exports keywords to text and JSON files
5. `user_posts_output.py` - Finds and selects posts based on user queries
6. `user_bot_verification.py` - Simulates user validation of selected posts
7. `view_selected_posts.py` - Displays selected posts with validation status
8. `user_feedback_sample.py` - Simulates user feedback on posts
9. `dynamic_user_profile.py` - Generates dynamic user profiles based on feedback
10. `main.py` - Main controller that orchestrates the entire workflow

### Data Files

1. `user_profile.txt` - Base user profile
2. `dynamic_user_profile.md` - Dynamic user profile generated from feedback
3. `keywords.txt` - List of all unique keywords
4. `keywords.json` - Keywords with metadata (frequency, first seen date)

### Databases

1. `x_com_posts.db` - Main database of scraped posts
2. `posts_selected.db` - Database of selected posts for user review
3. `user_feedback.db` - Database of user feedback on posts

### Documentation

1. `system_workflow.md` - Comprehensive overview of the system
2. `system_commands.md` - This file, listing all commands

## Running the System

### Using the Main Controller

The easiest way to run the system is using the main controller:

```bash
# Run the complete workflow
python main.py --full

# Run a specific stage
python main.py --stage content_discovery

# Run a specific component
python main.py --component discover

# Run with dynamic profile
python main.py --full --dynamic

# Specify the number of posts to scrape
python main.py --full --post-count 20

# Generate specific number of feedback entries
python main.py --stage feedback_adaptation --feedback-count 20

# Run in non-interactive mode with a predefined query
python main.py --stage content_discovery --query "latest tech news"
```

### Running Individual Components

You can also run each component individually:

### Step 1: Data Collection

```bash
# Scrape content from social media platforms
python social_media_scraper.py

# Optional: Specify the number of posts to scrape
python social_media_scraper.py --count 20
```

### Step 2: Content Enhancement

```bash
# Generate keywords for posts
python generate_keywords.py

# Optional: Force regeneration of keywords for all posts
python generate_keywords.py --force

# Rank posts based on user preferences
python ranking_llm.py

# Optional: View ranking statistics
python ranking_llm.py --stats

# Export keywords to text and JSON files
python export_keywords.py
```

### Step 3: Content Discovery

```bash
# Find and select posts based on user query
python user_posts_output.py

# Optional: Force regeneration of dynamic profile before searching
python user_posts_output.py --dynamic

# Optional: Use a predefined query (non-interactive mode)
python user_posts_output.py --query "latest tech news"
```

### Step 4: Content Validation

```bash
# Simulate user validation of selected posts
python user_bot_verification.py

# View selected posts with validation status
python view_selected_posts.py

# Optional: Filter by validation status (like, pass, or none for unvalidated)
python view_selected_posts.py --validated like
python view_selected_posts.py --validated pass
python view_selected_posts.py --validated none

# Optional: Show queries and allow filtering by query
python view_selected_posts.py --queries
```

### Step 5: Feedback and Profile Adaptation

```bash
# Generate sample user feedback
python user_feedback_sample.py --generate 20

# View user feedback
python user_feedback_sample.py --view

# Generate dynamic user profile based on feedback
python dynamic_user_profile.py

# Optional: Force regeneration of dynamic profile
python dynamic_user_profile.py --force
```

### Step 6: Personalized Content Discovery (with Dynamic Profile)

```bash
# Rank posts using dynamic profile
python ranking_llm.py --dynamic

# Find and select posts using dynamic profile
python user_posts_output.py --dynamic
```

## Viewing Data

```bash
# View all posts in the database
python view_posts_db.py

# View posts with keywords
python view_posts_with_keywords.py

# View selected posts
python view_selected_posts.py

# View user feedback
python user_feedback_sample.py --view
```

## Complete Workflow Example

Here's an example of running the complete workflow from start to finish:

```bash
# Using the main controller (recommended)
python main.py --full --post-count 20

# Or running each component individually:

# 1. Scrape content (20 posts)
python social_media_scraper.py --count 20

# 2. Generate keywords
python generate_keywords.py

# 3. Rank posts
python ranking_llm.py

# 4. Export keywords
python export_keywords.py

# 5. Find and select posts based on user query
python user_posts_output.py

# 6. Simulate user validation
python user_bot_verification.py

# 7. Generate sample user feedback
python user_feedback_sample.py --generate 20

# 8. Generate dynamic user profile
python dynamic_user_profile.py

# 9. Find and select posts using dynamic profile
python user_posts_output.py --dynamic

# 10. View selected posts
python view_selected_posts.py
```

## Environment Requirements

The system requires the following environment variables to be set in a `.env` file:

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-4o
```

Some components use different models by default (e.g., `ranking_llm.py` uses `openai/o3-mini`).
