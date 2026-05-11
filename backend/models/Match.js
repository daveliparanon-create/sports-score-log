const db = require('../config/db');

class Match {
  static async create(matchData, userId) {
    const newMatch = {
      id: Date.now(),
      ...matchData,
      userId,
      createdAt: new Date().toISOString(),
      winner: this.calculateWinner(matchData)
    };

    db.addMatch(newMatch);
    return newMatch;
  }

  static async findAllByUser(userId) {
    return db.findMatchesByUser(userId);
  }

  static async findById(id) {
    return db.findMatchById(id);
  }

  static async update(id, updateData, userId) {
    const match = db.findMatchById(id);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (match.userId !== userId) {
      throw new Error('Unauthorized: You do not own this match');
    }

    // Calculate winner if scores are provided
    if (updateData.teamAScore !== undefined || updateData.teamBScore !== undefined) {
      const updatedMatch = { ...match, ...updateData };
      updateData.winner = this.calculateWinner(updatedMatch);
    }

    const updated = db.updateMatch(id, updateData);
    return updated;
  }

  static async delete(id, userId) {
    const match = db.findMatchById(id);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (match.userId !== userId) {
      throw new Error('Unauthorized: You do not own this match');
    }

    return db.deleteMatch(id);
  }

  static calculateWinner(match) {
    if (match.status !== 'finished') return '';
    
    if (match.teamAScore > match.teamBScore) {
      return match.teamA;
    } else if (match.teamBScore > match.teamAScore) {
      return match.teamB;
    }
    return 'Tie';
  }

  static filterByStatus(matches, status) {
    return matches.filter(m => m.status === status);
  }

  static searchByTeam(matches, searchTerm) {
    if (!searchTerm) return matches;
    const term = searchTerm.toLowerCase();
    return matches.filter(m => 
      m.teamA.toLowerCase().includes(term) || 
      m.teamB.toLowerCase().includes(term)
    );
  }

  static filterBySport(matches, sport) {
    if (!sport || sport === 'all') return matches;
    return matches.filter(m => m.sport === sport);
  }
}

module.exports = Match;