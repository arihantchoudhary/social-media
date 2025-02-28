import asyncio
import sqlite3
import time
import schedule
import json
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent, Controller

load_dotenv()

# -------------------------
# Define Output Data Models
# -------------------------

class Post(BaseModel):
    post_text: str
    summary: str
    keywords: List[str]
    post_url: str

class Posts(BaseModel):
    posts: List[Post]

# Create a controller that uses our Posts model for output validation.
controller = Controller(output_model=Posts)

# --------------------------------------
# Prompt User for Sensitive Credentials
# --------------------------------------

username = input("Enter your x.com username: ")
password = input("Enter your x.com password: ")

# The sensitive_data dict maps placeholder keys to real values.
sensitive_data = {"x_name": username, "x_password": password}

# ----------------------------------------------
# Define the Task Instruction for the Agent
# ----------------------------------------------

task_str = (
    "Using the provided sensitive credentials (x_name and x_password), go to x.com and log in. "
    "After logging in, navigate to the user’s feed and retrieve the top 5 recommended posts. "
    "For each post, extract the full post text and its URL. Then, for each post, call an LLM "
    "to generate a concise summary and extract the top three keywords. "
    "Return the result as JSON following this schema: { 'posts': [ { 'post_text': string, "
    "'summary': string, 'keywords': [string, string, string], 'post_url': string } ] }."
)

# -----------------------
# Initialize the LLM Model
# -----------------------

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# ---------------------------------------------------------
# Asynchronous Function to Run the Agent & Store the Data
# ---------------------------------------------------------

async def main_job():
    # Create an agent with the task, LLM, sensitive data, and our output controller.
    agent = Agent(task=task_str, llm=llm, sensitive_data=sensitive_data, controller=controller)
    history = await agent.run()
    result = history.final_result()
    
    if result:
        try:
            # Validate and parse the output using our Posts model.
            parsed: Posts = Posts.model_validate_json(result)
        except Exception as e:
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error parsing agent output: {e}")
            return
        
        # Connect to (or create) a SQLite database and create the posts table if needed.
        conn = sqlite3.connect("x_com_posts.db")
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS posts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        post_text TEXT,
                        summary TEXT,
                        keywords TEXT,
                        post_url TEXT,
                        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        # Insert each post into the table.
        for post in parsed.posts:
            c.execute("INSERT INTO posts (post_text, summary, keywords, post_url) VALUES (?, ?, ?, ?)",
                      (post.post_text, post.summary, ", ".join(post.keywords), post.post_url))
        conn.commit()
        conn.close()
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Stored {len(parsed.posts)} posts successfully.")
    else:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: No result from agent.")

# ----------------------
# Synchronous Job Wrapper
# ----------------------

def job():
    asyncio.run(main_job())

# ----------------------
# Main: Run Now and Schedule Hourly
# ----------------------

if __name__ == "__main__":
    # Run the job immediately on startup.
    job()
    # Schedule the job to run at the top of every hour.
    schedule.every().hour.do(job)
    print("Scheduler started. The job will run every hour.")
    
    while True:
        schedule.run_pending()
        time.sleep(60)
