const express = require('express');
const mongoose = require('./database'); 
const User = require('./models/User'); 
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Sample route to create a new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
