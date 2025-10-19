const admin = require('firebase-admin');
const crypto = require('crypto');

// Simple in-memory session store (in production, use Redis or database)
const sessions = new Map();

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Clean up expired sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_DURATION) {
            sessions.delete(sessionId);
        }
    }
}, SESSION_CLEANUP_INTERVAL);

// Generate secure session ID
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

// Create a new session
function createSession(userId, username) {
    const sessionId = generateSessionId();
    const session = {
        id: sessionId,
        userId: userId,
        username: username,
        createdAt: Date.now(),
        lastAccessed: Date.now()
    };
    
    sessions.set(sessionId, session);
    return sessionId;
}

// Get session by ID
function getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
        return null;
    }
    
    // Check if session is expired
    const now = Date.now();
    if (now - session.createdAt > SESSION_DURATION) {
        sessions.delete(sessionId);
        return null;
    }
    
    // Update last accessed time
    session.lastAccessed = now;
    return session;
}

// Destroy session
function destroySession(sessionId) {
    sessions.delete(sessionId);
}

// Authenticate user against Firebase database
async function authenticateUser(username, password) {
    try {
        if (!admin.apps.length) {
            throw new Error('Firebase Admin not initialized');
        }
        
        const db = admin.firestore();
        const usersRef = db.collection('tblx-users');
        
        // Query for user by username
        const snapshot = await usersRef.where('username', '==', username).limit(1).get();
        
        if (snapshot.empty) {
            return { success: false, message: 'Invalid username or password' };
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        // Simple password comparison (in production, use proper hashing)
        if (userData.password !== password) {
            return { success: false, message: 'Invalid username or password' };
        }
        
        // Check if user is active
        if (userData.status !== 'active') {
            return { success: false, message: 'Account is not active' };
        }
        
        return {
            success: true,
            user: {
                id: userDoc.id,
                username: userData.username,
                email: userData.email,
                role: userData.role || 'admin',
                status: userData.status
            }
        };
        
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Authentication failed' };
    }
}

// Middleware to check authentication
function requireAuth(req, res, next) {
    const sessionId = req.cookies?.adminSession;
    
    if (!sessionId) {
        return res.redirect('/admin/login');
    }
    
    const session = getSession(sessionId);
    if (!session) {
        res.clearCookie('adminSession');
        return res.redirect('/admin/login');
    }
    
    req.user = session;
    next();
}

// Middleware to check if user is already logged in
function redirectIfAuthenticated(req, res, next) {
    const sessionId = req.cookies?.adminSession;
    
    if (sessionId) {
        const session = getSession(sessionId);
        if (session) {
            return res.redirect('/admin');
        }
    }
    
    next();
}

// Login handler
async function handleLogin(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.render('login', { 
            error: 'Username and password are required' 
        });
    }
    
    try {
        const authResult = await authenticateUser(username, password);
        
        if (!authResult.success) {
            return res.render('login', { 
                error: authResult.message 
            });
        }
        
        // Create session
        const sessionId = createSession(authResult.user.id, authResult.user.username);
        
        // Set session cookie
        res.cookie('adminSession', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION,
            sameSite: 'strict'
        });
        
        // Redirect to admin dashboard
        res.redirect('/admin');
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            error: 'Login failed. Please try again.' 
        });
    }
}

// Logout handler
function handleLogout(req, res) {
    const sessionId = req.cookies?.adminSession;
    
    if (sessionId) {
        destroySession(sessionId);
    }
    
    res.clearCookie('adminSession');
    res.redirect('/admin/login');
}

module.exports = {
    requireAuth,
    redirectIfAuthenticated,
    handleLogin,
    handleLogout,
    getSession,
    createSession,
    destroySession
};
