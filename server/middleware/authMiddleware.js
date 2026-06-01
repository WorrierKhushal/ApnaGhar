const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.refreshToken) {
    // Optional fallback, but Bearer tokens in headers are preferred for access tokens
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    // Verify Access Token signature
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Inject active user instance to request context
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, user no longer exists'));
    }

    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, invalid token signature'));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Forbidden: Access restricted to roles: [${roles.join(', ')}]`));
    }
    next();
  };
};

const getOptionalUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Fail silently and proceed as anonymous guest
    }
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  getOptionalUser
};
