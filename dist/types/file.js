"use strict";

/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function (Mongoose) {

    function File(path, options) {
        Mongoose.Schema.Types.Mixed.call(this, path, options);
        function validateFile(val) {
            return val && val.filename && val.path;
        }

        this.validate(validateFile, "Uploaded file is invalid");
    }

    File.prototype.__proto__ = Mongoose.Schema.Types.Mixed.prototype;
    Mongoose.Schema.Types.File = File;
    Mongoose.Types.File = Mongoose.Schema.Types.Mixed;
};
//# sourceMappingURL=file.js.map