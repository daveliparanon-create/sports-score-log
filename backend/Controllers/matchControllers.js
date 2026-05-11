const Match = require('../models/Match');

const matchController = {
  // GET /api/matches
  async getAllMatches(req, res) {
    try {
      const matches = await Match.findAllByUser(req.user.userId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/matches/:id
  async getMatchById(req, res) {
    try {
      const match = await Match.findById(parseInt(req.params.id));
      
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      if (match.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/matches
  async createMatch(req, res) {
    try {
      const { teamA, teamB, teamAScore, teamBScore, sport, status, date, time } = req.body;
      
      // Validation
      if (!teamA || !teamB || !sport || !status || !date || !time) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      const matchData = {
        teamA,
        teamB,
        teamAScore: teamAScore || 0,
        teamBScore: teamBScore || 0,
        sport,
        status,
        date,
        time
      };

      const newMatch = await Match.create(matchData, req.user.userId);
      res.status(201).json(newMatch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/matches/:id
  async updateMatch(req, res) {
    try {
      const matchId = parseInt(req.params.id);
      const updatedMatch = await Match.update(matchId, req.body, req.user.userId);
      
      if (!updatedMatch) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      res.json(updatedMatch);
    } catch (error) {
      if (error.message === 'Unauthorized: You do not own this match') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/matches/:id
  async deleteMatch(req, res) {
    try {
      const matchId = parseInt(req.params.id);
      const deleted = await Match.delete(matchId, req.user.userId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      res.json({ success: true, message: 'Match deleted successfully' });
    } catch (error) {
      if (error.message === 'Unauthorized: You do not own this match') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = matchController;