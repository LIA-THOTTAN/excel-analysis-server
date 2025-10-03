// middleware/checkAdminRole.js

const checkAdminRole = (req, res, next) => {
    // Assuming your authentication middleware attaches the user's role to req.user
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next(); // User has the correct role, proceed
    } else {
        res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions to perform this action.' });
    }
};

module.exports = checkAdminRole;