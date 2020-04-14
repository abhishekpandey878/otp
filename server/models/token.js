const mongoose = require('mongoose');


var TokenSchema = mongoose.Schema(
    {
        token: {
            type: String,
            required: false,
            minlength: 8
        },
        shop_url: {
            type: String,
            required: false,
            minlength:10
        },
        api_key: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            required: false,
        },
        active: {
            type: Boolean,
            default: true,
            required: true
        },
        store: {
            type: String,
            required: true,
            minlength:2
        },
        created_at: Date,
        updated_at: Date
    }
);


var Token = mongoose.model('Token', TokenSchema);

module.exports = {Token};