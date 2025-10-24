

const checkAdminRole = (req, res, next) => {
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next(); 
    } else {
        res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions to perform this action.' });
    }
};

module.exports = checkAdminRole;