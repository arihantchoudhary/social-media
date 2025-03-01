import asyncio
import sqlite3
import time
import schedule
import json
import argparse
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent, Controller, Browser, ActionResult

load_dotenv()

# -------------------------
# Define Output Data Models and Helper Functions
# -------------------------

def convert_abbreviated_number(abbr_num):
    """
    Convert abbreviated numbers like '1.2K' or '2.5M' to integers.
    Returns None if the input is not a valid abbreviated number.
    """
    if abbr_num is None:
        return None
    
    try:
        # If it's already a number, return it
        return int(float(abbr_num))
    except (ValueError, TypeError):
        # If it's not a number, try to parse it as an abbreviated number
        if not isinstance(abbr_num, str):
            return None
        
        abbr_num = abbr_num.strip().upper()
        
        # Handle empty or invalid strings
        if not abbr_num or abbr_num.lower() == 'n/a':
            return None
        
        try:
            if 'K' in abbr_num:
                return int(float(abbr_num.replace('K', '')) * 1000)
            elif 'M' in abbr_num:
                return int(float(abbr_num.replace('M', '')) * 1000000)
            elif 'B' in abbr_num:
                return int(float(abbr_num.replace('B', '')) * 1000000000)
            else:
                return int(float(abbr_num))
        except (ValueError, TypeError):
            return None

class Post(BaseModel):
    post_text: str
    post_url: str
    username: str
    image_url: str = None  # Optional field for post image URL
    views: int = None  # Optional field for view count
    comments: int = None  # Optional field for comment count
    retweets: int = None  # Optional field for retweet count
    likes: int = None  # Optional field for like count
    saves: int = None  # Optional field for save count
    post_time: str = None  # Optional field for post timestamp

class Posts(BaseModel):
    posts: List[Post]

# Create a controller and register custom actions
controller = Controller(output_model=Posts)

# Define a custom action to open Twitter
@controller.action('Open Twitter')
async def open_twitter(browser: Browser):
    page = browser.get_current_page()
    # Set a longer timeout (60 seconds) and wait until the network is idle
    await page.goto("https://x.com/", wait_until="networkidle", timeout=60000)
    # Wait an additional 5 seconds to ensure JavaScript loads
    await page.wait_for_timeout(5000)
    # Check if JavaScript is enabled
    js_enabled = await page.evaluate("() => { return typeof window !== 'undefined' && typeof document !== 'undefined'; }")
    if not js_enabled:
        return ActionResult(extracted_content='Error: JavaScript is not available on the page')
    return ActionResult(extracted_content='Twitter homepage opened successfully')

