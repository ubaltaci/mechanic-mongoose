/**
 *
 * Created by uur on 27/11/14.
 */

var ShortId = require("shortid");

module.exports = function (schema) {
    schema.add({
        "_id": {
            type: String,
            unique: true,
            default: ShortId.generate
        }
    });
};
