# Twitter/X.com Scraper and Data Processing Tools

This collection of scripts allows you to scrape posts from Twitter/X.com, process the data, and store it in a SQLite database. It also includes tools for generating keywords for posts using OpenRouter.

## Scripts Overview

### Main Scraping and Processing

1. **social_media_scraper.py**: Scrapes posts from Twitter/X.com and stores them in a SQLite database.
   - Uses a browser agent to log in to Twitter/X.com
   - Navigates to the home feed
   - Extracts post content, metrics, and other information
   - Stores the data in a SQLite database

2. **fix_json_parser.py**: Helps parse the JSON output from the agent when the standard parser fails.
   - Cleans up the agent's response to extract just the JSON part
   - Handles markdown code blocks and other formatting
   - Converts metrics like "1.2K" to integers (1200)
   - Can be used as a standalone script to process saved agent responses

3. **run_sql_insert.py**: Executes SQL statements from a file against a SQLite database.
   - Useful for inserting pre-defined data into the database
   - Provides feedback on the number of statements executed and posts stored

4. **insert_posts.sql**: Contains SQL statements to insert sample posts into the database.
   - Includes CREATE TABLE statement to ensure the posts table exists
   - Contains INSERT statements for multiple posts with their metrics

### Keyword Generation and Viewing

5. **generate_keywords.py**: Generates keywords for posts using OpenRouter (with GPT-4o by default).
   - Reads posts from the database
   - Uses OpenRouter to generate 3-5 keywords for each post
   - Stores the keywords in the database
   - Creates a separate table for unique keywords with frequency tracking

6. **view_posts_db.py**: Views posts from the database (original viewer).
   - Displays post content, metrics, and other information
   - Provides options to limit the number of posts displayed

7. **view_posts_with_keywords.py**: Enhanced viewer that shows posts with their keywords.
   - Displays post content, metrics, keywords, and other information
   - Shows keyword statistics and frequency
   - Offers filtering options to focus on specific data

## Usage

### Scraping Posts from Twitter/X.com

```bash
python social_media_scraper.py
```

This will:
- Prompt you for your Twitter/X.com username and password
- Open a browser and log in to Twitter/X.com
- Navigate to the home feed
- Extract posts with their metrics
- Store the posts in a SQLite database (`x_com_posts.db`)

If the script encounters an error parsing the agent's response, it will save the response to `agent_response.txt`, which you can process later using:

```bash
python fix_json_parser.py agent_response.txt
```

### Inserting Sample Data

If you want to insert sample data without scraping:

```bash
python run_sql_insert.py
```

This will execute the SQL statements in `insert_posts.sql` and insert sample posts into the database.

### Generating Keywords for Posts

After scraping posts, generate keywords for them:

```bash
python generate_keywords.py
```

Options:
- `--limit <number>`: Process only a specific number of posts
- `--batch-size <number>`: Number of posts to process before pausing (default: 10)
- `--stats`: View keyword statistics only without processing posts

### Viewing Posts and Keywords

View the posts with their generated keywords:

```bash
python view_posts_with_keywords.py
```

Options:
- `--db <path>`: Specify a different database file (default: `x_com_posts.db`)
- `--limit <number>`: Limit the number of posts to display
- `--keywords-only`: Show only keyword statistics without posts
- `--no-keywords`: Don't show keywords with posts

## Troubleshooting

- If the scraper fails to extract post metrics, try running it again. Twitter/X.com's UI can be dynamic and sometimes elements take time to load.
- If you encounter JSON parsing errors, the script will save the raw response to `agent_response.txt`. You can process this file later using `fix_json_parser.py`.
- Make sure JavaScript is enabled in the browser used by the scraper.
- If you encounter rate limits with OpenRouter, increase the `--batch-size` parameter when running `generate_keywords.py`.

## Requirements

- Python 3.7+
- Required packages: sqlite3, requests, langchain-openai, python-dotenv, pydantic
- For keyword generation: OpenRouter API key (set in `.env` file)
