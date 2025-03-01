import re
import json
import sqlite3
from typing import Dict, List, Any, Optional, Union

def clean_agent_response(response: str) -> str:
    """
    Clean up the agent's response to extract just the JSON part.
    
    Args:
        response (str): The raw response from the agent
        
    Returns:
        str: The cleaned JSON string
    """
    # Check if the response contains a markdown code block
    code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
    match = re.search(code_block_pattern, response)
    
    if match:
        # Extract the content inside the code block
        return match.group(1).strip()
    
    # If no code block is found, try to find JSON-like content
    # Look for content between curly braces
    json_pattern = r'(\{\s*"posts"\s*:\s*\[[\s\S]*\]\s*\})'
    match = re.search(json_pattern, response)
    
    if match:
        return match.group(1).strip()
    
    # If all else fails, return the original response
    return response

def parse_agent_response(response: str) -> Optional[Dict[str, List[Dict[str, Any]]]]:
    """
    Parse the agent's response into a Python dictionary.
    
    Args:
        response (str): The raw response from the agent
        
    Returns:
        Optional[Dict]: The parsed JSON as a Python dictionary, or None if parsing fails
    """
    # Clean the response
    cleaned_response = clean_agent_response(response)
    
    try:
        # Parse the cleaned response
        parsed = json.loads(cleaned_response)
        return parsed
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Cleaned response: {cleaned_response[:200]}...")
        return None

def convert_metrics(value: Union[str, int, None]) -> Optional[int]:
    """
    Convert metrics like '1.2K' to integers.
    
    Args:
        value: The metric value as a string, int, or None
        
    Returns:
        Optional[int]: The converted integer value, or None if conversion fails
    """
    if value is None:
        return None
    
    if isinstance(value, int):
        return value
    
    if not isinstance(value, str):
        return None
    
    value = value.strip().upper()
    
    # Handle empty or invalid strings
    if not value or value.lower() == 'n/a':
        return None
    
    try:
        if 'K' in value:
            return int(float(value.replace('K', '')) * 1000)
        elif 'M' in value:
            return int(float(value.replace('M', '')) * 1000000)
        elif 'B' in value:
            return int(float(value.replace('B', '')) * 1000000000)
        else:
            return int(float(value))
    except (ValueError, TypeError):
        return None

def save_posts_to_db(posts: List[Dict[str, Any]], db_file: str = "x_com_posts.db") -> int:
    """
    Save posts to the SQLite database.
    
    Args:
        posts (List[Dict]): List of post dictionaries
        db_file (str): Path to the SQLite database file
        
    Returns:
        int: Number of posts saved
    """
    # Connect to the database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Create the posts table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_text TEXT,
        post_url TEXT,
        username TEXT,
        image_url TEXT,
        views INTEGER,
        comments INTEGER,
        retweets INTEGER,
        likes INTEGER,
        saves INTEGER,
        post_time TEXT,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Insert each post
    count = 0
    for post in posts:
        # Convert metrics to integers
        views = convert_metrics(post.get('views'))
        comments = convert_metrics(post.get('comments'))
        retweets = convert_metrics(post.get('retweets'))
        likes = convert_metrics(post.get('likes'))
        saves = convert_metrics(post.get('saves'))
        
        # Get the post URL (handle different field names)
        post_url = post.get('post_url') or post.get('url')
        
        cursor.execute('''
        INSERT INTO posts (
            post_text, post_url, username, image_url, 
            views, comments, retweets, likes, saves, post_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            post.get('post_text'),
            post_url,
            post.get('username'),
            post.get('image_url'),
            views,
            comments,
            retweets,
            likes,
            saves,
            post.get('post_time')
        ))
        count += 1
    
    # Commit the changes
    conn.commit()
    
    # Close the connection
    conn.close()
    
    return count

def process_agent_response(response: str, db_file: str = "x_com_posts.db") -> int:
    """
    Process the agent's response and save the posts to the database.
    
    Args:
        response (str): The raw response from the agent
        db_file (str): Path to the SQLite database file
        
    Returns:
        int: Number of posts saved
    """
    # Parse the response
    parsed = parse_agent_response(response)
    
    if parsed is None:
        print("Failed to parse the agent's response")
        return 0
    
    # Get the posts
    posts = parsed.get('posts', [])
    
    if not posts:
        print("No posts found in the agent's response")
        return 0
    
    # Save the posts to the database
    count = save_posts_to_db(posts, db_file)
    
    return count

if __name__ == "__main__":
    # Example usage
    sample_response = '''
    📄  Extracted from page
: ```json
{
  "posts": [
    {
      "username": "Elon Musk",
      "post_text": "President @realDonaldTrump is the Commander-in-Chief",
      "url": "https://x.com/elonmusk/status/1895536186942505188",
      "image_url": null,
      "views": "46M",
      "comments": "40K",
      "retweets": "65K",
      "likes": "436K",
      "saves": null,
      "post_time": "14h"
    }
  ]
}
```
    '''
    
    # Process the sample response
    count = process_agent_response(sample_response)
    print(f"Saved {count} posts to the database")
    
    # You can also provide a file with the agent's response
    import sys
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        with open(file_path, 'r') as file:
            response = file.read()
        count = process_agent_response(response)
        print(f"Saved {count} posts from file to the database")
