import sqlite3
import json
import os
from datetime import datetime

def clean_keyword(keyword):
    """Clean a keyword by removing JSON formatting and code block markers."""
    # Remove JSON formatting
    keyword = keyword.replace('```json\n', '').replace('\n```', '')
    keyword = keyword.replace('```', '')
    return keyword.strip()

def export_keywords(db_file='x_com_posts.db', output_file='keywords.txt'):
    """Export all unique keywords from the database to a text file."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all unique keywords
        all_keywords = set()
        
        # Check if keywords table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='keywords';")
        if not cursor.fetchone():
            print("No 'keywords' table found in the database.")
            
            # Try to extract keywords from posts table instead
            print("Attempting to extract keywords from posts table...")
            cursor.execute("PRAGMA table_info(posts)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if "keywords" not in columns:
                print("No 'keywords' column found in posts table.")
                return
            
            # Extract unique keywords from posts table
            cursor.execute("SELECT keywords FROM posts WHERE keywords IS NOT NULL AND keywords != ''")
            
            for row in cursor.fetchall():
                try:
                    keywords = json.loads(row['keywords'])
                    if isinstance(keywords, list):
                        for keyword in keywords:
                            all_keywords.add(clean_keyword(keyword))
                except (json.JSONDecodeError, TypeError):
                    continue
        else:
            # Extract keywords from keywords table
            cursor.execute("SELECT keyword FROM keywords")
            for row in cursor.fetchall():
                all_keywords.add(clean_keyword(row['keyword']))
        
        # Sort keywords alphabetically
        sorted_keywords = sorted(all_keywords)
        
        # Write keywords to file
        with open(output_file, 'w', encoding='utf-8') as f:
            for keyword in sorted_keywords:
                f.write(f"{keyword}\n")
        
        print(f"Successfully exported {len(sorted_keywords)} unique keywords to {output_file}")
        
        # Also create a JSON file with more information
        json_output_file = os.path.splitext(output_file)[0] + '.json'
        
        # Get keywords with frequency if available
        if cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='keywords';").fetchone():
            cursor.execute("SELECT keyword, frequency, first_seen_at FROM keywords ORDER BY frequency DESC")
            
            # Use a dictionary to merge duplicate keywords
            keyword_dict = {}
            
            for row in cursor.fetchall():
                clean_kw = clean_keyword(row['keyword'])
                
                if clean_kw in keyword_dict:
                    # Update existing entry
                    keyword_dict[clean_kw]['frequency'] += row['frequency']
                    # Keep the earliest first_seen_at
                    if row['first_seen_at'] < keyword_dict[clean_kw]['first_seen_at']:
                        keyword_dict[clean_kw]['first_seen_at'] = row['first_seen_at']
                else:
                    # Create new entry
                    keyword_dict[clean_kw] = {
                        'keyword': clean_kw,
                        'frequency': row['frequency'],
                        'first_seen_at': row['first_seen_at']
                    }
            
            # Convert dictionary to list and sort by frequency
            keywords_with_info = sorted(
                keyword_dict.values(), 
                key=lambda x: x['frequency'], 
                reverse=True
            )
        
            with open(json_output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'exported_at': datetime.now().isoformat(),
                    'total_keywords': len(keywords_with_info),
                    'keywords': keywords_with_info
                }, f, indent=2)
            
            print(f"Also exported detailed keyword information to {json_output_file}")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Export keywords from the database to a file.")
    parser.add_argument("--db", default="x_com_posts.db", help="Database file path")
    parser.add_argument("--output", default="keywords.txt", help="Output file path")
    
    args = parser.parse_args()
    
    export_keywords(args.db, args.output)
