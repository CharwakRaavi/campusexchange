const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    email: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    branch: { 
        type: String, 
        required: true,
        lowercase: true,
        enum: ['cse', 'ece', 'it', 'aiml', 'aids', 'cic', 'csd', 'csit', 'mech', 'civil', 'eee']
    },
    year: { 
        type: String, 
        required: true,
        enum: ['1/4', '2/4', '3/4', '4/4']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
