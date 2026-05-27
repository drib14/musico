const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create Paymongo Checkout Session
// @route   POST /api/billing/checkout
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    // Dynamic Secret Key selector (detects keys starting with 'sk_' to resolve swapped env labels)
    const secretKey = (process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_SECRET_KEY.startsWith('sk_'))
      ? process.env.PAYMONGO_SECRET_KEY
      : process.env.PAYMONGO_PUBLIC_KEY;

    if (!secretKey) {
      return res.status(500).json({ message: 'Paymongo configuration error: Secret key missing' });
    }

    // Basic auth header for Paymongo (Secret Key is username, password is empty)
    const base64Key = Buffer.from(secretKey + ':').toString('base64');
    
    // Create checkout session body
    const body = {
      data: {
        attributes: {
          billing: {
            name: req.user.name,
            email: req.user.email,
          },
          line_items: [
            {
              amount: 25000, // PHP 250.00 (approx $4.99 USD)
              currency: 'PHP',
              name: 'Musico Premium Subscription',
              quantity: 1,
              description: 'Unlock unlimited high-fidelity music uploads and ad-free listening'
            }
          ],
          payment_method_types: ['card', 'gcash', 'paymaya'],
          success_url: 'http://localhost:5173/billing?session=success',
          cancel_url: 'http://localhost:5173/billing?session=cancel',
          description: 'Musico Premium tier activation checkout'
        }
      }
    };

    console.log('Sending session request to Paymongo API...');
    const response = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      body,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${base64Key}`,
        }
      }
    );

    const checkoutUrl = response.data.data.attributes.checkout_url;
    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Paymongo Session Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      message: 'Failed to initiate Paymongo checkout',
      error: error.response ? error.response.data : error.message 
    });
  }
});

// @desc    Upgrade active user profile (Invoked automatically on payment success)
// @route   POST /api/billing/upgrade
// @access  Private
router.post('/upgrade', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = true;
    await user.save();

    // Generate random reference code if not provided
    const reference = req.body.reference || 'PAYM-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Record billing transaction receipt
    await Transaction.create({
      user: user._id,
      amount: 250,
      currency: 'PHP',
      status: 'completed',
      reference
    });

    res.json({
      message: 'Congratulations! You are now a Musico Premium member.',
      isPremium: user.isPremium,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error upgrading user' });
  }
});

// @desc    Get user billing transaction history
// @route   GET /api/billing/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving transaction logs' });
  }
});

module.exports = router;
