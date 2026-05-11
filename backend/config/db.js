const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../db.json');

class Database {
  constructor() {
    this.db = null;
    this.loadDatabase();
  }

  loadDatabase() {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      this.db = JSON.parse(data);
    } catch (error) {
      this.db = { users: [], matches: [] };
      this.saveDatabase();
    }
  }

  saveDatabase() {
    fs.writeFileSync(dbPath, JSON.stringify(this.db, null, 2));
  }

  getUsers() {
    return this.db.users;
  }

  getMatches() {
    return this.db.matches;
  }

  addUser(user) {
    this.db.users.push(user);
    this.saveDatabase();
    return user;
  }

  addMatch(match) {
    this.db.matches.push(match);
    this.saveDatabase();
    return match;
  }

  updateMatch(id, updatedMatch) {
    const index = this.db.matches.findIndex(m => m.id === id);
    if (index !== -1) {
      this.db.matches[index] = { ...this.db.matches[index], ...updatedMatch };
      this.saveDatabase();
      return this.db.matches[index];
    }
    return null;
  }

  deleteMatch(id) {
    const index = this.db.matches.findIndex(m => m.id === id);
    if (index !== -1) {
      this.db.matches.splice(index, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  findUserByEmail(email) {
    return this.db.users.find(u => u.email === email);
  }

  findUserById(id) {
    return this.db.users.find(u => u.id === id);
  }

  findMatchesByUser(userId) {
    return this.db.matches.filter(m => m.userId === userId);
  }

  findMatchById(id) {
    return this.db.matches.find(m => m.id === id);
  }
}

module.exports = new Database();