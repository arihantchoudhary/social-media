import asyncio
import json
import sqlite3
import time
import schedule
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent, Controller, Browser, BrowserConfig, ActionResult

load_dotenv()

# --------------------------------------------------
# Helper: Get the current page from the Browser instance
# --------------------------------------------------
async def get_current_page(browser: Browser):
    """
    Returns a Playwright Page object from the Browser.
    If there is an existing context with at least one page, returns that page.
    Otherwise, creates a new context and page.
    """
    pbrowser = await browser.get_playwright_browser()
    contexts = pbrowser.contexts  # List of existing BrowserContext objects.
    if contexts:
        context = contexts[0]
        if context.pages:
            return context.pages[0]
        else:
            return await context.new_page()
    else:
        context = await pbrowser.new_context()
        return await context.new_page()

# --------------------------------------------------
# Define Custom Actions via Controller
# --------------------------------------------------
controller = Controller()

@controller.action('Open website')
async def open_website(url: str, browser: Browser):
    page = await get_current_page(browser)
    await page.goto(url)
    return ActionResult(extracted_content='Website opened')

@controller.action('Login')
async def login_x_com(x_name: str, x_password: str, browser: Browser):
    page = await get_current_page(browser)
    # Adjust selectors according to x.com's actual login form.
    await page.fill("input[name='username']", x_name)
    await page.fill("input[name='password']", x_password)
    await page.click("button[type='submit']")
    # Wait for an element that signals a successful login (e.g. an article in the feed)
    await page.wait_for_selector("article", timeout=10000)
    return ActionResult(extracted_content='Logged in')

@controller.action('Scrape feed')
async def scrape_feed(browser: Browser):
    page = await get_current_page(browser)
    await page.wait_for_selector("article", timeout=10000)
    tweet_elements = await page.query_selector_all("article")
    posts = []
    for elem in tweet_elements[:5]:
        text = await elem.inner_text()
        anchor = await elem.query_selector("a")
        link = await anchor.get_attribute("href") if anchor else ""
        posts.append({"post_text": text, "post_url": link})
    return ActionResult(extracted_content=json.dumps({"posts": posts}))

# --------------------------------------------------
# Define Expected Output Schema Using Pydantic
# --------------------------------------------------
class Post(BaseModel):
    post_text: str
    summary: str
    keywords: List[str]
    post_url: str

class Posts(BaseModel):
    posts: List[Post]

# --------------------------------------------------
# Sensitive Data and LLM Setup
# --------------------------------------------------
# Prompt user for credentials (only used if login is needed)
user_name = input("Enter your x.com username: ")
user_password = input("Enter your x.com password: ")
sensitive_data = {"x_name": user_name, "x_password": user_password}

# Initialize LLM (using ChatOpenAI with model "gpt-4o")
llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# --------------------------------------------------
# Define Task Strings for Each Agent
# --------------------------------------------------
login_task = (
    "Using the provided sensitive credentials (x_name and x_password), "
    "open https://x.com and log in using the 'Open website' and 'Login' custom actions. "
    "Do nothing else."
)

scrape_task = (
    "Scrape the user’s feed to extract the top 5 recommended posts. For each post, extract the full post text and its URL. "
    "Then, for each post, use an LLM to generate a concise summary and extract the top 3 keywords. "
    "Return the result as JSON following this schema: { 'posts': [ { 'post_text': string, 'summary': string, "
    "'keywords': [string, string, string], 'post_url': string } ] }."
)

# --------------------------------------------------
# Create Browser Instance Connecting to Your Chrome on Windows
# --------------------------------------------------
browser = Browser(
    config=BrowserConfig(
        chrome_instance_path='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    )
)

# --------------------------------------------------
# Helper: Check If Logged In
# --------------------------------------------------
async def is_logged_in(browser: Browser) -> bool:
    try:
        page = await get_current_page(browser)
        # Check briefly for an element (e.g., <article>) that indicates login.
        await page.wait_for_selector("article", timeout=5000)
        return True
    except Exception:
        return False

# --------------------------------------------------
# Define Login and Scraping Agents
# --------------------------------------------------
async def login_agent():
    agent = Agent(
        task=login_task,
        llm=llm,
        sensitive_data=sensitive_data,
        controller=controller,
        browser=browser
    )
    history = await agent.run()
    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Login agent result: {history.final_result()}")

async def scrape_agent():
    agent = Agent(
        task=scrape_task,
        llm=llm,
        controller=controller,
        browser=browser,
    )
    history = await agent.run()
    result = history.final_result()
    if result:
        try:
            parsed = Posts.model_validate_json(result)
        except Exception as e:
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error parsing result: {e}")
            return
        # Store the parsed posts into a SQLite database.
        conn = sqlite3.connect("x_com_posts.db")
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS posts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        post_text TEXT,
                        summary TEXT,
                        keywords TEXT,
                        post_url TEXT,
                        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        for post in parsed.posts:
            c.execute("INSERT INTO posts (post_text, summary, keywords, post_url) VALUES (?, ?, ?, ?)",
                      (post.post_text, post.summary, ", ".join(post.keywords), post.post_url))
        conn.commit()
        conn.close()
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Stored {len(parsed.posts)} posts successfully.")
    else:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: No result from scraping agent.")

# --------------------------------------------------
# Combined Main Job: Check Login, Then Scrape
# --------------------------------------------------
async def main_job():
    # Navigate to the site first.
    page = await get_current_page(browser)
    await page.goto("https://x.com")
    if not await is_logged_in(browser):
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Not logged in. Running login agent...")
        await login_agent()
    else:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Already logged in. Skipping login agent.")
    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Running scraping agent...")
    await scrape_agent()

def job():
    asyncio.run(main_job())

# --------------------------------------------------
# Scheduler: Run Job Every Hour
# --------------------------------------------------
if __name__ == "__main__":
    # Run the job immediately on startup.
    job()
    schedule.every().hour.do(job)
    print("Scheduler started. Job will run every hour. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(60)
