import express from 'express';
import jwt from 'jsonwebtoken';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
import Company from '../models/companyModel.js';

const router = express.Router();

// Middleware to extract user from token
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user details to the request object
        console.log(req.user); // Debug: Check the decoded JWT object
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Route to create a payment
router.post('/create', authenticateJWT, async (req, res) => {
    const { amount, companyId, paymentMethod, reference } = req.body;

    if (!amount || !companyId || !paymentMethod || !reference) {
        return res.status(400).json({ error: "Amount, companyId, paymentMethod, and reference are required" });
    }

    const userEmail = req.user.email; // Correctly access the email from the decoded JWT

    if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
    }

    try {
        const payment = new Payment({
            amount,
            companyId,
            paymentMethod,
            reference,
            status: "Complete",
            date: new Date(),
            userEmail, // Store the email associated with the payment
        });

        await payment.save();
        res.status(201).json({ message: "Payment created successfully", payment });
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: "Failed to create payment" });
    }
});

// Route to get all payments with company details populated
router.get('/payments', async (req, res) => {
    try {
        const payments = await Payment.find().populate('companyId', 'companyName'); // Populate companyId with companyName
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Route to get payments by a specific user with company details populated
router.get('/user-payments', authenticateJWT, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const payments = await Payment.find({ userEmail: user.email }).populate('companyId', 'companyName'); // Populate companyId with companyName
        res.json(payments);
    } catch (error) {
        console.error('Error fetching user payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Route to get payments for a specific company with details populated
router.get('/company-payments/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const payments = await Payment.find({ companyId }).populate('companyId', 'companyName'); // Populate companyId with companyName
        res.json(payments);
    } catch (error) {
        console.error('Error fetching company payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

export default router;
