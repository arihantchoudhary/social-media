-- SQL file to insert Twitter/X.com posts into the database
-- Created on 2025-03-01

-- Make sure the posts table exists
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
);

-- Insert posts data from JSON

-- Post 1: Elon Musk - Feb 28
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'A reminder of what could happen',
    'https://x.com/elonmusk/status/123456789',
    'Elon Musk',
    NULL,
    38000000,
    7000,
    42000,
    196000,
    NULL,
    'Feb 28'
);

-- Post 2: Deepgram - Ad
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Imagine using your voice to guide an AI as you code, turning ideas into working prototypes fast. Meet Vibe Coder, our experimental, open-source take on voice-driven coding aka #vibecoding (shout out to @karpathy for coining this catchy term).',
    'https://x.com/DeepgramAI/status/123456790',
    'Deepgram',
    'https://pbs.twimg.com/media/Gkzz2G1bgAABLtv?format=jpg&name=medium',
    NULL,
    71,
    475,
    66000,
    NULL,
    'Ad'
);

-- Post 3: Deedy - Feb 28
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Tried this 5 times on ChatGPT 4.5 and it gets it wrong every time. What data causes decimal mistake? What fixes GPT-4.5 reasoning?',
    'https://x.com/deedydas/status/123456791',
    'Deedy',
    'https://pbs.twimg.com/media/Gk3KqUwXgAA5S5l?format=png&name=900x900',
    612000,
    758,
    2300,
    74100,
    NULL,
    'Feb 28'
);

-- Post 4: MrBeast - 7h
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'A news site lied and said I said "life is so much easier when you are broke" which I did not say. Now I am waking up to millions of people believing the lie and hating me. Being famous is so much fun.',
    'https://x.com/MrBeast/status/123456792',
    'MrBeast',
    NULL,
    7200000,
    5400,
    5900,
    145000,
    NULL,
    '7h'
);

-- Post 5: Lex Fridman - 3h
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'The problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts. - Bertrand Russell',
    'https://x.com/lexfridman/status/123456793',
    'Lex Fridman',
    NULL,
    405000,
    932,
    1100,
    9100,
    NULL,
    '3h'
);

-- Post 6: Sam Altman - Feb 28
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'it is very hard to get the math and ML right on a run as big as GPT-4.5, and requires difficult work at the intersection of ML and systems. @ColinWei11, Yujia Jin, and @MikhailPavlov5 did excellent work to make this happen!',
    'https://x.com/sama/status/123456794',
    'Sam Altman',
    NULL,
    657000,
    705,
    3900,
    76600,
    NULL,
    'Feb 28'
);

-- Post 7: CALL TO ACTIVISM - Feb 28
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'What do you notice about Marco Rubio as he sat in the Oval Office while Trump yelled at Zelensky?',
    'https://x.com/CalltoActivism/status/123456795',
    'CALL TO ACTIVISM',
    'https://pbs.twimg.com/media/Gk5a84hWAAAu6L_?format=jpg&name=900x900',
    516000,
    3100,
    1200,
    7400,
    NULL,
    'Feb 28'
);

-- Post 8: Tim Cook - 20h
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Ramadan Mubarak to all of those observing around the world!',
    'https://x.com/tim_cook/status/123456796',
    'Tim Cook',
    NULL,
    3800000,
    1500,
    5000,
    53000,
    NULL,
    '20h'
);

-- Post 9: Clown World - 19h
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Drop your best Zelensky memes in the comments',
    'https://x.com/ClownWorld_/status/123456797',
    'Clown World',
    'https://example.com/zelensky-meme.jpg',
    4800000,
    3400,
    5300,
    56000,
    NULL,
    '19h'
);

-- Post 10: Elon Musk - 1h
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'The media could not be played.',
    'https://x.com/elonmusk/status/123456798',
    'Elon Musk',
    NULL,
    2100000,
    2900,
    7200,
    33000,
    NULL,
    '1h'
);
