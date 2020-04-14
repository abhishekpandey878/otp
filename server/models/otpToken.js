const mongoose = require('mongoose');


var OtpTokenSchema = mongoose.Schema(
    {
        phone_number: {
            type: String,
            required: true,
            minlength: 8
        },
        code: {
            type: String,
            required: true,
            minlength: 3
        },
        session_id: {
            type: String,
            required: false,
            minlength: 3
        },
        shop_url: {
            type: String,
            required: false,
            minlength:2
        },
        verified: {
            type: Boolean,
            default: false,
            required: true
        },
        verified_in_seconds: {
            type: Number
        },
        store: {
            type: String,
            required: true,
            minlength:2
        },
        time_limit_exceeded: {
            type: Boolean,
            default: false,
            required: true
        },
        try_count: {
            type: Number,
            default: 0
        },
        try_count_details: [
            {
                created_at: {
                    type: Date,
                    default: Date.now
                },
                try_count: Number,
                code: String
            }
        ],
        created_at: Date,
        updated_at: Date
    }
);


var OtpToken = mongoose.model('OtpToken', OtpTokenSchema);

module.exports = {OtpToken};