import jwt from 'jsonwebtoken';

// Mock users (in a real app, these would be in the database)
const mockUsers = [
  {
    id: '1',
    username: 'netrunnerX',
    password: 'password123',
    role: 'admin'
  },
  {
    id: '2',
    username: 'reliefAdmin',
    password: 'password456',
    role: 'admin'
  },
  {
    id: '3',
    username: 'contributor1',
    password: 'password789',
    role: 'contributor'
  }
];



// Login a user
export const login = (req, res) => {
  const { username, password } = req.body;

  // Find the user in our mock database
  const user = mockUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate a JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
};

// Get user profile
export const getProfile = (req, res) => {
  // Token validation is done in middleware, so we can access req.user
  res.json({ user: req.user });
};