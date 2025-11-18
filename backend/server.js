const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Import Models ---
const Farmer = require('./models/Farmer');
const Product = require('./models/Product');
const Tip = require('./models/Tip'); 

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- (Database Seeder Function - unchanged) ---
const seedDatabase = async () => {
    try {
        const productCount = await Product.countDocuments();
        if (productCount > 0) {
            return;
        }
        const sampleProducts = []; // (Add your sample products here if needed)
        await Product.insertMany(sampleProducts);
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    // seedDatabase();
})
.catch(err => console.error('🔥 MongoDB connection error:', err));


// --- Admin Security Check Middleware ---
const checkAdminAuth = (req, res, next) => {
    const password = req.headers.authorization;
    if (password && password === process.env.ADMIN_PASSWORD) {
        next(); 
    } else {
        res.status(401).json({ message: 'Not Authorized' });
    }
};

// --- API Endpoints ---

// [POST] /api/submit-form (Public)
app.post('/api/submit-form', async (req, res) => {
    try {
        const newFarmer = new Farmer(req.body);
        await newFarmer.save(); 
        
        // SMS Logic removed successfully

        res.status(201).json({ 
            message: 'Form submitted successfully!',
            phone: newFarmer.phone 
        });
    } catch (dbError) {
        console.error('Error saving data:', dbError);
        res.status(500).json({ message: 'Error submitting form' });
    }
});

// [GET] /api/products (Public)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// --- Admin Login Endpoint ---
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password && password === process.env.ADMIN_PASSWORD) {
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid Password' });
    }
});

// --- Get Farmer List (SECURED) ---
app.get('/api/farmers', checkAdminAuth, async (req, res) => {
    try {
        const farmers = await Farmer.find({}).sort({ createdAt: -1 }); 
        res.json(farmers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching farmers' });
    }
});

// --- Add Product (SECURED) ---
app.post('/api/add-product', checkAdminAuth, async (req, res) => {
    try {
        const { name, imageUrl, details, originalPrice, discountPercent, category } = req.body;
        if (!name || !imageUrl || !originalPrice || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const newProduct = new Product({
            name, imageUrl, details, originalPrice, discountPercent, category
        });
        await newProduct.save();
        res.status(201).json({ 
            message: 'Product added successfully!',
            product: newProduct 
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product' });
    }
});

// --- Update a Product (SECURED) ---
app.put('/api/products/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params; 
        const updatedData = req.body; 

        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updatedData, 
            { new: true, runValidators: true } 
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({
            message: 'Product updated successfully!',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// --- Delete a Product (SECURED) ---
app.delete('/api/products/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params; 
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({
            message: 'Product deleted successfully!',
            productId: id
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// ===================================
// --- Aqua Tips API Endpoints ---
// ===================================

// [GET] /api/tips (Public)
app.get('/api/tips', async (req, res) => {
    try {
        const tips = await Tip.find({}).sort({ createdAt: -1 });
        res.json(tips);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tips' });
    }
});

// [PUT] /api/tips/like/:id (Public)
app.put('/api/tips/like/:id', async (req, res) => {
    try {
        const tip = await Tip.findById(req.params.id);
        if (!tip) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        tip.likes += 1; 
        await tip.save();
        res.status(200).json(tip);
    } catch (error) {
        res.status(500).json({ message: 'Error liking tip' });
    }
});

// [POST] /api/tips/comment/:id (Public)
app.post('/api/tips/comment/:id', async (req, res) => {
    try {
        const tip = await Tip.findById(req.params.id);
        if (!tip) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        const { name, comment } = req.body;
        if (!name || !comment) {
            return res.status(400).json({ message: 'Name and comment are required' });
        }
        const newComment = {
            name,
            comment,
            date: new Date()
        };
        tip.comments.push(newComment); 
        await tip.save();
        res.status(201).json(tip);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
});

// [POST] /api/tips (Admin - SECURED)
app.post('/api/tips', checkAdminAuth, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const newTip = new Tip({
            title,
            content,
            imageUrl: imageUrl || ''
        });
        const savedTip = await newTip.save();
        res.status(201).json(savedTip);
    } catch (error) {
        res.status(500).json({ message: 'Error creating tip' });
    }
});

// [PUT] /api/tips/:id (Admin - SECURED)
app.put('/api/tips/:id', checkAdminAuth, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        const updatedTip = await Tip.findByIdAndUpdate(
            req.params.id,
            { title, content, imageUrl },
            { new: true, runValidators: true }
        );
        if (!updatedTip) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        res.status(200).json(updatedTip);
    } catch (error) {
        res.status(500).json({ message: 'Error updating tip' });
    }
});

// [DELETE] /api/tips/:id (Admin - SECURED)
app.delete('/api/tips/:id', checkAdminAuth, async (req, res) => {
    try {
        const deletedTip = await Tip.findByIdAndDelete(req.params.id);
        if (!deletedTip) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        res.status(200).json({ message: 'Tip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting tip' });
    }
});

// --- NEW: Reply to Comment (Admin - SECURED) ---
// (This was missing in your paste!)
app.put('/api/tips/:tipId/comment/:commentId', checkAdminAuth, async (req, res) => {
    try {
        const { tipId, commentId } = req.params;
        const { replyText } = req.body;

        const tip = await Tip.findById(tipId);
        if (!tip) {
            return res.status(404).json({ message: 'Tip not found' });
        }

        const comment = tip.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.adminReply = replyText;
        
        await tip.save(); 
        res.status(200).json(tip); 
    } catch (error) {
        console.error('Error replying to comment:', error);
        res.status(500).json({ message: 'Error replying to comment' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
