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

-- Insert posts data
-- Post 1
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'President @realDonaldTrump is the Commander-in-Chief',
    'https://x.com/elonmusk/status/1895536186942505188',
    'Elon Musk',
    NULL,
    46000000,
    40000,
    65000,
    436000,
    NULL,
    '14h'
);

-- Post 2
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Introducing Sleep Elixir',
    'https://www.eightsleep.com/product/sleep-elixir/?utm_source=twitter&utm_medium=paid&utm_campaign=campaign_test&utm_term=adgroup_test&utm_content=ad_test&twclid=2-2l8qmm7zeonfnwc75vqh7sx6r',
    'Eight Sleep',
    'https://pbs.twimg.com/media/GkGaaMxXEAAjvs8?format=jpg&name=small',
    279000,
    136,
    65,
    NULL,
    NULL,
    NULL
);

-- Post 3
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'The bond between the UK and the US couldn''t be stronger. Thank you for your hospitality, @POTUS.',
    'https://x.com/Keir_Starmer/status/1895223245084991847',
    'Keir Starmer',
    'https://pbs.twimg.com/media/Gk0r3hjXkAAL8Ho?format=jpg&name=small',
    2500000,
    8900,
    2700,
    24000,
    NULL,
    'Feb 27'
);

-- Post 4
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Thank you for your support.',
    'https://x.com/ZelenskyyUa/status/1895613420088803376',
    'Volodymyr Zelenskyy',
    NULL,
    3400000,
    4700,
    4500,
    70000,
    NULL,
    '9h'
);

-- Post 5
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    '🚨BREAKING: President Trump has officially halted ALL weapon shipments to Ukraine. Does Trump have your full support on this? A. YES B. NO',
    'https://x.com/JDVanceNewsX/status/1895487229080080860',
    'JD Vance News',
    'https://pbs.twimg.com/media/Gk4fli0W8AALBYP?format=jpg&name=small',
    3700000,
    59000,
    15000,
    143000,
    NULL,
    '18h'
);

-- Post 6
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Elon Musk in new Joe Rogan interview on who founded @Tesla: "Tesla did not exist in any meaningful form. There were no employees. JB Straubel and I joined three other people. There was no car, no nothing." Joe: So there wasn''t even a prototype yet? Elon: No Joe: That''s a funny',
    'https://x.com/SawyerMerritt/status/1895628953827619179',
    'Sawyer Merritt',
    NULL,
    289000,
    114,
    225,
    3100,
    NULL,
    '8h'
);

-- Post 7
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Explain what makes them trans.',
    'https://x.com/jk_rowling/status/1895193727787995646',
    'J.K. Rowling',
    NULL,
    35000000,
    5700,
    24000,
    313000,
    NULL,
    'Feb 27'
);

-- Post 8
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    NULL,
    'https://x.com/YourAnonNews/status/1895585307153875096',
    'Anonymous',
    'https://pbs.twimg.com/media/Gk54ynVXUAA3g_y?format=jpg&name=small',
    10000000,
    2100,
    30000,
    278000,
    NULL,
    '11h'
);

-- Post 9
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    NULL,
    'https://x.com/JDVance/status/1895540552277639616',
    'JD Vance',
    'https://pbs.twimg.com/media/Gk5QEwzW0AAWpMs?format=jpg&name=small',
    10000000,
    35000,
    30000,
    234000,
    NULL,
    '14h'
);

-- Post 10
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Sometime in the near future, electric vehicles will just be vehicles',
    'https://x.com/Tesla/status/1895193490637934997',
    'Tesla',
    NULL,
    2900000,
    949,
    1100,
    12000,
    NULL,
    'Feb 27'
);

-- Post 11
INSERT INTO posts (post_text, post_url, username, image_url, views, comments, retweets, likes, saves, post_time)
VALUES (
    'Vance: Have you said thank you once? Zelenskyy: You think if you speak very loudly— Trump: He''s not speaking loudly. You''ve done a lot of talking. You''re not winning this',
    'https://x.com/Acyn/status/1895531921456972130',
    'Acyn',
    NULL,
    16000000,
    2400,
    9500,
    114000,
    NULL,
    '15h'
);
