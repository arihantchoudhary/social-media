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

# Model to use (default to o3 mini as requested)
MODEL = "openai/o3-mini"

def load_user_profile():
    """Load the user profile, preferring environment variable, then dynamic profile, then file."""
    # First check if profile is provided in environment variable (from server.js)
    env_profile = os.getenv("USER_PROFILE_CONTENT")
    if env_profile:
        print("Using user profile from environment variable...")
        return env_profile
    
    # Try to load dynamic profile next
    try:
        if os.path.exists("dynamic_user_profile.md"):
            print("Using dynamic user profile...")
            with open("dynamic_user_profile.md", "r") as file:
                return file.read()
    except Exception as e:
        print(f"Error loading dynamic user profile: {e}")
        # Fall back to base profile
    
    # Load base profile if dynamic profile not available or failed to load
    try:
        print("Using base user profile...")
        with open("user_profile.txt", "r") as file:
            return file.read()
    except Exception as e:
        print(f"Error loading base user profile: {e}")
        return None

def setup_database():
    """Set up the database with necessary tables and columns."""
    conn = sqlite3.connect("x_com_posts.db")
    cursor = conn.cursor()
    
    # Check if user_ranking column exists in posts table, add if it doesn't
    cursor.execute("PRAGMA table_info(posts)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if "user_ranking" not in columns:
        print("Adding user_ranking column to posts table...")
        cursor.execute("ALTER TABLE posts ADD COLUMN user_ranking INTEGER")
    
    conn.commit()
    conn.close()
    print("Database setup complete.")

def get_posts_for_ranking(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get posts that need to be ranked."""
    conn = sqlite3.connect("x_com_posts.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all necessary post data for ranking
    query = """
    SELECT id, username, post_text, views, comments, retweets, likes, saves, keywords
    FROM posts 
    WHERE user_ranking IS NULL
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query)
    posts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return posts

def call_openrouter_for_ranking(user_profile: str, post: Dict[str, Any]) -> int:
    """Call OpenRouter API to rank a post based on user preferences."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Format post statistics for the prompt
    stats = {
        "views": post.get("views", "N/A"),
        "comments": post.get("comments", "N/A"),
        "retweets": post.get("retweets", "N/A"),
        "likes": post.get("likes", "N/A"),
        "saves": post.get("saves", "N/A")
    }
    
    # Parse keywords if they exist
    keywords = []
    if post.get("keywords"):
        try:
            keywords = json.loads(post["keywords"])
        except:
            # If keywords can't be parsed as JSON, try to extract them from the text
            if isinstance(post["keywords"], str):
                keywords = [k.strip() for k in post["keywords"].split(",")]
    
    # Create the prompt for the LLM
    prompt = f"""
USER PROFILE:
{user_profile}

POST TO RANK:
Username: {post.get('username', 'Unknown')}
Text: {post.get('post_text', '')}
Keywords: {', '.join(keywords) if keywords else 'None'}

POST STATISTICS:
Views: {stats['views']}
Comments: {stats['comments']}
Retweets: {stats['retweets']}
Likes: {stats['likes']}
Saves: {stats['saves']}

Based on the user profile and the post details above, rank this post on a scale of 0-100 based on how likely the user would like or engage with this post.
0 means the user would definitely dislike or ignore this post.
100 means the user would definitely like, engage with, or save this post.

Return only a single number between 0 and 100, with no additional text.
"""
    
    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a post ranking assistant. Your task is to analyze social media posts and determine how likely a specific user would like them based on their preferences. Return only a numerical score from 0-100."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Try to extract a number from the response
        try:
            # Clean the response and extract just the number
            content = content.strip()
            # Remove any non-numeric characters except for digits
            digits = ''.join(c for c in content if c.isdigit())
            ranking = int(digits)
            
            # Ensure the ranking is within the valid range
            if ranking > 100:
                ranking = 100
            
            return ranking
        except ValueError:
            print(f"Could not parse ranking from response: {content}")
            return 50  # Default to neutral ranking if parsing fails
            
    except Exception as e:
        print(f"Error calling OpenRouter API: {e}")
        return 50  # Default to neutral ranking if API call fails

def update_post_ranking(post_id: int, ranking: int):
    """Update a post with the generated ranking."""
    conn = sqlite3.connect("x_com_posts.db")
    cursor = conn.cursor()
    
    # Update the post
    cursor.execute(
        "UPDATE posts SET user_ranking = ? WHERE id = ?",
        (ranking, post_id)
    )
    
    conn.commit()
    conn.close()

def process_posts(limit: Optional[int] = None, batch_size: int = 5, force_dynamic: bool = False):
    """Process posts to generate and save rankings."""
    # Generate dynamic profile if requested
    if force_dynamic and os.path.exists("dynamic_user_profile.py"):
        print("Forcing dynamic profile regeneration...")
        try:
            import dynamic_user_profile
            dynamic_user_profile.main()
        except Exception as e:
            print(f"Error generating dynamic profile: {e}")
    
    # Load user profile
    user_profile = load_user_profile()
    if not user_profile:
        print("Failed to load user profile. Exiting.")
        return
    
    # Set up the database
    setup_database()
    
    # Get posts for ranking
    posts = get_posts_for_ranking(limit)
    total_posts = len(posts)
    
    if total_posts == 0:
        print("No posts found that need ranking.")
        return
    
    print(f"Found {total_posts} posts to rank.")
    
    # Process posts in batches to avoid rate limits
    for i, post in enumerate(posts):
        print(f"Processing post {i+1}/{total_posts} (ID: {post['id']})...")
        
        # Generate ranking
        ranking = call_openrouter_for_ranking(user_profile, post)
        
        print(f"Generated ranking: {ranking}/100")
        
        # Update the post with ranking
        update_post_ranking(post["id"], ranking)
        
        # Sleep between requests to avoid rate limits
        if (i + 1) % batch_size == 0 and i + 1 < total_posts:
            print(f"Processed {i+1} posts. Sleeping for 5 seconds to avoid rate limits...")
            time.sleep(5)
    
    print(f"Finished ranking {total_posts} posts.")

def view_ranking_stats():
    """View statistics about the rankings in the database."""
    conn = sqlite3.connect("x_com_posts.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get total number of ranked posts
    cursor.execute("SELECT COUNT(*) FROM posts WHERE user_ranking IS NOT NULL")
    total_ranked = cursor.fetchone()[0]
    
    # Get total number of posts
    cursor.execute("SELECT COUNT(*) FROM posts")
    total_posts = cursor.fetchone()[0]
    
    # Get average ranking
    cursor.execute("SELECT AVG(user_ranking) FROM posts WHERE user_ranking IS NOT NULL")
    avg_ranking = cursor.fetchone()[0]
    
    # Get top 5 highest ranked posts
    cursor.execute("""
        SELECT id, username, post_text, user_ranking 
        FROM posts 
        WHERE user_ranking IS NOT NULL 
        ORDER BY user_ranking DESC 
        LIMIT 5
    """)
    top_posts = cursor.fetchall()
    
    print(f"\nRanking Statistics:")
    print(f"Total ranked posts: {total_ranked}/{total_posts} ({total_ranked/total_posts*100:.1f}%)")
    print(f"Average ranking: {avg_ranking:.1f}/100")
    
    if top_posts:
        print("\nTop 5 highest ranked posts:")
        for i, post in enumerate(top_posts, 1):
            # Truncate post text if too long
            post_text = post['post_text']
            if len(post_text) > 50:
                post_text = post_text[:50] + "..."
                
            print(f"{i}. @{post['username']} ({post['user_ranking']}/100): {post_text}")
    
    conn.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Rank posts based on user preferences using OpenRouter.")
    parser.add_argument("--limit", type=int, help="Limit the number of posts to process")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of posts to process before sleeping")
    parser.add_argument("--stats", action="store_true", help="View ranking statistics")
    parser.add_argument("--dynamic", action="store_true", help="Force regeneration of dynamic profile before ranking")
    
    args = parser.parse_args()
    
    if args.stats:
        view_ranking_stats()
    else:
        process_posts(limit=args.limit, batch_size=args.batch_size, force_dynamic=args.dynamic)
        view_ranking_stats()
