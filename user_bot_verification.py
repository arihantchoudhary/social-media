import sqlite3
import json
import os
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

def load_user_profile(profile_file='user_profile.txt'):
    """Load the user profile from the profile file."""
    try:
        with open(profile_file, 'r', encoding='utf-8') as f:
            profile = f.read()
        return profile
    except FileNotFoundError:
        print(f"User profile file '{profile_file}' not found.")
        return ""

def setup_database(db_file='posts_selected.db'):
    """Set up the database with necessary tables and columns."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Check if selected_posts table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='selected_posts';")
        if not cursor.fetchone():
            print("No 'selected_posts' table found in the database.")
            conn.close()
            return False
        
        # Check if llm_clone_validated column exists in selected_posts table
        cursor.execute("PRAGMA table_info(selected_posts)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "llm_clone_validated" not in columns:
            print("Adding llm_clone_validated column to selected_posts table...")
            cursor.execute("ALTER TABLE selected_posts ADD COLUMN llm_clone_validated TEXT")
            conn.commit()
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def get_unvalidated_posts(db_file='posts_selected.db'):
    """Get posts from the database that haven't been validated yet."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get posts that haven't been validated
        cursor.execute(
            "SELECT * FROM selected_posts WHERE llm_clone_validated IS NULL OR llm_clone_validated = ''"
        )
        posts = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return posts
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def format_post_for_llm(post):
    """Format a post for the LLM to evaluate."""
    formatted = f"Post by {post.get('username', 'Unknown User')}:\n"
    
    # Add post text
    post_text = post.get('post_text')
    if post_text:
        formatted += f"Content: {post_text}\n"
    
    # Add metrics if available
    metrics = []
    if post.get('views') and post.get('views') != 0:
        metrics.append(f"{post.get('views')} views")
    if post.get('likes') and post.get('likes') != 0:
        metrics.append(f"{post.get('likes')} likes")
    if post.get('comments') and post.get('comments') != 0:
        metrics.append(f"{post.get('comments')} comments")
    if post.get('retweets') and post.get('retweets') != 0:
        metrics.append(f"{post.get('retweets')} retweets")
    
    if metrics:
        formatted += f"Metrics: {', '.join(metrics)}\n"
    
    # Add keywords if available
    if post.get('keywords'):
        try:
            keywords = json.loads(post.get('keywords'))
            if keywords:
                formatted += f"Keywords: {', '.join(keywords)}\n"
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Add image URL if available
    if post.get('image_url'):
        formatted += f"Has image: Yes\n"
    
    return formatted

def llm_validate_post(user_profile, post, query):
    """
    Call the LLM to validate if the user would like or pass on the post.
    
    Args:
        user_profile: The user profile text
        post: The post to validate
        query: The query that was used to find this post
        
    Returns:
        "like" or "pass" based on the LLM's decision
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Format the post for the LLM
    formatted_post = format_post_for_llm(post)
    
    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": f"""You are a clone of a specific user with the following profile:

{user_profile}

Your task is to evaluate social media posts and decide whether the real user would LIKE or PASS on them.
The user was searching for: "{query}"

Respond with ONLY "LIKE" or "PASS" based on whether the real user would be interested in this content.
Consider the user's interests, preferences, and the relevance of the post to their search query.
"""
            },
            {
                "role": "user",
                "content": f"Would I like or pass on this post?\n\n{formatted_post}"
            }
        ]
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"].strip().upper()
        
        # Extract LIKE or PASS from the response
        if "LIKE" in content:
            return "like"
        elif "PASS" in content:
            return "pass"
        else:
            print(f"Unexpected response from LLM: {content}")
            # Default to pass if we can't determine
            return "pass"
            
    except Exception as e:
        print(f"Error calling OpenRouter API: {e}")
        # Default to pass if there's an error
        return "pass"

def update_post_validation(post_id, validation, db_file='posts_selected.db'):
    """Update a post with the validation result."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Update the post
        cursor.execute(
            "UPDATE selected_posts SET llm_clone_validated = ? WHERE id = ?",
            (validation, post_id)
        )
        
        conn.commit()
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Main function to run the user bot verification."""
    print("Starting user bot verification...")
    
    # Load user profile
    user_profile = load_user_profile()
    if not user_profile:
        print("Failed to load user profile. Exiting.")
        return
    
    print("User profile loaded successfully.")
    
    # Set up the database
    if not setup_database():
        print("Failed to set up database. Exiting.")
        return
    
    print("Database set up successfully.")
    
    # Get unvalidated posts
    posts = get_unvalidated_posts()
    if not posts:
        print("No unvalidated posts found.")
        return
    
    print(f"Found {len(posts)} unvalidated posts.")
    
    # Process each post
    for i, post in enumerate(posts, 1):
        post_id = post.get('id')
        query = post.get('query', 'unknown')
        
        print(f"Processing post {i}/{len(posts)} (ID: {post_id})...")
        
        # Call LLM to validate post
        validation = llm_validate_post(user_profile, post, query)
        
        print(f"LLM decision: {validation}")
        
        # Update post with validation
        if update_post_validation(post_id, validation):
            print(f"Successfully updated post {post_id} with validation: {validation}")
        else:
            print(f"Failed to update post {post_id}")
        
        print()
    
    print("Finished processing all posts.")

if __name__ == "__main__":
    main()
