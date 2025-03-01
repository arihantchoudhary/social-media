import sqlite3
import json
import os
import time
import requests
from datetime import datetime
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

def load_keywords(keywords_file='keywords.txt'):
    """Load keywords from the keywords file."""
    try:
        with open(keywords_file, 'r', encoding='utf-8') as f:
            keywords = [line.strip() for line in f if line.strip()]
        return keywords
    except FileNotFoundError:
        print(f"Keywords file '{keywords_file}' not found.")
        return []

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

import requests
import json
from typing import List

def keyword_finder_llm(user_query: str, keywords: List[str], user_profile: str = None) -> List[str]:
    """
    Call the LLM to find which of the existing keywords are most relevant to the user query.
    
    Args:
        user_query: The user's query string describing what content they're looking for.
        keywords: List of available keywords from keywords.txt.
        user_profile: Optional user profile to help with keyword selection.
        
    Returns:
        List of the most relevant keywords from the available keywords list.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Format the keywords as a comma-separated string
    keywords_str = ", ".join(keywords)
    
    # Pre-compute the user profile text to avoid backslashes in the f-string expression
    user_profile_text = ("USER PROFILE:\n" + user_profile + "\n\n") if user_profile else ""
    
    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": f"""You are a keyword matching assistant. Given a user query and a list of available keywords, identify which of the existing keywords are most relevant to the user's query.

Available keywords: {keywords_str}

{user_profile_text}IMPORTANT: You must return a MINIMUM of 2 and a MAXIMUM of 5 keywords, even if they are only somewhat related.
Always select the most relevant keywords possible from the available list.

If a user profile is provided, consider the user's interests and preferences when selecting keywords.

Return only the relevant keywords as a JSON array of strings, with no additional text or explanation.
Only return keywords from the provided list.
"""
            },
            {
                "role": "user",
                "content": user_query
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
            matched_keywords = json.loads(content)
            if isinstance(matched_keywords, list):
                return matched_keywords
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
    # Remove common formatting
    text = text.replace("Keywords:", "").replace("keywords:", "")
    text = text.replace("[", "").replace("]", "")
    text = text.replace("{", "").replace("}", "")
    text = text.replace("'", "").replace('"', "")
    
    # Split by common separators
    for sep in [",", ";", "\n"]:
        if sep in text:
            return [keyword.strip() for keyword in text.split(sep) if keyword.strip()]
    
    # If no separators found, just return the whole text as one keyword
    return [text.strip()] if text.strip() else []

def get_posts_by_keywords(keywords: List[str], db_file='x_com_posts.db') -> List[Dict[str, Any]]:
    """
    Get posts from the database that match the given keywords.
    
    Args:
        keywords: List of keywords to match
        db_file: Path to the SQLite database file
        
    Returns:
        List of posts that match the keywords
    """
    if not keywords:
        return []
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all posts
        cursor.execute("SELECT * FROM posts ORDER BY scraped_at DESC")
        all_posts = [dict(row) for row in cursor.fetchall()]
        
        # Filter posts by keywords
        matching_posts = []
        
        for post in all_posts:
            post_keywords = []
            
            # Parse keywords JSON if it exists
            if post.get('keywords'):
                try:
                    post_keywords = json.loads(post['keywords'])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # Count how many keywords match
            matching_keyword_count = sum(1 for kw in keywords if kw in post_keywords)
            
            # If at least one keyword matches, add the post to the results
            if matching_keyword_count > 0:
                # Store the matching keyword count for ranking later
                post['matching_keyword_count'] = matching_keyword_count
                matching_posts.append(post)
        
        conn.close()
        return matching_posts
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def rank_posts(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Rank posts based on keyword matches, ranking, and recency.
    
    Args:
        posts: List of posts to rank
        
    Returns:
        List of posts sorted by relevance, ranking, and recency
    """
    # Calculate a score for each post
    for post in posts:
        score = 0
        
        # Consider keyword match count (highest priority)
        # Each matching keyword adds 30 points to the score
        matching_keyword_count = post.get('matching_keyword_count', 0)
        score += matching_keyword_count * 30
        
        # Consider ranking if available
        if post.get('user_ranking'):
            try:
                score += float(post.get('user_ranking', 0))
            except (ValueError, TypeError):
                pass
        
        # Consider metrics (views, likes, etc.)
        try:
            # Views
            views = post.get('views', 0)
            if views and views != 'N/A':
                views = int(str(views).replace(',', ''))
                score += min(views / 1000000, 20)  # Cap at 20 points
                
            # Likes
            likes = post.get('likes', 0)
            if likes and likes != 'N/A':
                likes = int(str(likes).replace(',', ''))
                score += min(likes / 10000, 15)  # Cap at 15 points
                
            # Comments
            comments = post.get('comments', 0)
            if comments and comments != 'N/A':
                comments = int(str(comments).replace(',', ''))
                score += min(comments / 1000, 10)  # Cap at 10 points
                
            # Retweets
            retweets = post.get('retweets', 0)
            if retweets and retweets != 'N/A':
                retweets = int(str(retweets).replace(',', ''))
                score += min(retweets / 5000, 10)  # Cap at 10 points
        except (ValueError, TypeError):
            pass
        
        # Consider recency
        try:
            # Parse the scraped_at timestamp
            if post.get('scraped_at'):
                # Convert to datetime object
                scraped_at = datetime.strptime(post.get('scraped_at'), '%Y-%m-%d %H:%M:%S')
                
                # Calculate days since scraping
                days_ago = (datetime.now() - scraped_at).days
                
                # Add recency score (max 20 points for very recent posts)
                recency_score = max(0, 20 - days_ago)
                score += recency_score
        except (ValueError, TypeError):
            pass
        
        # Store the score
        post['relevance_score'] = score
    
    # Sort posts by score (descending)
    sorted_posts = sorted(posts, key=lambda x: x.get('relevance_score', 0), reverse=True)
    
    # Return top 10 posts
    return sorted_posts[:10]

