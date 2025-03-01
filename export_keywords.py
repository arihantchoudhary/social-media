
import sqlite3
import os
import json
from datetime import datetime

def export_keywords(db_file='x_com_posts.db', output_file='keywords.txt'):
    """Export keywords from the database to a text file."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if keywords table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='keywords';")
        if not cursor.fetchone():
            print("No 'keywords' table found in the database.")
            
            # Try to extract keywords from posts table instead
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='posts';")
            if not cursor.fetchone():
                print("No 'posts' table found in the database.")
                return
            
            print("Extracting keywords from posts table...")
            
            # Get all posts with keywords
            cursor.execute("SELECT keywords FROM posts WHERE keywords IS NOT NULL AND keywords != ''")
            posts = cursor.fetchall()
            
            # Extract unique keywords
            all_keywords = set()
            for post in posts:
                try:
                    keywords_json = post['keywords']
                    if keywords_json:
                        keywords = json.loads(keywords_json)
                        if isinstance(keywords, list):
                            all_keywords.update(keywords)
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing keywords: {e}")
            
            # Write keywords to file
            with open(output_file, 'w', encoding='utf-8') as f:
                for keyword in sorted(all_keywords):
                    f.write(f"{keyword}\n")
            
            print(f"Exported {len(all_keywords)} unique keywords to {output_file}")
            return
        
        # Get all keywords ordered by frequency
        cursor.execute("SELECT keyword FROM keywords ORDER BY frequency DESC")
        keywords = cursor.fetchall()
        
        # Write keywords to file
        with open(output_file, 'w', encoding='utf-8') as f:
            for keyword in keywords:
                f.write(f"{keyword['keyword']}\n")
        
        print(f"Exported {len(keywords)} keywords to {output_file}")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Export keywords from the database to a text file.")
    parser.add_argument("--db", default="x_com_posts.db", help="Database file path")
    parser.add_argument("--output", default="keywords.txt", help="Output file path")
    
    args = parser.parse_args()
    
    export_keywords(args.db, args.output)
