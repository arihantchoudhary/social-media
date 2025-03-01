import sqlite3
import json
import os
import time
import requests
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

# Load environment variables
load_dotenv()

# Get OpenRouter API key from environment variable or prompt user
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = input("Enter your OpenRouter API key: ")

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Model to use (default to GPT-4o)
MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")

def setup_database():
    """Set up the database with necessary tables."""
    conn = sqlite3.connect("x_com_posts.db")
    cursor = conn.cursor()
    
    # Check if keywords column exists in posts table, add if it doesn't
    cursor.execute("PRAGMA table_info(posts)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if "keywords" not in columns:
        print("Adding keywords column to posts table...")
        cursor.execute("ALTER TABLE posts ADD COLUMN keywords TEXT")
    
    # Create keywords table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE,
        frequency INTEGER DEFAULT 1,
        first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database setup complete.")

def get_posts_without_keywords(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get posts that don't have keywords assigned yet."""
    conn = sqlite3.connect("x_com_posts.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT id, post_text FROM posts WHERE keywords IS NULL OR keywords = ''"
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query)
    posts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return posts

def call_openrouter(post_text: str) -> List[str]:
    """Call OpenRouter API to generate keywords for a post."""
    # Handle None or empty post_text
    if not post_text:
        print("Warning: Empty or None post_text provided")
        return []
    
    # Handle very short posts (less than 5 characters)
    if len(post_text.strip()) < 5:
        print(f"Post text too short: '{post_text}'. Extracting basic keywords.")
        words = [word.strip() for word in post_text.split() if len(word.strip()) > 2]
        if words:
            return words
        return ["short post"]
        
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a keyword extraction assistant. Extract 3-5 relevant keywords from the given text. Return only the keywords as a JSON array of strings, with no additional text or explanation. For very short texts, extract any meaningful nouns, names, or topics. Even for single sentences or fragments, identify the main subjects, actions, or themes. Always return at least 1-2 keywords for any non-empty input."
            },
            {
                "role": "user",
                "content": post_text
            }
        ]
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Try to parse the response as JSON
        try:
            keywords = json.loads(content)
            if isinstance(keywords, list):
                return keywords
            else:
                # If it's not a list, try to extract keywords from the text
                return extract_keywords_from_text(content)
        except json.JSONDecodeError:
            # If it's not valid JSON, try to extract keywords from the text
            return extract_keywords_from_text(content)
            
    except Exception as e:
        print(f"Error calling OpenRouter API: {e}")
        return []

def extract_keywords_from_text(text: str) -> List[str]:
    """Extract keywords from text if the API doesn't return a proper JSON array."""
    # Handle empty text
    if not text or not text.strip():
        return ["unknown"]
        
    # Remove common formatting
    text = text.replace("Keywords:", "").replace("keywords:", "")
    text = text.replace("[", "").replace("]", "")
    text = text.replace("{", "").replace("}", "")
    text = text.replace("'", "").replace('"', "")
    
    # Split by common separators
    for sep in [",", ";", "\n"]:
        if sep in text:
            keywords = [keyword.strip() for keyword in text.split(sep) if keyword.strip()]
            if keywords:
                return keywords
    
    # If no separators found, try to split by spaces for very short texts
    if len(text.strip()) < 30:
        words = [word.strip() for word in text.split() if len(word.strip()) > 2]
        if words:
            return words[:5]  # Limit to 5 keywords
    
    # If all else fails, just return the whole text as one keyword (up to 50 chars)
    if text.strip():
        return [text.strip()[:50]]
    
    # Absolute fallback
    return ["content"]

def update_post_keywords(post_id: int, keywords: List[str]):
    """Update a post with the generated keywords."""
    conn = sqlite3.connect("x_com_posts.db")
    cursor = conn.cursor()
    
    # Convert keywords list to JSON string
    keywords_json = json.dumps(keywords)
    
    # Update the post
    cursor.execute(
        "UPDATE posts SET keywords = ? WHERE id = ?",
        (keywords_json, post_id)
    )
    
    conn.commit()
    conn.close()

def update_keywords_table(keywords: List[str]):
    """Update the keywords table with new keywords."""
    conn = sqlite3.connect("x_com_posts.db")
    cursor = conn.cursor()
    
    for keyword in keywords:
        # Try to insert the keyword
        try:
            cursor.execute(
                "INSERT INTO keywords (keyword) VALUES (?)",
                (keyword,)
            )
        except sqlite3.IntegrityError:
            # If the keyword already exists, increment its frequency
            cursor.execute(
                "UPDATE keywords SET frequency = frequency + 1 WHERE keyword = ?",
                (keyword,)
            )
    
    conn.commit()
    conn.close()