def format_post(post: Dict[str, Any]) -> str:
    """Format a post for display."""
    formatted = f"Post #{post.get('id', 'N/A')}:\n"
    formatted += f"  Username: {post.get('username', 'N/A')}\n"
    formatted += f"  URL: {post.get('post_url', 'N/A')}\n"
    formatted += f"  Posted at: {post.get('post_time', 'N/A')}\n"
    formatted += f"  Scraped at: {post.get('scraped_at', 'N/A')}\n"
    
    # Display matching keyword count and relevance score if available
    if 'matching_keyword_count' in post:
        formatted += f"  Matching Keywords: {post.get('matching_keyword_count')}\n"
    if 'relevance_score' in post:
        formatted += f"  Relevance Score: {post.get('relevance_score', 0):.2f}\n"
    
    # Display keywords if available
    if post.get('keywords'):
        try:
            keywords = json.loads(post['keywords'])
            if keywords:
                formatted += f"  Keywords: {', '.join(keywords)}\n"
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Display metrics
    formatted += "  Metrics:\n"
    formatted += f"    Views: {post.get('views', 'N/A')}\n"
    formatted += f"    Comments: {post.get('comments', 'N/A')}\n"
    formatted += f"    Retweets: {post.get('retweets', 'N/A')}\n"
    formatted += f"    Likes: {post.get('likes', 'N/A')}\n"
    
    # Display user ranking if available
    if post.get('user_ranking'):
        formatted += f"    User Ranking: {post.get('user_ranking', 'N/A')}\n"
    
    # Display image URL if available
    if post.get('image_url'):
        formatted += f"  Image URL: {post.get('image_url')}\n"
    
    # Display post text
    post_text = post.get('post_text', 'N/A')
    if post_text is None:
        formatted += f"  Text: None\n"
    elif len(post_text) > 100:
        formatted += f"  Text: {post_text[:100]}...\n"
    else:
        formatted += f"  Text: {post_text}\n"
    
    return formatted

