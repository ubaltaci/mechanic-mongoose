"use strict";

var ShortId = require("shortid");

module.exports = function (schema, options) {

    var mongoose = options.mongoose;

    schema.add({
        "_id": {
            type: mongoose.Schema.Types.String,
            unique: true,
            "default": ShortId.generate
        }
    });
};
//# sourceMappingURL=shortid.js.map