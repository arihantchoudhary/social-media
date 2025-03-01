import sqlite3
import os
import time

def run_sql_file(sql_file_path, db_file_path):
    """
    Execute SQL statements from a file against a SQLite database.
    
    Args:
        sql_file_path (str): Path to the SQL file
        db_file_path (str): Path to the SQLite database file
    """
    print(f"Running SQL file: {sql_file_path}")
    print(f"Target database: {db_file_path}")
    
    # Read the SQL file
    with open(sql_file_path, 'r') as file:
        sql_script = file.read()
    
    # Connect to the database
    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()
    
    # Split the script into individual statements
    # This simple approach works for most basic SQL files
    statements = sql_script.split(';')
    
    # Execute each statement
    count = 0
    for statement in statements:
        statement = statement.strip()
        if statement:
            try:
                cursor.execute(statement)
                count += 1
            except sqlite3.Error as e:
                print(f"Error executing statement: {e}")
                print(f"Statement: {statement[:100]}...")
    
    # Commit the changes
    conn.commit()
    
    # Get the number of posts in the database
    cursor.execute("SELECT COUNT(*) FROM posts")
    post_count = cursor.fetchone()[0]
    
    # Close the connection
    conn.close()
    
    print(f"Executed {count} SQL statements successfully")
    print(f"Total posts in database: {post_count}")

if __name__ == "__main__":
    # File paths
    sql_file = "insert_more_posts.sql"
    db_file = "x_com_posts.db"
    
    # Check if the SQL file exists
    if not os.path.exists(sql_file):
        print(f"Error: SQL file '{sql_file}' not found")
        exit(1)
    
    # Run the SQL file
    start_time = time.time()
    run_sql_file(sql_file, db_file)
    end_time = time.time()
    
    print(f"Operation completed in {end_time - start_time:.2f} seconds")
