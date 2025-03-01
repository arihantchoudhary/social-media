#!/usr/bin/env python3
"""
Social Media Content Curation System - Main Controller

This script orchestrates the execution of all components in the social media content curation system.
It allows running the entire pipeline or specific stages of the workflow.
"""

import os
import sys
import argparse
import subprocess
import time
from typing import List, Optional

# Define the components and their execution order
COMPONENTS = {
    "scrape": {
        "script": "social_media_scraper.py",
        "description": "Scrape content from social media platforms",
        "depends_on": [],
        "default_args": ["--count", "10"]
    },
    "keywords": {
        "script": "generate_keywords.py",
        "description": "Generate keywords for posts",
        "depends_on": ["scrape"]
    },
    "rank": {
        "script": "ranking_llm.py",
        "description": "Rank posts based on user preferences",
        "depends_on": ["scrape"]
    },
    "export": {
        "script": "export_keywords.py",
        "description": "Export keywords to text and JSON files",
        "depends_on": ["keywords"]
    },
    "discover": {
        "script": "user_posts_output.py",
        "description": "Find and select posts based on user query",
        "depends_on": ["export", "rank"]
    },
    "validate": {
        "script": "user_bot_verification.py",
        "description": "Simulate user validation of selected posts",
        "depends_on": ["discover"]
    },
    "feedback": {
        "script": "user_feedback_sample.py",
        "description": "Generate sample user feedback",
        "depends_on": ["validate"]
    },
    "profile": {
        "script": "dynamic_user_profile.py",
        "description": "Generate dynamic user profile based on feedback",
        "depends_on": ["feedback"]
    },
    "view": {
        "script": "view_selected_posts.py",
        "description": "View selected posts with validation status",
        "depends_on": ["validate"]
    }
}

# Define workflow stages
WORKFLOW_STAGES = {
    "data_collection": ["scrape"],
    "content_enhancement": ["keywords", "rank", "export"],
    "content_discovery": ["discover"],
    "content_validation": ["validate", "view"],
    "feedback_adaptation": ["feedback", "profile"],
    "personalized_discovery": ["discover"]
}

def check_dependencies() -> bool:
    """Check if all required files exist."""
    missing_files = []
    for component in COMPONENTS.values():
        if not os.path.exists(component["script"]):
            missing_files.append(component["script"])
    
    if missing_files:
        print("Error: The following required files are missing:")
        for file in missing_files:
            print(f"  - {file}")
        return False
    
    return True

def run_component(component_name: str, args: List[str] = None, options: argparse.Namespace = None) -> bool:
    """Run a specific component with optional arguments."""
    if component_name not in COMPONENTS:
        print(f"Error: Unknown component '{component_name}'")
        return False
    
    component = COMPONENTS[component_name]
    script = component["script"]
    
    if not os.path.exists(script):
        print(f"Error: Script '{script}' not found")
        return False
    
    print(f"\n{'='*80}")
    print(f"Running {component_name}: {component['description']}")
    print(f"{'='*80}\n")
    
    cmd = [sys.executable, script]
    
    # Add default arguments for the component if they exist
    component_default_args = COMPONENTS[component_name].get("default_args", [])
    if component_default_args:
        cmd.extend(component_default_args)
    
    # Add custom arguments
    if args:
        cmd.extend(args)
    
    # Add component-specific arguments based on options
    if options:
        if component_name == "scrape" and options.post_count != 10:
            # Override the default post count if specified
            # Find the index of "--count" in the command
            try:
                count_index = cmd.index("--count")
                # Replace the value after "--count"
                cmd[count_index + 1] = str(options.post_count)
            except ValueError:
                # If "--count" is not in the command, add it
                cmd.extend(["--count", str(options.post_count)])
    
    try:
        process = subprocess.run(cmd, check=True)
        return process.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running {script}: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def run_workflow_stage(stage: str, options: argparse.Namespace = None) -> bool:
    """Run all components in a workflow stage."""
    if stage not in WORKFLOW_STAGES:
        print(f"Error: Unknown workflow stage '{stage}'")
        return False
    
    components = WORKFLOW_STAGES[stage]
    success = True
    
    for component in components:
        args = []
        
        # Add component-specific arguments based on options
        if component == "keywords" and options.force_keywords:
            args.append("--force")
        elif component == "rank" and options.dynamic:
            args.append("--dynamic")
        elif component == "discover" and options.dynamic:
            args.append("--dynamic")
        elif component == "feedback" and options.feedback_count > 0:
            args.extend(["--generate", str(options.feedback_count)])
        elif component == "profile" and options.force_profile:
            args.append("--force")
        
        # Special handling for interactive components
        if component == "discover" and options.query:
            # For non-interactive mode, we need to provide the query
            # This requires modifying user_posts_output.py to accept a --query parameter
            args.extend(["--query", options.query])
        
        if not run_component(component, args, options):
            success = False
            if not options.continue_on_error:
                print(f"Stopping workflow due to error in {component}")
                return False
    
    return success

