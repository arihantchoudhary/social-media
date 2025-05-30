# Social Media Content Curation System - Frontend

This is the user interface for the Social Media Content Curation System. It provides a web-based interface for configuring your user profile, connecting social media accounts, and viewing your personalized feed.

### Features

- **User Profile Configuration**: Enter your personal information, interests, and content preferences to customize your feed.
- **Social Media Integration**: Connect your Twitter, Instagram, and Facebook accounts to scrape content.
- **Personalized Feed**: View posts from your social media feeds, ranked based on your preferences.
- **Interactive Post Viewing**: Like, dislike, or provide detailed feedback on posts to improve future recommendations.
- **Keyword Filtering**: Filter posts by keywords or platform.
- **Sorting Options**: Sort posts by relevance, date, likes, or comments.

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python (v3.8 or higher)
- Python packages from the main project

### Installation

1. Clone the repository (if you haven't already):
   ```
   git clone <repository-url>
   cd social-media
   ```

2. Install the Node.js dependencies:
   ```
   cd website
   npm install
   ```

3. Make sure you have the required Python packages installed:
   ```
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the server:
   ```
   cd website
   npm start
   ```

2. For development with auto-restart:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Usage

1. **Configure Your Profile**:
   - Fill in your personal information
   - Enter your interests and content preferences
   - Or load the sample profile for testing

2. **Connect Social Media Accounts**:
   - Enter your credentials for Twitter, Instagram, and/or Facebook
   - Note: In the demo version, these credentials are not actually used to log in

3. **Review and Start**:
   - Review your settings
   - Set the number of posts to scrape
   - Start the curation process

4. **Interact with Your Feed**:
   - Swipe right or click "Like" for posts you enjoy
   - Swipe left or click "Dislike" for posts you don't like
   - Click on a post header to view more details
   - Provide detailed feedback to improve future recommendations
   - Filter posts by keywords or platform
   - Sort posts by relevance, date, likes, or comments

### Project Structure

- `public/` - Static files served to the browser
  - `index.html` - Landing page with profile configuration
  - `feed.html` - Feed page for viewing posts
  - `*.css` - Stylesheets for the UI
  - `*.js` - Client-side JavaScript files
- `server.js` - Express server that handles API requests
- `package.json` - Node.js dependencies and scripts

### API Endpoints

- `/api/save-profile` - Save user profile
- `/api/save-credentials` - Save social media credentials
- `/api/start-scraping` - Start scraping posts
- `/api/generate-keywords` - Generate keywords for posts
- `/api/rank-posts` - Rank posts based on user profile
- `/api/prepare-feed` - Prepare the feed
- `/api/fetch-posts` - Fetch posts for the feed
- `/api/submit-feedback` - Submit feedback on posts
- `/api/run-script` - Run a Python script
- `/api/write-file` - Write to a file

### Integration with Python Backend

The UI integrates with the Python backend through the Express server, which executes Python scripts as needed. The main scripts used are:

- `social_media_scraper.py` - Scrapes posts from social media
- `generate_keywords.py` - Generates keywords for posts
- `ranking_llm.py` - Ranks posts based on user profile
- `export_keywords.py` - Exports keywords to files
- `view_posts_with_keywords.py` - Retrieves posts with keywords


# Social Media Scraper and Keyword Generator - Backend

This project consists of several scripts for scraping posts from Twitter/X.com, generating keywords for those posts using LLMs, and viewing the results.

### Scripts Overview

1. **social_media_scraper.py**: Scrapes posts from Twitter/X.com and stores them in a SQLite database.
2. **generate_keywords.py**: Generates keywords for posts using OpenRouter (with GPT-4o by default) and stores them in the database.
3. **view_posts_db.py**: Views posts from the database (original viewer).
4. **view_posts_with_keywords.py**: Enhanced viewer that displays posts with their keywords and keyword statistics.

### Setup

1. Install required dependencies:

```bash
pip install langchain-openai python-dotenv browser-use
```

2. Set up environment variables (create a `.env` file in the project root):

```
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o  # Optional, defaults to GPT-4o
```

You can get an OpenRouter API key by signing up at [openrouter.ai](https://openrouter.ai/).

### Usage

#### 1. Scrape Posts from Twitter/X.com

Run the social media scraper to collect posts:

```bash
python social_media_scraper.py
```

This will:
- Prompt you for your Twitter/X.com username and password
- Open a browser and log in to Twitter/X.com
- Navigate to the home feed
- Extract the top 10 posts with their metrics
- Store the posts in a SQLite database (`x_com_posts.db`)

#### 2. Generate Keywords for Posts

After scraping posts, generate keywords for them:

```bash
python generate_keywords.py
```

Options:
- `--limit <number>`: Process only a specific number of posts
- `--batch-size <number>`: Number of posts to process before pausing (default: 10)
- `--stats`: View keyword statistics only without processing posts

This will:
- Add a `keywords` column to the posts table if it doesn't exist
- Create a `keywords` table to track unique keywords and their frequency
- Call OpenRouter API to generate 3-5 keywords for each post
- Update the database with the generated keywords

#### 3. View Posts with Keywords

View the posts with their generated keywords:

```bash
python view_posts_with_keywords.py
```

Options:
- `--db <path>`: Specify a different database file (default: `x_com_posts.db`)
- `--limit <number>`: Limit the number of posts to display
- `--keywords-only`: Show only keyword statistics without posts
- `--no-keywords`: Don't show keywords with posts


### Database Structure

The SQLite database (`x_com_posts.db`) contains two tables:

#### Posts Table
- `id`: Unique identifier for each post
- `post_text`: The text content of the post
- `post_url`: URL of the post
- `username`: Username of the account that made the post
- `image_url`: URL of any image in the post (if present)
- `views`: View count
- `comments`: Comment count
- `retweets`: Retweet count
- `likes`: Like count
- `saves`: Save count
- `post_time`: Time the post was made
- `scraped_at`: Time the post was scraped
- `keywords`: JSON array of keywords for the post (added by generate_keywords.py)

#### Keywords Table
- `id`: Unique identifier for each keyword
- `keyword`: The keyword text
- `frequency`: Number of times this keyword appears across all posts
- `first_seen_at`: When this keyword was first added to the database

### Customizing the LLM

By default, the keyword generator uses GPT-4o through OpenRouter. You can change the model by:

1. Setting the `OPENROUTER_MODEL` environment variable in your `.env` file
2. Using any model supported by OpenRouter (e.g., `anthropic/claude-3-opus`, `google/gemini-pro`, etc.)

### Troubleshooting

- If the scraper fails to extract post metrics, try running it again. Twitter/X.com's UI can be dynamic and sometimes elements take time to load.
- If you encounter rate limits with OpenRouter, increase the `--batch-size` parameter when running `generate_keywords.py`.
- Make sure JavaScript is enabled in the browser used by the scraper.
