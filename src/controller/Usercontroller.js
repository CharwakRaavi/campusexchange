const User = require('../models/Usermodel.js'); // Correct import of the User model
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');



// Signup Controller
const signup = async (req, res) => {
    try {
        const { username, password, email, branch, year, role } = req.body;

        // Log the incoming request body
        console.log('Signup request received:', { username, email, branch, year, role });

        // Validate required fields
        if (!username || !password || !email || !branch || !year) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Username already exists' 
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Validate the role
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid role. Role must be either "user" or "admin".' 
            });
        }

        // Validate branch (case-insensitive)
        const allowedBranches = [
            "cse", "ece", "it", "aiml", "aids", "cic", "csd", "csit", "mech", "civil", "eee"
        ];
        if (!allowedBranches.includes(branch.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch. Please enter a valid branch.'
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document
        const newUser = new User({ 
            username, 
            password: hashedPassword, 
            email, 
            branch: branch.toLowerCase(), // Store branch in lowercase
            year, 
            role 
        });

        // Save the user to the database
        await newUser.save();

        console.log('User registered successfully:', username);

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully', 
            role: newUser.role 
        });

    } catch (error) {
        console.error('Error during signup:', error);
        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login Controller
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Log the incoming request body
        console.log('Login attempt for user:', username);

        // Validate required fields
        if (!username || !password) {
            console.log('Login failed: Missing username or password');
            return res.status(400).json({ 
                success: false,
                message: 'Username and password are required' 
            });
        }

        // Find the user in the database
        const user = await User.findOne({ username });
        console.log('User lookup result:', user ? 'User found' : 'User not found');

        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password' 
            });
        }

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch ? 'Password matched' : 'Password did not match');

        if (!isMatch) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', username);
        
        // Return the user's role, userId, and token along with the success message
        res.status(200).json({ 
            success: true,
            message: 'Login successful', 
            role: user.role,
            userId: user._id,
            username: user.username,
            branch: user.branch,
            year: user.year,
            token: token
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { signup, login };
