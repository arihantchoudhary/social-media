# Social Media Content Curation System UI

This is the user interface for the Social Media Content Curation System. It provides a web-based interface for configuring your user profile, connecting social media accounts, and viewing your personalized feed.

## Features

- **User Profile Configuration**: Enter your personal information, interests, and content preferences to customize your feed.
- **Social Media Integration**: Connect your Twitter, Instagram, and Facebook accounts to scrape content.
- **Personalized Feed**: View posts from your social media feeds, ranked based on your preferences.
- **Interactive Post Viewing**: Like, dislike, or provide detailed feedback on posts to improve future recommendations.
- **Keyword Filtering**: Filter posts by keywords or platform.
- **Sorting Options**: Sort posts by relevance, date, likes, or comments.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python (v3.8 or higher)
- Python packages from the main project

## Installation

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

## Running the Application

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

## Usage

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

## Project Structure

- `public/` - Static files served to the browser
  - `index.html` - Landing page with profile configuration
  - `feed.html` - Feed page for viewing posts
  - `*.css` - Stylesheets for the UI
  - `*.js` - Client-side JavaScript files
- `server.js` - Express server that handles API requests
- `package.json` - Node.js dependencies and scripts

## API Endpoints

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

## Integration with Python Backend

The UI integrates with the Python backend through the Express server, which executes Python scripts as needed. The main scripts used are:

- `social_media_scraper.py` - Scrapes posts from social media
- `generate_keywords.py` - Generates keywords for posts
- `ranking_llm.py` - Ranks posts based on user profile
- `export_keywords.py` - Exports keywords to files
- `view_posts_with_keywords.py` - Retrieves posts with keywords

## License

This project is licensed under the MIT License - see the LICENSE file for details.
