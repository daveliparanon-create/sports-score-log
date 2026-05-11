const bcrypt = require('bcryptjs');
const db = require('../config/db');

class User {
  static async create({ name, email, password }) {
    // Check if user exists
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async findByEmail(email) {
    const user = db.findUserByEmail(email);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { user, userWithoutPassword };
    }
    return null;
  }

  static async findById(id) {
    const user = db.findUserById(id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static getAllUsers() {
    return db.getUsers().map(({ password, ...user }) => user);
  }
}

module.exports = User;