import sqlite3
import sys
import json
from datetime import datetime

def format_timestamp(timestamp_str):
    """Format a timestamp string to a more readable format."""
    try:
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return timestamp_str

def view_posts(db_file='x_com_posts.db', limit=None):
    """View posts from the SQLite database."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database: {', '.join([t[0] for t in tables])}\n")
        
        # Check if posts table exists
        if 'posts' not in [t[0] for t in tables]:
            print("No 'posts' table found in the database.")
            return
        
        # Get column info
        cursor.execute(f"PRAGMA table_info(posts)")
        columns = cursor.fetchall()
        print(f"Columns in 'posts' table: {', '.join([c[1] for c in columns])}\n")
        
        # Count total posts
        cursor.execute("SELECT COUNT(*) FROM posts")
        total_posts = cursor.fetchone()[0]
        print(f"Total posts in database: {total_posts}\n")
        
        # Query to get posts
        query = "SELECT * FROM posts ORDER BY scraped_at DESC"
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        posts = cursor.fetchall()
        
        # Display posts
        for i, post in enumerate(posts, 1):
            post_dict = {key: post[key] for key in post.keys()}
            
            # Format the timestamp if it exists
            if 'scraped_at' in post_dict:
                post_dict['scraped_at'] = format_timestamp(post_dict['scraped_at'])
            
            print(f"Post #{i}:")
            print(f"  Username: {post_dict.get('username', 'N/A')}")
            print(f"  URL: {post_dict.get('post_url', 'N/A')}")
            print(f"  Posted at: {post_dict.get('post_time', 'N/A')}")
            print(f"  Scraped at: {post_dict.get('scraped_at', 'N/A')}")
            
            # Display metrics
            print("  Metrics:")
            print(f"    Views: {post_dict.get('views', 'N/A')}")
            print(f"    Comments: {post_dict.get('comments', 'N/A')}")
            print(f"    Retweets: {post_dict.get('retweets', 'N/A')}")
            print(f"    Likes: {post_dict.get('likes', 'N/A')}")
            print(f"    Saves: {post_dict.get('saves', 'N/A')}")
            
            # Display user ranking if it exists
            if 'user_ranking' in post_dict:
                print(f"    User Ranking: {post_dict.get('user_ranking', 'N/A')}/100")
            
            # Display image URL if available
            if post_dict.get('image_url'):
                print(f"  Image URL: {post_dict.get('image_url')}")
            
            # Display post text (truncated if too long)
            post_text = post_dict.get('post_text', 'N/A')
            if post_text is None:
                print(f"  Text: None")
            elif len(post_text) > 100:
                print(f"  Text: {post_text[:100]}...")
            else:
                print(f"  Text: {post_text}")
            print()
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Get optional command line arguments
    db_file = 'x_com_posts.db'
    limit = None
    
    if len(sys.argv) > 1:
        db_file = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            limit = int(sys.argv[2])
        except ValueError:
            print(f"Invalid limit value: {sys.argv[2]}. Using default.")
    
    view_posts(db_file, limit)
