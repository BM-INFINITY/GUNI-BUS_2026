const mongoose = require('mongoose');

const lostFoundCommentSchema = new mongoose.Schema({
    // Which item does this comment belong to? (LostReport or LostFoundItem)
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // We use dynamic refs because a comment can be on either a LostReport or a Found Item
        refPath: 'itemModel'
    },
    itemModel: {
        type: String,
        required: true,
        enum: ['LostReport', 'LostFoundItem']
    },

    // Who wrote this comment?
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The actual message
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }

}, { timestamps: true });

// Optimise for fetching thread by item
lostFoundCommentSchema.index({ itemId: 1, itemModel: 1, createdAt: 1 });

module.exports = mongoose.model('LostFoundComment', lostFoundCommentSchema);