def ensure_keyword_count(keywords: List[str], all_keywords: List[str], min_count: int = 2, max_count: int = 5) -> List[str]:
    """
    Ensure that the number of keywords is within the specified range.
    If too few, add more from the available keywords.
    If too many, keep only the most relevant ones.
    """
    if len(keywords) < min_count:
        # If we have too few keywords, add more from the available keywords
        # We'll just take the first ones we find to reach the minimum count
        additional_needed = min_count - len(keywords)
        for kw in all_keywords:
            if kw not in keywords:
                keywords.append(kw)
                additional_needed -= 1
                if additional_needed == 0:
                    break
    
    # If we have too many keywords, keep only the maximum allowed
    if len(keywords) > max_count:
        keywords = keywords[:max_count]
    
    return keywords

def save_posts_to_database(posts: List[Dict[str, Any]], db_file='posts_selected.db', query: str = None):
    """
    Save selected posts to a database for other programs to use.
    
    Args:
        posts: List of posts to save
        db_file: Path to the SQLite database file
        query: The user query that was used to find these posts
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create the selected_posts table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS selected_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_post_id INTEGER,
            username TEXT,
            post_url TEXT,
            post_time TEXT,
            scraped_at TEXT,
            post_text TEXT,
            keywords TEXT,
            matching_keyword_count INTEGER,
            relevance_score REAL,
            views INTEGER,
            comments INTEGER,
            retweets INTEGER,
            likes INTEGER,
            user_ranking REAL,
            image_url TEXT,
            query TEXT,
            selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create the queries table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Insert the query
        if query:
            cursor.execute(
                "INSERT INTO queries (query) VALUES (?)",
                (query,)
            )
            query_id = cursor.lastrowid
        else:
            query_id = None
        
        # Insert the posts
        for post in posts:
            # Convert metrics to integers if possible
            views = post.get('views', 0)
            if views and views != 'N/A':
                try:
                    views = int(str(views).replace(',', ''))
                except (ValueError, TypeError):
                    views = 0
            else:
                views = 0
                
            comments = post.get('comments', 0)
            if comments and comments != 'N/A':
                try:
                    comments = int(str(comments).replace(',', ''))
                except (ValueError, TypeError):
                    comments = 0
            else:
                comments = 0
                
            retweets = post.get('retweets', 0)
            if retweets and retweets != 'N/A':
                try:
                    retweets = int(str(retweets).replace(',', ''))
                except (ValueError, TypeError):
                    retweets = 0
            else:
                retweets = 0
                
            likes = post.get('likes', 0)
            if likes and likes != 'N/A':
                try:
                    likes = int(str(likes).replace(',', ''))
                except (ValueError, TypeError):
                    likes = 0
            else:
                likes = 0
            
            # Insert the post
            cursor.execute(
                """
                INSERT INTO selected_posts (
                    original_post_id, username, post_url, post_time, scraped_at,
                    post_text, keywords, matching_keyword_count, relevance_score,
                    views, comments, retweets, likes, user_ranking, image_url, query
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    post.get('id'),
                    post.get('username'),
                    post.get('post_url'),
                    post.get('post_time'),
                    post.get('scraped_at'),
                    post.get('post_text'),
                    post.get('keywords'),
                    post.get('matching_keyword_count'),
                    post.get('relevance_score'),
                    views,
                    comments,
                    retweets,
                    likes,
                    post.get('user_ranking'),
                    post.get('image_url'),
                    query
                )
            )
        
        # Commit the changes
        conn.commit()
        conn.close()
        
        print(f"Successfully saved {len(posts)} posts to {db_file}")
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Main function to run the keyword finder and post selector."""
    # Load keywords from keywords.txt
    keywords = load_keywords()
    
    if not keywords:
        print("No keywords available. Please run export_keywords.py first.")
        return
    
    print(f"Loaded {len(keywords)} keywords from keywords.txt.")
    
    # Load user profile
    user_profile = load_user_profile()
    if user_profile:
        print("User profile loaded successfully.")
    else:
        print("No user profile found. Proceeding without user profile.")
    
    # Get user query
    user_query = input("What content are you looking for? ")
    
    # Call keyword_finder_llm to find relevant keywords
    print("Calling keyword_finder_llm to find relevant keywords...")
    relevant_keywords = keyword_finder_llm(user_query, keywords, user_profile)
    
    # Ensure we have between 2 and 5 keywords
    relevant_keywords = ensure_keyword_count(relevant_keywords, keywords)
    
    print(f"Found {len(relevant_keywords)} relevant keywords:")
    for keyword in relevant_keywords:
        print(f"- {keyword}")
    
    # Get posts by keywords
    print("\nFinding posts with related keywords...")
    matching_posts = get_posts_by_keywords(relevant_keywords)
    
    if not matching_posts:
        print("No matching posts found.")
        return
    
    print(f"Found {len(matching_posts)} matching posts.")
    
    # Rank posts by relevance, ranking, and recency
    print("Ranking posts by relevance, ranking, and recency...")
    ranked_posts = rank_posts(matching_posts)
    
    # Save ranked posts to database
    print(f"Saving top {len(ranked_posts)} posts to database...")
    save_posts_to_database(ranked_posts, query=user_query)
    
    print(f"\nTop {len(ranked_posts)} posts:\n")
    
    # Display ranked posts
    for i, post in enumerate(ranked_posts, 1):
        print(f"#{i} -------------------------")
        print(format_post(post))
        print()

def main_with_query(user_query: str):
    """Run the main function with a predefined query (non-interactive mode)."""
    # Load keywords from keywords.txt
    keywords = load_keywords()
    
    if not keywords:
        print("No keywords available. Please run export_keywords.py first.")
        return
    
    print(f"Loaded {len(keywords)} keywords from keywords.txt.")
    
    # Load user profile
    user_profile = load_user_profile()
    if user_profile:
        print("User profile loaded successfully.")
    else:
        print("No user profile found. Proceeding without user profile.")
    
    print(f"Using query: {user_query}")
    
    # Call keyword_finder_llm to find relevant keywords
    print("Calling keyword_finder_llm to find relevant keywords...")
    relevant_keywords = keyword_finder_llm(user_query, keywords, user_profile)
    
    # Ensure we have between 2 and 5 keywords
    relevant_keywords = ensure_keyword_count(relevant_keywords, keywords)
    
    print(f"Found {len(relevant_keywords)} relevant keywords:")
    for keyword in relevant_keywords:
        print(f"- {keyword}")
    
    # Get posts by keywords
    print("\nFinding posts with related keywords...")
    matching_posts = get_posts_by_keywords(relevant_keywords)
    
    if not matching_posts:
        print("No matching posts found.")
        return
    
    print(f"Found {len(matching_posts)} matching posts.")
    
    # Rank posts by relevance, ranking, and recency
    print("Ranking posts by relevance, ranking, and recency...")
    ranked_posts = rank_posts(matching_posts)
    
    # Save ranked posts to database
    print(f"Saving top {len(ranked_posts)} posts to database...")
    save_posts_to_database(ranked_posts, query=user_query)
    
    print(f"\nTop {len(ranked_posts)} posts:\n")
    
    # Display ranked posts
    for i, post in enumerate(ranked_posts, 1):
        print(f"#{i} -------------------------")
        print(format_post(post))
        print()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Find and select posts based on user query.")
    parser.add_argument("--dynamic", action="store_true", help="Force regeneration of dynamic profile before searching")
    parser.add_argument("--query", help="Query for content discovery (non-interactive mode)")
    parser.add_argument("--query-file", help="File containing the query for content discovery")
    
    args = parser.parse_args()
    
    # Generate dynamic profile if requested
    if args.dynamic and os.path.exists("dynamic_user_profile.py"):
        print("Forcing dynamic profile regeneration...")
        try:
            import dynamic_user_profile
            dynamic_user_profile.main()
        except Exception as e:
            print(f"Error generating dynamic profile: {e}")
    
    # Determine the query
    query = None
    
    # First check if query-file is provided
    if args.query_file:
        try:
            with open(args.query_file, 'r', encoding='utf-8') as f:
                query = f.read().strip()
            print(f"Using query from file: {query}")
        except Exception as e:
            print(f"Error reading query file: {e}")
    # Then check if query is provided directly
    elif args.query:
        query = args.query
    
    # Run in non-interactive mode if query is provided
    if query:
        main_with_query(query)
    else:
        main()
