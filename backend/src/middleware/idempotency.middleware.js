function validateIdempotencyKey(req, res, next) {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
        return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }
    req.idempotencyKey = idempotencyKey;
    next();
}   

module.exports = {
    validateIdempotencyKey
};