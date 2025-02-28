// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, checking auth status");
    
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        console.log("Auth state changed:", user ? "User logged in" : "No user");
        if (user) {
            // User is signed in, redirect to app
            window.location.href = 'app.html';
        }
    });

    // Setup Google sign-in
    const googleSignInButton = document.getElementById('google-signin');
    
    googleSignInButton.addEventListener('click', () => {
        console.log("Google signin button clicked");
        signInWithGoogle();
    });
});

// Google Sign-in function
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Sign-in successful!");
            
            // Check if this is a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
                console.log("Creating new user profile");
                
                // Create user profile document
                return db.collection('users').doc(result.user.uid).set({
                    displayName: result.user.displayName || '',
                    email: result.user.email,
                    photoURL: result.user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    socialAccounts: []
                });
            }
        })
        .then(() => {
            // Redirect to the app
            window.location.href = 'app.html';
        })
        .catch((error) => {
            // Handle errors
            const errorElement = document.getElementById('auth-error');
            errorElement.textContent = error.message;
            console.error('Authentication error:', error);
        });
}