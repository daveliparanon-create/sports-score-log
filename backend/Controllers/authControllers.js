const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const authController = {
  // POST /api/auth/signup
  async signup(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Create user
      const user = await User.create({ name, email, password });

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        token,
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const result = await User.findByEmail(email);
      
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Validate password
      const isValid = await User.validatePassword(password, result.user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({ userId: result.user.id, email: result.user.email });

      res.json({
        success: true,
        token,
        user: result.userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/auth/users (for forgot password)
  async getAllUsers(req, res) {
    try {
      const users = User.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;