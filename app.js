const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For password hashing
const app = express();
const port = 3000;


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/syntheticstest', { // Replace with your DB name
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));



// Define User Schema (Mongoose)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store the HASH, not the plain password
  });


const User = mongoose.model('User', userSchema);


// Session Configuration
app.use(session({
    secret: 'thisisastupidsecret', // Change this to a random, strong secret!
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  }));
  


  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

app.get('/', (req, res) => {
  if (req.session.userId) { // Check if user is logged in
    res.redirect('/welcome'); // Redirect to welcome page
  } else {
    res.sendFile(__dirname + '/public/login.html'); // Serve login form
  }
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.send('Invalid username or password'); // Handle invalid username
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password); // Compare hashed password
      if (passwordMatch) {
        req.session.userId = user._id; // Store user ID in session
        req.session.username = user.username; // Optionally store username
        res.redirect('/welcome');
      } else {
        res.send('Invalid username or password'); // Handle invalid password
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred');
    }
  });


  app.get('/welcome', (req, res) => {
    if (req.session.userId) {
       res.sendFile(__dirname + '/public/welcome.html'); // Serve welcome page
    } else {
      res.redirect('/'); // Redirect to login if not logged in
    }
  });
  
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        res.send('Error during logout');
      } else {
        res.redirect('/');
      }
    });
  });
  
  // Register route (example)
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
  
        const newUser = new User({
            username,
            password: hashedPassword, // Store the hashed password
        });
  
        await newUser.save();
        res.redirect('/'); // Redirect to login after registration
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during registration');
    }
  });





app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });

  