import sqlite3
import json
import os
import requests
import sys
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

def get_absolute_path(file_path):
    """Get absolute path for a file, checking multiple locations."""
    if os.path.exists(file_path):
        return file_path
        
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Try to find the file in the script directory
    absolute_path = os.path.join(script_dir, file_path)
    if os.path.exists(absolute_path):
        return absolute_path
        
    # Try one level up from the script directory
    parent_dir = os.path.dirname(script_dir)
    absolute_path = os.path.join(parent_dir, file_path)
    if os.path.exists(absolute_path):
        return absolute_path
        
    # Return the original path if not found
    return file_path

def get_selected_posts(query, db_file='posts_selected.db'):
    """Get posts from the selected posts database for a specific query."""
    try:
        # Get absolute path for database
        db_path = get_absolute_path(db_file)
        print(f"Using database: {db_path}")
        
        # Connect to the database
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get posts for the specific query
        cursor.execute(
            "SELECT * FROM selected_posts WHERE query = ? ORDER BY relevance_score DESC",
            (query,)
        )
        posts = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        if not posts:
            print(f"No posts found for query: {query}")
        else:
            print(f"Found {len(posts)} posts for query: {query}")
            
        return posts
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def format_posts_for_llm(posts):
    """Format posts for the LLM to analyze."""
    formatted = []
    
    for i, post in enumerate(posts, 1):
        entry = f"Post #{i}:\n"
        
        # Add post details
        if post.get('username'):
            entry += f"Author: {post.get('username')}\n"
        
        if post.get('post_text'):
            entry += f"Content: {post.get('post_text')}\n"
        
        if post.get('keywords'):
            try:
                keywords = json.loads(post.get('keywords'))
                if keywords:
                    entry += f"Keywords: {', '.join(keywords)}\n"
            except (json.JSONDecodeError, TypeError):
                pass
        
        formatted.append(entry)
    
    return "\n".join(formatted)

def analyze_sentiment(posts, query):
    """
    Analyze the sentiment and provide a summary of the posts.
    
    Args:
        posts: List of posts to analyze
        query: The search query that found these posts
        
    Returns:
        A dictionary with summary and sentiment analysis
    """
    if not posts:
        return {
            "summary": "No posts found for this query.",
            "sentiment": "neutral",
            "sentiment_score": 50
        }
    
    # Format posts for the LLM
    formatted_posts = format_posts_for_llm(posts)
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": """You are a sentiment analysis assistant. Your task is to analyze a set of social media posts 
                on a specific topic and provide:
                
                1. A very concise summary (2-3 sentences) of what people are saying about the topic
                2. The overall sentiment (positive, negative, or mixed)
                3. A sentiment score from 0-100 (0 being extremely negative, 50 being neutral, 100 being extremely positive)
                
                Format your response as a JSON object with the following structure:
                {
                    "summary": "Your concise summary here",
                    "sentiment": "positive/negative/mixed/neutral",
                    "sentiment_score": number from 0-100,
                    "key_points": ["point 1", "point 2", "point 3"]
                }
                
                Return ONLY the JSON object, with no additional text or explanation.
                """
            },
            {
                "role": "user",
                "content": f"""Analyze the sentiment and provide a summary of these posts related to the search query: "{query}"

{formatted_posts}

Remember to return only a JSON object with summary, sentiment, sentiment_score, and key_points.
"""
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
            analysis = json.loads(content)
            return analysis
        except json.JSONDecodeError:
            # If it's not valid JSON, try to extract the JSON part
            import re
            json_match = re.search(r'({.*})', content, re.DOTALL)
            if json_match:
                try:
                    analysis = json.loads(json_match.group(1))
                    return analysis
                except json.JSONDecodeError:
                    pass
            
            # If all else fails, return a basic structure with the content
            return {
                "summary": "Error parsing LLM response as JSON.",
                "sentiment": "neutral",
                "sentiment_score": 50,
                "key_points": [content[:200] + "..."]
            }
            
    except Exception as e:
        print(f"Error calling OpenRouter API: {e}")
        return {
            "summary": f"Error analyzing sentiment: {str(e)}",
            "sentiment": "neutral",
            "sentiment_score": 50,
            "key_points": ["Error occurred during analysis"]
        }

def main():
    """Main function to analyze sentiment of selected posts."""
    # Check if query is provided as command line argument
    if len(sys.argv) < 2:
        print("Usage: python sentiment_analysis.py <query>")
        return
    
    query = sys.argv[1]
    print(f"Analyzing sentiment for query: {query}")
    
    # Get selected posts for the query
    posts = get_selected_posts(query)
    
    if not posts:
        print("No posts found for analysis.")
        result = {
            "summary": "No posts found for this query.",
            "sentiment": "neutral",
            "sentiment_score": 50,
            "key_points": []
        }
    else:
        # Analyze sentiment
        print(f"Analyzing sentiment of {len(posts)} posts...")
        result = analyze_sentiment(posts, query)
    
    # Print the result
    print("\nSentiment Analysis Result:")
    print(f"Summary: {result.get('summary')}")
    print(f"Sentiment: {result.get('sentiment')}")
    print(f"Sentiment Score: {result.get('sentiment_score')}")
    print("Key Points:")
    for point in result.get('key_points', []):
        print(f"- {point}")
    
    # Return the result as JSON
    print("\nJSON Result:")
    print(json.dumps(result, indent=2))
    
    return result

if __name__ == "__main__":
    main()
