// Sample database with Twitter and Instagram posts
const postsData = [
    {
        url: "https://twitter.com/elonmusk/status/1445046980998483968",
        summary: "A lot of people don't realize that the President of the United States can launch nukes at will. No need for approval from Congress or anyone. This needs to change.",
        keywords: ["politics", "nuclear weapons", "President", "United States"],
        rank: 95,
        username: "Elon Musk",
        accountUrl: "https://twitter.com/elonmusk",
        profilePicture: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg",
        userInteraction: 0,  // 0 = neutral, 1 = liked, -1 = disliked
        isFriend: false      // New field to indicate if this is a "friend"
    },
    {
        url: "https://twitter.com/BillGates/status/1442908542798258177",
        summary: "60 million people die each year. More than two-thirds of those deaths are from age-related diseases. If we could reduce that by just 10%, it would save an additional 4 million lives a year.",
        keywords: ["health", "aging", "mortality", "research"],
        rank: 92,
        username: "Bill Gates",
        accountUrl: "https://twitter.com/BillGates",
        profilePicture: "https://pbs.twimg.com/profile_images/1564398871996174336/M-hffw5a_400x400.jpg",
        userInteraction: 0,
        isFriend: true
    },
    {
        url: "https://www.instagram.com/p/CvA2fN4NXLL/",
        summary: "Found this incredible underwater cave while diving in Mexico. The crystal clear cenotes of the Yucatan Peninsula are truly one of the world's natural wonders.",
        keywords: ["travel", "diving", "Mexico", "nature"],
        rank: 91,
        username: "National Geographic",
        accountUrl: "https://www.instagram.com/natgeo/",
        profilePicture: "https://instagram.fphx1-2.fna.fbcdn.net/v/t51.2885-19/44222267_345707439493438_2446069589823094784_n.jpg",
        userInteraction: 0,
        isFriend: false
    },
    {
        url: "https://twitter.com/BarackObama/status/1444367348225445890",
        summary: "When our kids tell us that climate change is real and they're scared about what it means for their future, we need to listen. Their generation will have to deal with the consequences of our actions—or inaction—today.",
        keywords: ["climate change", "future", "children", "environment"],
        rank: 88,
        username: "Barack Obama",
        accountUrl: "https://twitter.com/BarackObama",
        profilePicture: "https://pbs.twimg.com/profile_images/1329647026807543809/2SGvnHYV_400x400.jpg",
        userInteraction: 0,
        isFriend: true
    },
    {
        url: "https://www.instagram.com/p/CwfTqZSLwIB/",
        summary: "New research suggests that practicing mindfulness meditation for just 10 minutes a day can significantly reduce stress levels and improve focus. Try it with me this week!",
        keywords: ["meditation", "mindfulness", "health", "wellness"],
        rank: 84,
        username: "Headspace",
        accountUrl: "https://www.instagram.com/headspace/",
        profilePicture: "https://instagram.fphx1-1.fna.fbcdn.net/v/t51.2885-19/11356793_110198522644721_22903468_a.jpg",
        userInteraction: 0,
        isFriend: true
    },
    {
        url: "https://twitter.com/NASA/status/1445509856694190080",
        summary: "What's up in the night sky this month? Look up to see the annual Orionid meteor shower, the best view of distant Uranus, and an interesting gathering of the Moon and planets.",
        keywords: ["astronomy", "meteor shower", "planets", "night sky", "stars"],
        rank: 82,
        username: "NASA",
        accountUrl: "https://twitter.com/NASA",
        profilePicture: "https://pbs.twimg.com/profile_images/1321163587679784960/0ZxKlEKB_400x400.jpg",
        userInteraction: 0,
        isFriend: false
    },
    {
        url: "https://www.instagram.com/p/CwcRN9HpXUr/",
        summary: "Sharing my morning routine that keeps me energized all day. Starting with a 5-minute meditation, followed by a green smoothie and 30 minutes of yoga.",
        keywords: ["wellness", "routine", "fitness", "lifestyle"],
        rank: 78,
        username: "Yoga with Adriene",
        accountUrl: "https://www.instagram.com/adrienelouise/",
        profilePicture: "https://instagram.fphx1-2.fna.fbcdn.net/v/t51.2885-19/74922053_2476338445813561_3444498771883917312_n.jpg",
        userInteraction: 0,
        isFriend: true
    },
    {
        url: "https://twitter.com/XDevelopers/status/1615024558673960961",
        summary: "Introducing our new developer portal! Find all the tools and resources you need to build with the Twitter API in one place.",
        keywords: ["technology", "development", "API", "coding"],
        rank: 85,
        username: "Twitter Developers",
        accountUrl: "https://twitter.com/XDevelopers",
        profilePicture: "https://pbs.twimg.com/profile_images/1683480286128369664/dWfPkPJ5_400x400.jpg",
        userInteraction: 0,
        isFriend: true
    }
];