# Define a custom action to navigate to the home feed
@controller.action('Navigate to Home Feed')
async def navigate_to_home_feed(browser: Browser):
    page = browser.get_current_page()
    try:
        # Wait for the page to load and stabilize
        await page.wait_for_timeout(3000)
        
        # Try to find and click the "Home" link/button
        # Twitter/X.com might have different selectors, so we'll try a few common ones
        home_selectors = [
            'a[aria-label="Home"]', 
            'a[data-testid="AppTabBar_Home_Link"]',
            'a[href="/home"]',
            'a[role="tab"][aria-selected="true"]',
            'nav a:first-child'
        ]
        
        for selector in home_selectors:
            try:
                if await page.query_selector(selector):
                    await page.click(selector)
                    await page.wait_for_timeout(3000)  # Wait for navigation
                    return ActionResult(extracted_content='Successfully navigated to home feed')
            except Exception:
                continue
        
        # If we couldn't find a home button, check if we're already on the home feed
        current_url = page.url
        if '/home' in current_url or current_url.endswith('x.com/'):
            return ActionResult(extracted_content='Already on the home feed')
        
        # If all else fails, try to navigate directly to the home URL
        await page.goto("https://x.com/home", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        return ActionResult(extracted_content='Navigated to home feed via direct URL')
    
    except Exception as e:
        return ActionResult(extracted_content=f'Error navigating to home feed: {str(e)}')

# Define a custom action to get post selectors
@controller.action('Get Post Selectors')
async def get_post_selectors(browser: Browser, count: int = 10):
    page = browser.get_current_page()
    try:
        # Wait for posts to load
        await page.wait_for_timeout(5000)
        
        # Try different selectors for posts
        post_selectors = [
            'article[data-testid="tweet"]',
            'div[data-testid="cellInnerDiv"]',
            'div[data-testid="tweetText"]',
            'div.tweet',
            'div.timeline-item'
        ]
        
        selectors = []
        
        # Find the first selector that works
        working_selector = None
        for selector in post_selectors:
            posts = await page.query_selector_all(selector)
            if posts and len(posts) > 0:
                working_selector = selector
                break
        
        if not working_selector:
            return ActionResult(extracted_content='Could not find any posts on the page')
        
        # Get the first 'count' posts
        posts = await page.query_selector_all(working_selector)
        posts = posts[:min(count, len(posts))]
        
        # Create a unique selector for each post
        for i, post in enumerate(posts):
            # Get a unique identifier for this post
            post_id = await page.evaluate('''(post) => {
                // Try to find a unique ID for this post
                const statusLink = post.querySelector('a[href*="/status/"]');
                if (statusLink) {
                    const match = statusLink.href.match(/status\\/([0-9]+)/);
                    if (match) return match[1];
                }
                
                // If no ID found, use the index as a fallback
                return null;
            }''', post)
            
            if post_id:
                # Create a selector that uniquely identifies this post
                unique_selector = f'{working_selector}:has(a[href*="/status/{post_id}"])'
            else:
                # Fallback to using nth-child if no unique ID
                unique_selector = f'{working_selector}:nth-of-type({i+1})'
            
            selectors.append(unique_selector)
        
        return ActionResult(extracted_content=json.dumps(selectors, indent=2))
    
    except Exception as e:
        return ActionResult(extracted_content=f'Error getting post selectors: {str(e)}')

# Define a custom action to extract post metrics
@controller.action('Extract Post Metrics')
async def extract_post_metrics(browser: Browser, post_selector: str):
    page = browser.get_current_page()
    try:
        # Wait for the post to be visible
        await page.wait_for_selector(post_selector, timeout=5000)
        
        # Extract metrics using JavaScript
        metrics = await page.evaluate(f'''() => {{
            const post = document.querySelector('{post_selector}');
            if (!post) return null;
            
            // Helper function to extract numbers from text and convert K/M/B
            const parseMetric = (text) => {{
                if (!text) return null;
                text = text.trim();
                if (text === '' || text.toLowerCase() === 'n/a') return null;
                
                // Convert abbreviations
                if (text.includes('K') || text.includes('k')) {{
                    return Math.round(parseFloat(text.replace(/[Kk]/g, '')) * 1000);
                }} else if (text.includes('M') || text.includes('m')) {{
                    return Math.round(parseFloat(text.replace(/[Mm]/g, '')) * 1000000);
                }} else if (text.includes('B') || text.includes('b')) {{
                    return Math.round(parseFloat(text.replace(/[Bb]/g, '')) * 1000000000);
                }} else {{
                    const num = parseFloat(text);
                    return isNaN(num) ? null : Math.round(num);
                }}
            }};
            
            // Try different selectors for metrics
            // These selectors might need to be updated as Twitter/X.com changes their UI
            const viewsSelectors = [
                '[data-testid="analyticsButton"] span', 
                '[aria-label*="view"] span',
                'div[role="group"] div:nth-child(1) span'
            ];
            
            const commentsSelectors = [
                '[data-testid="reply"] span', 
                '[aria-label*="repl"] span',
                'div[role="group"] div:nth-child(2) span'
            ];
            
            const retweetsSelectors = [
                '[data-testid="retweet"] span', 
                '[aria-label*="retweet"] span',
                'div[role="group"] div:nth-child(3) span'
            ];
            
            const likesSelectors = [
                '[data-testid="like"] span', 
                '[aria-label*="like"] span',
                'div[role="group"] div:nth-child(4) span'
            ];
            
            const savesSelectors = [
                '[data-testid="bookmark"] span', 
                '[aria-label*="bookmark"] span',
                'div[role="group"] div:nth-child(5) span'
            ];
            
            // Try to find metrics using different selectors
            const findMetric = (selectors) => {{
                for (const selector of selectors) {{
                    const el = post.querySelector(selector);
                    if (el && el.textContent) {{
                        return parseMetric(el.textContent);
                    }}
                }}
                return null;
            }};
            
            // Extract post URL
            let postUrl = '';
            const timeElement = post.querySelector('time');
            if (timeElement && timeElement.parentElement && timeElement.parentElement.tagName === 'A') {{
                postUrl = timeElement.parentElement.href;
            }} else {{
                const linkElements = post.querySelectorAll('a');
                for (const link of linkElements) {{
                    if (link.href && link.href.includes('/status/')) {{
                        postUrl = link.href;
                        break;
                    }}
                }}
            }}
            
            // Extract username
            let username = '';
            const usernameElement = post.querySelector('[data-testid="User-Name"] span');
            if (usernameElement) {{
                username = usernameElement.textContent;
            }}
            
            // Extract post text
            let postText = '';
            const textElement = post.querySelector('[data-testid="tweetText"]');
            if (textElement) {{
                postText = textElement.textContent;
            }}
            
            // Extract image URL
            let imageUrl = null;
            const imageElement = post.querySelector('img[src*="media"]');
            if (imageElement) {{
                imageUrl = imageElement.src;
            }}
            
            // Extract post time
            let postTime = null;
            if (timeElement) {{
                postTime = timeElement.getAttribute('datetime');
            }}
            
            return {{
                post_text: postText,
                post_url: postUrl,
                username: username,
                image_url: imageUrl,
                views: findMetric(viewsSelectors),
                comments: findMetric(commentsSelectors),
                retweets: findMetric(retweetsSelectors),
                likes: findMetric(likesSelectors),
                saves: findMetric(savesSelectors),
                post_time: postTime
            }};
        }}''')
        
        if not metrics:
            return ActionResult(extracted_content='Could not extract metrics from the post')
        
        return ActionResult(extracted_content=json.dumps(metrics, indent=2))
    
    except Exception as e:
        return ActionResult(extracted_content=f'Error extracting post metrics: {str(e)}')

# Define a custom action to close the browser
@controller.action('Close Browser')
async def close_browser(browser: Browser):
    try:
        await browser.close()
        return ActionResult(extracted_content='Browser closed successfully')
    except Exception as e:
        return ActionResult(extracted_content=f'Error closing browser: {str(e)}')

# --------------------------------------
# Prompt User for Sensitive Credentials
# --------------------------------------

username = input("Enter your x.com username: ")
password = input("Enter your x.com password: ")

# The sensitive_data dict maps placeholder keys to real values.
sensitive_data = {"x_username": username, "x_password": password}

# ----------------------------------------------
# Define the Task Instruction for the Agent
# ----------------------------------------------

def create_task_str(post_count: int):
    return (
        "First, use the 'Open Twitter' action to open the Twitter homepage. "
        "Then, if not already logged in, use the provided sensitive credentials (x_username and x_password) to log in to Twitter. "
        "After ensuring you're logged in, use the 'Navigate to Home Feed' action to go to the home feed. "
        f"Once on the home feed, use the 'Get Post Selectors' action to get selectors for the top {post_count} posts. "
    "Then, for each post selector returned, use the 'Extract Post Metrics' action with that selector to extract all the required information. "
    "For each post, extract the following information: "
    "1. The full post text content - Look for elements with data-testid='tweetText' "
    "2. The URL of the post - Look for links containing '/status/' in the href attribute "
    "3. The username of the account that made the post - Look for elements with data-testid='User-Name' "
    "4. The image URL if the post contains an image - Look for img tags with src containing 'media' "
    "5. Post metrics including: "
    "   a. View count - Look for the number next to the view/analytics icon (chart/graph icon). This is usually the first metric shown. "
    "   b. Comment count - Look for the number next to the comment/reply icon (speech bubble). This is usually the second metric shown. "
    "   c. Retweet count - Look for the number next to the retweet icon (two arrows forming a square). This is usually the third metric shown. "
    "   d. Like count - Look for the number next to the like/heart icon. This is usually the fourth metric shown. "
    "   e. Save/Bookmark count - Look for the number next to the bookmark icon. This is usually the fifth metric shown. "
    "6. The timestamp or time of the post - Look for the time element with a datetime attribute "
    "IMPORTANT: For each metric, make sure to extract the actual number. If a metric shows '1.2K', convert it to 1200. If a metric shows '2.5M', convert it to 2500000. "
    "If a metric is not visible or cannot be extracted, set it to null (not 'N/A' or 0). "
    "Return the result as JSON following this schema: { 'posts': [ { "
    "'post_text': string, "
    "'post_url': string, "
    "'username': string, "
    "'image_url': string or null, "
    "'views': number or null, "
    "'comments': number or null, "
    "'retweets': number or null, "
    "'likes': number or null, "
    "'saves': number or null, "
    "'post_time': string or null "
    "} ] }."
    "After completing the task and returning the JSON result, use the 'Close Browser' action to close the browser."
)

# -----------------------
# Initialize the LLM Model
# -----------------------

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# ---------------------------------------------------------
# Asynchronous Function to Run the Agent & Store the Data
# ---------------------------------------------------------

# Global variable to store the agent instance
agent_instance = None

async def main_job(post_count: int = 25):
    global agent_instance
    
    # Create an agent if it doesn't exist, or reuse the existing one
    if agent_instance is None:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Creating new agent instance...")
        task = create_task_str(post_count)
        agent_instance = Agent(task=task, llm=llm, sensitive_data=sensitive_data, controller=controller)
    else:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Reusing existing agent instance...")
    
    try:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Running agent...")
        history = await agent_instance.run()
        result = history.final_result()
        
        if result:
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Agent returned result. Parsing...")
            try:
                # Log the raw result for debugging
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Raw result: {result[:200]}...")
                
                # Try to use the fix_json_parser module if available
                try:
                    from fix_json_parser import parse_agent_response
                    
                    # Parse the agent's response
                    parsed_dict = parse_agent_response(result)
                    
                    if parsed_dict:
                        # Convert the dictionary to a Posts object
                        parsed = Posts.model_validate(parsed_dict)
                        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Successfully parsed {len(parsed.posts)} posts using fix_json_parser.")
                    else:
                        # Fall back to the original method
                        parsed: Posts = Posts.model_validate_json(result)
                        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Successfully parsed {len(parsed.posts)} posts using standard parser.")
                except ImportError:
                    # If the fix_json_parser module is not available, use the original method
                    parsed: Posts = Posts.model_validate_json(result)
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Successfully parsed {len(parsed.posts)} posts.")
            except json.JSONDecodeError as e:
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: JSON decode error: {e}")
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Raw result: {result}")
                
                # Try to save the raw result to a file for later processing
                try:
                    with open("agent_response.txt", "w") as f:
                        f.write(result)
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Saved raw result to agent_response.txt")
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: You can process this file later using: python fix_json_parser.py agent_response.txt")
                except Exception as write_error:
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error saving raw result: {write_error}")
                
                return
            except Exception as e:
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error parsing agent output: {e}")
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Raw result: {result}")
                
                # Try to save the raw result to a file for later processing
                try:
                    with open("agent_response.txt", "w") as f:
                        f.write(result)
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Saved raw result to agent_response.txt")
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: You can process this file later using: python fix_json_parser.py agent_response.txt")
                except Exception as write_error:
                    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error saving raw result: {write_error}")
                
                return
            
            # Connect to (or create) a SQLite database and create the posts table if needed.
            conn = sqlite3.connect("x_com_posts.db")
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS posts (
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
                            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            # Insert each post into the table.
            for post in parsed.posts:
                # Convert any string metrics to integers
                views = convert_abbreviated_number(post.views)
                comments = convert_abbreviated_number(post.comments)
                retweets = convert_abbreviated_number(post.retweets)
                likes = convert_abbreviated_number(post.likes)
                saves = convert_abbreviated_number(post.saves)
                
                c.execute('''
                    INSERT INTO posts (
                        post_text, post_url, username, image_url, 
                        views, comments, retweets, likes, saves, post_time
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    post.post_text, post.post_url, post.username, post.image_url,
                    views, comments, retweets, likes, saves, post.post_time
                ))
            conn.commit()
            conn.close()
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Stored {len(parsed.posts)} posts successfully.")
        else:
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: No result from agent.")
    except Exception as e:
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error during agent execution: {e}")
        # If there's an error, reset the agent instance so we create a new one next time
        agent_instance = None
    
    print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Agent task completed, browser session closed.")

# ----------------------
# Synchronous Job Wrapper
# ----------------------

def job(post_count: int = 10):
    asyncio.run(main_job(post_count))

# ----------------------
# Main: Run Once
# ----------------------

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Scrape posts from Twitter/X.com")
    parser.add_argument("--count", type=int, default=10, help="Number of posts to scrape (default: 10)")
    args = parser.parse_args()
    
    post_count = args.count
    
    print(f"Starting Twitter post scraper (scraping {post_count} posts)...")
    # Run the job once and exit
    job(post_count)
    print(f"Scraping completed. {post_count} posts saved to x_com_posts.db")
