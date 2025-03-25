const express = require('express');
const app = express();

app.use(express.json());

// In-memory storage for reviews (replace with database in production)
const reviews = new Map();

app.get('/api/reviews', (req, res) => {
    const { placeId } = req.query;
    const placeReviews = reviews.get(placeId) || [];
    res.json(placeReviews);
});

app.post('/api/reviews', (req, res) => {
    const review = req.body;
    const placeReviews = reviews.get(review.placeId) || [];
    placeReviews.push(review);
    reviews.set(review.placeId, placeReviews);
    res.json(review);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
