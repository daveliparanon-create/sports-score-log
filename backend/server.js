const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'sports-score-secret-key-2026';
const expiresIn = '1h';

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

function isAuthenticated(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  
  const token = authHeader.split(' ')[1];
  try {
    verifyToken(token);
    return true;
  } catch (error) {
    return false;
  }
}

// Enhanced CORS
server.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Add OPTIONS handling for preflight requests
server.options('*', cors());

// Login endpoint
server.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db;
  const users = db.get('users').value();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // For demo account, use simple password check
  if (email === 'demo@example.com' && password === 'password123') {
    const token = createToken({ userId: user.id, email: user.email });
    return res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  }
  
  // For other accounts, use bcrypt
  try {
    if (bcrypt.compareSync(password, user.password)) {
      const token = createToken({ userId: user.id, email: user.email });
      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name } 
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (e) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Signup endpoint
server.post('/api/signup', (req, res) => {
  const { email, password, name } = req.body;
  const db = router.db;
  const users = db.get('users').value();
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    name,
    createdAt: new Date().toISOString()
  };
  
  db.get('users').push(newUser).write();
  
  const token = createToken({ userId: newUser.id, email: newUser.email });
  res.json({ 
    token, 
    user: { id: newUser.id, email: newUser.email, name: newUser.name } 
  });
});

// Get users for forgot password
server.get('/api/users', (req, res) => {
  const db = router.db;
  const users = db.get('users').map(u => ({ id: u.id, email: u.email, name: u.name })).value();
  res.json(users);
});

// Protected routes
server.use('/api/matches', (req, res, next) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Get user's matches
server.get('/api/matches', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const payload = verifyToken(token);
  const db = router.db;
  const matches = db.get('matches').filter(m => m.userId === payload.userId).value();
  res.json(matches);
});

// Add match
server.post('/api/matches', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const payload = verifyToken(token);
  const db = router.db;
  
  const newMatch = {
    id: Date.now(),
    ...req.body,
    userId: payload.userId,
    createdAt: new Date().toISOString()
  };
  
  db.get('matches').push(newMatch).write();
  res.json(newMatch);
});

// Update match
server.put('/api/matches/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const payload = verifyToken(token);
  const db = router.db;
  const matchId = parseInt(req.params.id);
  const match = db.get('matches').find(m => m.id === matchId).value();
  
  if (!match || match.userId !== payload.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  db.get('matches').find({ id: matchId }).assign(req.body).write();
  res.json(db.get('matches').find({ id: matchId }).value());
});

// Delete match
server.delete('/api/matches/:id', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const payload = verifyToken(token);
  const db = router.db;
  const matchId = parseInt(req.params.id);
  const match = db.get('matches').find(m => m.id === matchId).value();
  
  if (!match || match.userId !== payload.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  db.get('matches').remove({ id: matchId }).write();
  res.json({ message: 'Match deleted successfully' });
});

server.use('/api', router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Sports Score Server running on http://localhost:${PORT}`);
  console.log('Demo Account - Email: demo@example.com, Password: password123');
});