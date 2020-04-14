const mongoose = require('mongoose');


var UserSchema = mongoose.Schema(
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
        created_at: Date,
        updated_at: Date
    }
);


var User = mongoose.model('User', UserSchema);

module.exports = {User};