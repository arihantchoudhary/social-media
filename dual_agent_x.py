import asyncio
import time
from langchain_openai import ChatOpenAI
from browser_use import Agent, Browser, Controller
from pydantic import BaseModel
from typing import List

# Define the output model for the scrape agent
class Post(BaseModel):
    post_text: str
    summary: str
    keywords: List[str]
    post_url: str

class Posts(BaseModel):
    posts: List[Post]

# Initialize the LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# Sensitive credentials (replace with your actual credentials)
sensitive_data = {
    "x_name": "BehaniParth",
    "x_password": "4/mRzz*&/Pr3%Ek",
    "x_email": "parth.behani@gmail.com"
}

# Main asynchronous function to run the agents
async def main():
    # Create a Browser instance
    browser = Browser()
    
    # Create a persistent browser context
    async with await browser.new_context() as context:
        # Initialize the controller with the output model for the scrape agent
        controller = Controller(output_model=Posts)
        
        # Define initial actions to open X.com
        initial_actions = [{'open_tab': {'url': 'https://x.com'}}]
        
        # Login Agent: Logs into X.com
        login_agent = Agent(
            task="Using the provided sensitive credentials (x_name and x_password), log in to x.com. If it asks to enter email or number after you enter the username, use the provided x_email credential.",
            llm=llm,
            sensitive_data=sensitive_data,
            initial_actions=initial_actions,
            browser_context=context,
            controller=controller
        )
        await login_agent.run()
        print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Login agent completed.")
        
        # Scrape Agent: Scrapes posts from the feed
        scrape_agent = Agent(
            task="Assuming you are on x.com and logged in, navigate to your feed if necessary and retrieve the top 5 recommended posts. For each post, extract the full post text and its URL. Then, for each post, call an LLM to generate a concise summary and extract the top three keywords. Return the result as JSON following this schema: { 'posts': [ { 'post_text': string, 'summary': string, 'keywords': [string, string, string], 'post_url': string } ] }",
            llm=llm,
            browser_context=context,
            controller=controller
        )
        history = await scrape_agent.run()
        result = history.final_result()
        
        # Process the scrape agent's result
        if result:
            try:
                parsed = Posts.model_validate_json(result)
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Retrieved {len(parsed.posts)} posts:")
                for post in parsed.posts:
                    print(f"- Text: {post.post_text[:50]}..., URL: {post.post_url}")
            except Exception as e:
                print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: Error parsing result: {e}")
        else:
            print(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: No result from scrape agent.")
    
    # Close the browser
    await browser.close()

# Run the script
if __name__ == "__main__":
    asyncio.run(main())