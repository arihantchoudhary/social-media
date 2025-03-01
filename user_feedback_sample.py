import sqlite3
import json
import random
import datetime
from typing import List, Dict, Any, Optional

# Sample feedback options
FEEDBACK_TYPES = ["like", "dislike", "text"]
TEXT_FEEDBACK_OPTIONS = [
    "That was funny, I like it!",
    "This is exactly what I was looking for.",
    "Great information, very helpful.",
    "Not really what I'm interested in.",
    "Too political for my taste.",
    "Love the design inspiration in this!",
    "This aligns with my environmental interests.",
    "Good photography but the content is meh.",
    "Interesting perspective on technology.",
    "Too promotional, feels like an ad.",
    "Perfect for my next hiking trip!",
    "The data visualization is excellent.",
    "Not enough depth on the topic.",
    "This would be useful for my design project.",
    "Too much celebrity gossip."
]

def create_user_feedback_db(db_file='user_feedback.db'):
    """Create a sample database of user feedback on posts."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create the user_feedback table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            feedback_type TEXT,
            text_feedback TEXT,
            feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()
        print(f"Created user feedback database: {db_file}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def get_selected_posts(db_file='posts_selected.db'):
    """Get posts from the selected posts database."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all posts
        cursor.execute("SELECT * FROM selected_posts")
        posts = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return posts
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def generate_random_feedback(post):
    """Generate random feedback for a post based on its content and the user profile."""
    # Determine feedback type with weighted probabilities
    # 60% like, 30% dislike, 10% text feedback
    feedback_type = random.choices(
        FEEDBACK_TYPES, 
        weights=[0.6, 0.3, 0.1], 
        k=1
    )[0]
    
    # For text feedback, select a random option
    text_feedback = None
    if feedback_type == "text":
        text_feedback = random.choice(TEXT_FEEDBACK_OPTIONS)
    
    return {
        "post_id": post["id"],
        "feedback_type": feedback_type,
        "text_feedback": text_feedback
    }

def add_feedback_to_db(feedback, db_file='user_feedback.db'):
    """Add feedback to the database."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Insert the feedback
        cursor.execute(
            """
            INSERT INTO user_feedback (
                post_id, feedback_type, text_feedback
            ) VALUES (?, ?, ?)
            """,
            (
                feedback["post_id"],
                feedback["feedback_type"],
                feedback["text_feedback"]
            )
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

def generate_sample_feedback(num_feedback=20):
    """Generate sample feedback for posts."""
    # Create the user feedback database
    if not create_user_feedback_db():
        print("Failed to create user feedback database.")
        return
    
    # Get selected posts
    posts = get_selected_posts()
    if not posts:
        print("No selected posts found.")
        return
    
    print(f"Found {len(posts)} selected posts.")
    
    # Generate random feedback
    feedback_count = min(num_feedback, len(posts))
    
    # If we have fewer posts than requested feedback, we'll generate multiple feedback for some posts
    selected_posts = random.choices(posts, k=feedback_count)
    
    print(f"Generating {feedback_count} feedback entries...")
    
    for i, post in enumerate(selected_posts, 1):
        # Generate random feedback
        feedback = generate_random_feedback(post)
        
        # Add feedback to database
        if add_feedback_to_db(feedback):
            feedback_text = feedback["text_feedback"] if feedback["text_feedback"] else ""
            print(f"{i}. Added {feedback['feedback_type']} feedback for post {feedback['post_id']}: {feedback_text}")
        else:
            print(f"Failed to add feedback for post {post['id']}")
    
    print("Finished generating sample feedback.")

def view_user_feedback(db_file='user_feedback.db'):
    """View user feedback from the database."""
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all feedback
        cursor.execute("""
            SELECT * FROM user_feedback 
            ORDER BY feedback_timestamp DESC
        """)
        feedback = cursor.fetchall()
        
        if not feedback:
            print("No user feedback found.")
            return
        
        print(f"Found {len(feedback)} feedback entries:\n")
        
        for i, fb in enumerate(feedback, 1):
            print(f"Feedback #{i} (ID: {fb['id']}):")
            print(f"  Post ID: {fb['post_id']}")
            print(f"  Type: {fb['feedback_type'].upper()}")
            if fb['text_feedback']:
                print(f"  Text: {fb['text_feedback']}")
            print(f"  Timestamp: {fb['feedback_timestamp']}")
            print()
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate and view sample user feedback.")
    parser.add_argument("--generate", type=int, default=0, help="Generate sample feedback (specify count)")
    parser.add_argument("--view", action="store_true", help="View user feedback")
    
    args = parser.parse_args()
    
    if args.generate > 0:
        generate_sample_feedback(args.generate)
    
    if args.view:
        view_user_feedback()
    
    if not args.generate and not args.view:
        print("Please specify an action: --generate COUNT or --view")
