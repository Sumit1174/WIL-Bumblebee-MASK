const mongoose = require('mongoose');


// const mongoURI = 'mongodb://user:1234@localhost:27017/?authSourch=bb_db';
const mongoURI = process.env['MONGO_URL'];

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;
