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

def parse_keywords(keywords_json):
    """Parse keywords JSON string to a list."""
    if not keywords_json:
        return []
    
    try:
        return json.loads(keywords_json)
    except json.JSONDecodeError:
        return []

def view_posts(db_file='x_com_posts.db', limit=None, show_keywords=True):
    """View posts from the SQLite database with their keywords."""
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
        
        # Count posts with keywords
        has_keywords_column = 'keywords' in [c[1] for c in columns]
        if has_keywords_column:
            cursor.execute("SELECT COUNT(*) FROM posts WHERE keywords IS NOT NULL AND keywords != ''")
            posts_with_keywords = cursor.fetchone()[0]
            print(f"Posts with keywords: {posts_with_keywords} ({posts_with_keywords/total_posts*100:.1f}%)\n")
        
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
            
            # Display keywords if available
            if has_keywords_column and show_keywords:
                keywords = parse_keywords(post_dict.get('keywords'))
                if keywords:
                    print(f"  Keywords: {', '.join(keywords)}")
                else:
                    print(f"  Keywords: None")
            
            # Display metrics
            print("  Metrics:")
            print(f"    Views: {post_dict.get('views', 'N/A')}")
            print(f"    Comments: {post_dict.get('comments', 'N/A')}")
            print(f"    Retweets: {post_dict.get('retweets', 'N/A')}")
            print(f"    Likes: {post_dict.get('likes', 'N/A')}")
            print(f"    Saves: {post_dict.get('saves', 'N/A')}")
            
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
        
        # Display keyword statistics if available
        if 'keywords' in [t[0] for t in tables] and show_keywords:
            print("\nKeyword Statistics:")
            
            # Get total number of unique keywords
            cursor.execute("SELECT COUNT(*) FROM keywords")
            total_keywords = cursor.fetchone()[0]
            print(f"Total unique keywords: {total_keywords}")
            
            # Get top keywords
            cursor.execute("SELECT keyword, frequency FROM keywords ORDER BY frequency DESC LIMIT 10")
            top_keywords = cursor.fetchall()
            
            if top_keywords:
                print("\nTop 10 most frequent keywords:")
                for i, kw in enumerate(top_keywords, 1):
                    print(f"  {i}. {kw['keyword']} ({kw['frequency']} occurrences)")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

def view_keywords(db_file='x_com_posts.db', limit=20):
    """View keywords from the keywords table."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if keywords table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='keywords';")
        if not cursor.fetchone():
            print("No 'keywords' table found in the database.")
            return
        
        # Get total number of keywords
        cursor.execute("SELECT COUNT(*) FROM keywords")
        total_keywords = cursor.fetchone()[0]
        print(f"Total unique keywords: {total_keywords}\n")
        
        # Get keywords ordered by frequency
        query = "SELECT keyword, frequency, first_seen_at FROM keywords ORDER BY frequency DESC"
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        keywords = cursor.fetchall()
        
        # Display keywords
        print(f"Top {len(keywords)} keywords by frequency:")
        for i, kw in enumerate(keywords, 1):
            first_seen = format_timestamp(kw['first_seen_at'])
            print(f"{i}. {kw['keyword']} - {kw['frequency']} occurrences (first seen: {first_seen})")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="View posts and keywords from the database.")
    parser.add_argument("--db", default="x_com_posts.db", help="Database file path")
    parser.add_argument("--limit", type=int, help="Limit the number of posts/keywords to display")
    parser.add_argument("--keywords-only", action="store_true", help="Show only keywords statistics")
    parser.add_argument("--no-keywords", action="store_true", help="Don't show keywords with posts")
    
    args = parser.parse_args()
    
    if args.keywords_only:
        view_keywords(args.db, args.limit)
    else:
        view_posts(args.db, args.limit, not args.no_keywords)
