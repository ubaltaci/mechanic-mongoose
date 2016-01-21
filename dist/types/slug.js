"use strict";

/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function (Mongoose) {

    function Slug(path, options) {
        Mongoose.Schema.Types.String.call(this, path, options);
    }

    Slug.prototype.__proto__ = Mongoose.Schema.Types.String.prototype;
    Mongoose.Schema.Types.Slug = Slug;
    Mongoose.Types.Slug = Mongoose.Schema.Types.String;
};
//# sourceMappingURL=slug.js.map