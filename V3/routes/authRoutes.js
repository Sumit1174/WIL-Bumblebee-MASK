import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import Company from '../models/companyModel.js'; // Assuming this is your company model
import Payment from '../models/paymentModel.js'; // Assuming this is your payment model
import User from '../models/userModel.js';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '123456';

const authenticateJWT = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user details from token to request
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(403).json({ error: "Invalid or expired token" });
    }
};

router.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find({}, '_id companyName'); // Fetch only _id and companyName
        res.status(200).json(companies);
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ error: "Failed to fetch companies" });
    }
});
router.get('/users', authenticateJWT, async (req, res) => {
    console.log('Fetching users...');
    try {
        const users = await UserModel.find().select("username email role");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
// Route to change company password
router.post('/change-password', authenticateJWT, async (req, res) => {
    const { newPassword } = req.body;

    try {
        const company = await Company.findById(req.user.companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Hash the new password
        const hashedPassword = await argon2.hash(newPassword);

        // Update the company's password
        company.password = hashedPassword;
        await company.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});
// Route to get a specific company by companyId

router.get('/company/:companyId/payments', authenticateJWT, async (req, res) => {
    const { companyId } = req.params;

    // Check if the companyId is valid
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ error: 'Invalid company ID' });
    }

    try {
        const payments = await Payment.find({ companyId }).populate('companyId', 'companyName');
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Fetch current user details
router.get("/user", authenticateJWT, async (req, res) => {
    try {
        const { userId, role } = req.user;

        const user =
            role === "company"
                ? await Company.findById(userId).select("-password")
                : await User.findById(userId).select("-password");

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user); // Return user details as JSON
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ error: "Failed to fetch user details" });
    }
});

// Register a new user with role selection
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !role || !email || !password) {
        return res.status(400).json({ error: 'All fields are required for registration' });
    }

    try {
        const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await argon2.hash(password);

        const newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            role, // Role can be donor, receiver, or admin
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login a user with role-based redirection
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        let redirectTo;
        switch (user.role) {
            case 'donor':
                redirectTo = 'UserManagementDashboard.html';
                break;
            case 'receiver':
                redirectTo = 'ReceiverDashboard.html';
                break;
            case 'admin':
                redirectTo = 'AdminDashboard.html';
                break;
            default:
                return res.status(400).json({ error: 'Role-based redirection not configured for this role.' });
        }

        res.json({
            message: 'Login successful',
            redirectTo,
            token,
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Register company
router.post('/registerCompany', async (req, res) => {
    const { company_name, contact_name, email, password, interest } = req.body;

    if (!company_name || !contact_name || !email || !password || !interest) {
        return res.status(400).json({ error: 'All fields are required for registration' });
    }

    try {
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ error: 'Company already exists' });
        }

        const hashedPassword = await argon2.hash(password);

        const newCompany = new Company({
            companyName: company_name,
            contactName: contact_name,
            email,
            password: hashedPassword,
            interest,
        });

        await newCompany.save();
        res.status(201).json({ message: 'Company registered successfully' });
    } catch (error) {
        console.error('Error registering company:', error);
        res.status(500).json({ error: 'Failed to register company' });
    }
});
router.get('/payments/by-date/:date', async (req, res) => {
    const { date } = req.params;

    // Parse the date to match the format in the database (assuming payments are stored with a Date object)
    const startOfDay = new Date(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999); // Set to end of the selected day

    try {
        const payments = await Payment.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).populate('companyId', 'companyName'); // Populate company name if needed

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments by date:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Login company
// When logging in as a company
router.post('/loginCompany', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const company = await Company.findOne({ email });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const isPasswordValid = await argon2.verify(company.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Create a JWT token with the companyId
        const token = jwt.sign({ userId: company._id, role: 'company', companyId: company._id, email: company.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in company:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});


export default router;
