// CommonJS version for Node.js environment
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAECqp7AvXrT14Jn2C3tAyXVjy7QcvAvZk",
  authDomain: "social-media-f4a57.firebaseapp.com",
  projectId: "social-media-f4a57",
  storageBucket: "social-media-f4a57.firebasestorage.app",
  messagingSenderId: "972576692145",
  appId: "1:972576692145:web:ed360b7eb4bfabcb95cf90"
  // Removed measurementId and analytics which are browser-only
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample posts
const postsData = [
    {
        url: "https://twitter.com/elonmusk/status/1445046980998483968",
        summary: "A lot of people don't realize that the President of the United States can launch nukes at will. No need for approval from Congress or anyone. This needs to change.",
        keywords: ["politics", "nuclear weapons", "President", "United States"],
        rank: 95,
        username: "Elon Musk",
        accountUrl: "https://twitter.com/elonmusk",
        profilePicture: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg",
        creatorId: "system"
    },
    {
        url: "https://twitter.com/BillGates/status/1442908542798258177",
        summary: "60 million people die each year. More than two-thirds of those deaths are from age-related diseases. If we could reduce that by just 10%, it would save an additional 4 million lives a year.",
        keywords: ["health", "aging", "mortality", "research"],
        rank: 92,
        username: "Bill Gates",
        accountUrl: "https://twitter.com/BillGates",
        profilePicture: "https://pbs.twimg.com/profile_images/1564398871996174336/M-hffw5a_400x400.jpg",
        creatorId: "system"
    },
    {
        url: "https://www.instagram.com/p/CvA2fN4NXLL/",
        summary: "Found this incredible underwater cave while diving in Mexico. The crystal clear cenotes of the Yucatan Peninsula are truly one of the world's natural wonders.",
        keywords: ["travel", "diving", "Mexico", "nature"],
        rank: 91,
        username: "National Geographic",
        accountUrl: "https://www.instagram.com/natgeo/",
        profilePicture: "https://instagram.fphx1-2.fna.fbcdn.net/v/t51.2885-19/44222267_345707439493438_2446069589823094784_n.jpg",
        creatorId: "system"
    },
    {
        url: "https://twitter.com/BarackObama/status/1444367348225445890",
        summary: "When our kids tell us that climate change is real and they're scared about what it means for their future, we need to listen. Their generation will have to deal with the consequences of our actions—or inaction—today.",
        keywords: ["climate change", "future", "children", "environment"],
        rank: 88,
        username: "Barack Obama",
        accountUrl: "https://twitter.com/BarackObama",
        profilePicture: "https://pbs.twimg.com/profile_images/1329647026807543809/2SGvnHYV_400x400.jpg",
        creatorId: "system"
    },
    {
        url: "https://www.instagram.com/p/CwfTqZSLwIB/",
        summary: "New research suggests that practicing mindfulness meditation for just 10 minutes a day can significantly reduce stress levels and improve focus. Try it with me this week!",
        keywords: ["meditation", "mindfulness", "health", "wellness"],
        rank: 84,
        username: "Headspace",
        accountUrl: "https://www.instagram.com/headspace/",
        profilePicture: "https://instagram.fphx1-1.fna.fbcdn.net/v/t51.2885-19/11356793_110198522644721_22903468_a.jpg",
        creatorId: "system"
    }
];

// Upload posts to Firestore
async function uploadPosts() {
    console.log("Uploading posts...");
    
    for (const post of postsData) {
        try {
            await addDoc(collection(db, 'posts'), post);
            console.log(`Added post: ${post.username}`);
        } catch (error) {
            console.error(`Error adding post: ${post.username}`, error);
        }
    }
    
    console.log("Upload complete!");
    process.exit(0);
}

// Start the upload
uploadPosts();