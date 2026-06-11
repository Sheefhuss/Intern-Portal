const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// For Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/internships', require('./routes/internships'));
app.use('/api/applications', require('./routes/applications'));

app.get('/', (req, res) => {
  res.send('Intern Portal API running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});