def process_posts(limit: Optional[int] = None, batch_size: int = 10, force_update: bool = False):
    """Process posts to generate and save keywords."""
    # Set up the database
    setup_database()
    
    # Get posts without keywords or all posts if force_update is True
    if force_update:
        conn = sqlite3.connect("x_com_posts.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT id, post_text FROM posts"
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        posts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        total_posts = len(posts)
        print(f"Force updating keywords for {total_posts} posts.")
    else:
        # Get posts without keywords
        posts = get_posts_without_keywords(limit)
        total_posts = len(posts)
        
        if total_posts == 0:
            print("No posts found without keywords.")
            return
        
        print(f"Found {total_posts} posts without keywords.")
    
    # Process posts in batches to avoid rate limits
    for i, post in enumerate(posts):
        print(f"Processing post {i+1}/{total_posts} (ID: {post['id']})...")
        
        # Generate keywords
        keywords = call_openrouter(post["post_text"])
        
        if keywords:
            print(f"Generated keywords: {', '.join(keywords)}")
            
            # Update the post with keywords
            update_post_keywords(post["id"], keywords)
            
            # Update the keywords table
            update_keywords_table(keywords)
        else:
            print("Failed to generate keywords for this post.")
        
        # Sleep between requests to avoid rate limits
        if (i + 1) % batch_size == 0 and i + 1 < total_posts:
            print(f"Processed {i+1} posts. Sleeping for 5 seconds to avoid rate limits...")
            time.sleep(5)
    
    print(f"Finished processing {total_posts} posts.")

def view_keywords_stats():
    """View statistics about the keywords in the database."""
    conn = sqlite3.connect("x_com_posts.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get total number of keywords
    cursor.execute("SELECT COUNT(*) FROM keywords")
    total_keywords = cursor.fetchone()[0]
    
    # Get top 10 most frequent keywords
    cursor.execute(
        "SELECT keyword, frequency FROM keywords ORDER BY frequency DESC LIMIT 10"
    )
    top_keywords = cursor.fetchall()
    
    print(f"\nKeyword Statistics:")
    print(f"Total unique keywords: {total_keywords}")
    
    if top_keywords:
        print("\nTop 10 most frequent keywords:")
        for i, keyword in enumerate(top_keywords, 1):
            print(f"{i}. {keyword['keyword']} ({keyword['frequency']} occurrences)")
    
    conn.close()

def fix_missing_keywords():
    """Fix posts that don't have keywords by processing them specifically."""
    # Get posts without keywords
    posts = get_posts_without_keywords()
    
    if not posts:
        print("No posts found without keywords.")
        return
    
    print(f"Found {len(posts)} posts without keywords. Processing them...")
    
    # Process each post
    for i, post in enumerate(posts):
        print(f"Processing post {i+1}/{len(posts)} (ID: {post['id']})...")
        
        # For very short posts, use a simpler approach
        if not post["post_text"] or len(post["post_text"].strip()) < 10:
            print(f"Short post detected: '{post['post_text']}'")
            
            # Extract simple keywords
            if post["post_text"]:
                words = [word.strip() for word in post["post_text"].split() if len(word.strip()) > 2]
                if words:
                    keywords = words[:5]  # Limit to 5 keywords
                else:
                    keywords = ["short post"]
            else:
                keywords = ["empty post"]
                
            print(f"Generated simple keywords: {', '.join(keywords)}")
            
            # Update the post with keywords
            update_post_keywords(post["id"], keywords)
            
            # Update the keywords table
            update_keywords_table(keywords)
            continue
        
        # For normal posts, use the API
        keywords = call_openrouter(post["post_text"])
        
        if keywords:
            print(f"Generated keywords: {', '.join(keywords)}")
            
            # Update the post with keywords
            update_post_keywords(post["id"], keywords)
            
            # Update the keywords table
            update_keywords_table(keywords)
        else:
            # Fallback for API failures
            print("API failed to generate keywords. Using fallback method.")
            
            # Extract simple keywords from the text
            words = post["post_text"].split()
            # Get the 3-5 longest words as keywords
            words.sort(key=len, reverse=True)
            keywords = [word.strip() for word in words[:5] if len(word.strip()) > 3]
            
            if not keywords:
                keywords = ["content"]
                
            print(f"Generated fallback keywords: {', '.join(keywords)}")
            
            # Update the post with keywords
            update_post_keywords(post["id"], keywords)
            
            # Update the keywords table
            update_keywords_table(keywords)
        
        # Sleep between API requests to avoid rate limits
        if (i + 1) % 5 == 0 and i + 1 < len(posts):
            print(f"Processed {i+1} posts. Sleeping for 3 seconds to avoid rate limits...")
            time.sleep(3)
    
    print(f"Finished processing {len(posts)} posts.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate keywords for posts using OpenRouter.")
    parser.add_argument("--limit", type=int, help="Limit the number of posts to process")
    parser.add_argument("--batch-size", type=int, default=10, help="Number of posts to process before sleeping")
    parser.add_argument("--stats", action="store_true", help="View keyword statistics")
    parser.add_argument("--force", action="store_true", help="Force update keywords for all posts, even those that already have keywords")
    parser.add_argument("--fix-missing", action="store_true", help="Fix posts that don't have keywords yet")
    
    args = parser.parse_args()
    
    if args.stats:
        view_keywords_stats()
    elif args.fix_missing:
        fix_missing_keywords()
        view_keywords_stats()
    else:
        process_posts(limit=args.limit, batch_size=args.batch_size, force_update=args.force)
        view_keywords_stats()
