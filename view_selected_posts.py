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

def view_selected_posts(db_file='posts_selected.db', limit=None, show_queries=False, validation_filter=""):
    """View selected posts from the SQLite database."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database: {', '.join([t[0] for t in tables])}\n")
        
        # Check if selected_posts table exists
        if 'selected_posts' not in [t[0] for t in tables]:
            print("No 'selected_posts' table found in the database.")
            return
        
        # Get column info
        cursor.execute(f"PRAGMA table_info(selected_posts)")
        columns = cursor.fetchall()
        print(f"Columns in 'selected_posts' table: {', '.join([c[1] for c in columns])}\n")
        
        # Count total posts
        cursor.execute("SELECT COUNT(*) FROM selected_posts")
        total_posts = cursor.fetchone()[0]
        print(f"Total selected posts in database: {total_posts}\n")
        
        # Display queries if requested
        if show_queries and 'queries' in [t[0] for t in tables]:
            cursor.execute("SELECT id, query, timestamp FROM queries ORDER BY timestamp DESC")
            queries = cursor.fetchall()
            
            print(f"Recent queries ({len(queries)}):")
            for query in queries:
                query_time = format_timestamp(query['timestamp'])
                print(f"  [{query_time}] Query #{query['id']}: {query['query']}")
            print()
            
            # Allow filtering by query
            query_id = input("Enter query ID to filter posts (or press Enter for all posts): ").strip()
            if query_id and query_id.isdigit():
                query_filter = f" WHERE query = (SELECT query FROM queries WHERE id = {query_id})"
                if validation_filter:
                    query_filter += validation_filter
            else:
                if validation_filter:
                    query_filter = f" WHERE 1=1{validation_filter}"
                else:
                    query_filter = ""
        else:
            if validation_filter:
                query_filter = f" WHERE 1=1{validation_filter}"
            else:
                query_filter = ""
        
        # Query to get posts
        query = f"SELECT * FROM selected_posts{query_filter} ORDER BY selected_at DESC"
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        posts = cursor.fetchall()
        
        # Display posts
        for i, post in enumerate(posts, 1):
            post_dict = {key: post[key] for key in post.keys()}
            
            # Format the timestamps if they exist
            if 'selected_at' in post_dict:
                post_dict['selected_at'] = format_timestamp(post_dict['selected_at'])
            if 'scraped_at' in post_dict:
                post_dict['scraped_at'] = format_timestamp(post_dict['scraped_at'])
            
            print(f"Selected Post #{i} (ID: {post_dict.get('id', 'N/A')}):")
            print(f"  Original Post ID: {post_dict.get('original_post_id', 'N/A')}")
            print(f"  Username: {post_dict.get('username', 'N/A')}")
            print(f"  URL: {post_dict.get('post_url', 'N/A')}")
            print(f"  Posted at: {post_dict.get('post_time', 'N/A')}")
            print(f"  Scraped at: {post_dict.get('scraped_at', 'N/A')}")
            print(f"  Selected at: {post_dict.get('selected_at', 'N/A')}")
            
            # Display query if available
            if post_dict.get('query'):
                print(f"  Query: {post_dict.get('query')}")
            
            # Display matching keyword count and relevance score if available
            if post_dict.get('matching_keyword_count') is not None:
                print(f"  Matching Keywords: {post_dict.get('matching_keyword_count')}")
            if post_dict.get('relevance_score') is not None:
                print(f"  Relevance Score: {post_dict.get('relevance_score', 0):.2f}")
            
            # Display LLM validation if available
            if post_dict.get('llm_clone_validated'):
                validation = post_dict.get('llm_clone_validated')
                print(f"  LLM Validation: {validation.upper()}")
            else:
                print(f"  LLM Validation: Not validated yet")
            
            # Display keywords if available
            if post_dict.get('keywords'):
                keywords = parse_keywords(post_dict.get('keywords'))
                if keywords:
                    print(f"  Keywords: {', '.join(keywords)}")
            
            # Display metrics
            print("  Metrics:")
            print(f"    Views: {post_dict.get('views', 'N/A')}")
            print(f"    Comments: {post_dict.get('comments', 'N/A')}")
            print(f"    Retweets: {post_dict.get('retweets', 'N/A')}")
            print(f"    Likes: {post_dict.get('likes', 'N/A')}")
            
            # Display user ranking if available
            if post_dict.get('user_ranking'):
                print(f"    User Ranking: {post_dict.get('user_ranking', 'N/A')}")
            
            # Display image URL if available
            if post_dict.get('image_url'):
                print(f"  Image URL: {post_dict.get('image_url')}")
            
            # Display post text
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
    import argparse
    
    parser = argparse.ArgumentParser(description="View selected posts from the database.")
    parser.add_argument("--db", default="posts_selected.db", help="Database file path")
    parser.add_argument("--limit", type=int, help="Limit the number of posts to display")
    parser.add_argument("--queries", action="store_true", help="Show queries and allow filtering by query")
    parser.add_argument("--validated", choices=["all", "like", "pass", "none"], default="all", 
                        help="Filter by validation status (all, like, pass, or none for unvalidated)")
    
    args = parser.parse_args()
    
    # Add validation filter if specified
    validation_filter = ""
    if args.validated == "like":
        validation_filter = " AND llm_clone_validated = 'like'"
    elif args.validated == "pass":
        validation_filter = " AND llm_clone_validated = 'pass'"
    elif args.validated == "none":
        validation_filter = " AND (llm_clone_validated IS NULL OR llm_clone_validated = '')"
    
    view_selected_posts(args.db, args.limit, args.queries, validation_filter)