def run_full_workflow(options: argparse.Namespace) -> bool:
    """Run the complete workflow from start to finish."""
    stages = list(WORKFLOW_STAGES.keys())
    
    # Skip personalized_discovery if not using dynamic profile
    if not options.dynamic:
        stages.remove("personalized_discovery")
    
    success = True
    for stage in stages:
        if not run_workflow_stage(stage, options):
            success = False
            if not options.continue_on_error:
                print(f"Stopping workflow due to error in stage {stage}")
                return False
        
        # Add a pause between stages if requested
        if options.pause > 0:
            print(f"\nPausing for {options.pause} seconds before next stage...\n")
            time.sleep(options.pause)
    
    return success

def main():
    """Main function to parse arguments and run the workflow."""
    parser = argparse.ArgumentParser(
        description="Social Media Content Curation System - Main Controller",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run the complete workflow
  python main.py --full
  
  # Run a specific stage
  python main.py --stage content_discovery
  
  # Run a specific component
  python main.py --component discover
  
  # Run with dynamic profile
  python main.py --full --dynamic
  
  # Generate 20 feedback entries
  python main.py --stage feedback_adaptation --feedback-count 20
"""
    )
    
    # Main operation modes
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--full", action="store_true", help="Run the complete workflow")
    mode_group.add_argument("--stage", choices=WORKFLOW_STAGES.keys(), help="Run a specific workflow stage")
    mode_group.add_argument("--component", choices=COMPONENTS.keys(), help="Run a specific component")
    
    # Options
    parser.add_argument("--dynamic", action="store_true", help="Use dynamic user profile")
    parser.add_argument("--force-keywords", action="store_true", help="Force regeneration of keywords")
    parser.add_argument("--force-profile", action="store_true", help="Force regeneration of dynamic profile")
    parser.add_argument("--feedback-count", type=int, default=10, help="Number of feedback entries to generate")
    parser.add_argument("--continue-on-error", action="store_true", help="Continue workflow even if a component fails")
    parser.add_argument("--pause", type=int, default=0, help="Pause between stages (seconds)")
    parser.add_argument("--query", help="Query for content discovery (non-interactive mode)")
    parser.add_argument("--post-count", type=int, default=10, help="Number of posts to scrape (default: 10)")
    
    args = parser.parse_args()
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    # Run the requested operation
    success = False
    if args.full:
        success = run_full_workflow(args)
    elif args.stage:
        success = run_workflow_stage(args.stage, args)
    elif args.component:
        component_args = []
        if args.component == "keywords" and args.force_keywords:
            component_args.append("--force")
        elif args.component == "rank" and args.dynamic:
            component_args.append("--dynamic")
        elif args.component == "discover" and args.dynamic:
            component_args.append("--dynamic")
        elif args.component == "feedback" and args.feedback_count > 0:
            component_args.extend(["--generate", str(args.feedback_count)])
        elif args.component == "profile" and args.force_profile:
            component_args.append("--force")
        
        success = run_component(args.component, component_args)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
