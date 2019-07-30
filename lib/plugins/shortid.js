"use strict";

const ShortId = require("shortid");

module.exports = (schema, options) => {

    const mongoose = options.mongoose;

    schema.add({
        "_id": {
            type: mongoose.Schema.Types.String,
            "default": ShortId.generate
        }
    });
};
