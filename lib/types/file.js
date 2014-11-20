/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function(Mongoose) {
    function File(path, options) {
        Mongoose.SchemaTypes.String.call(this, path, options);
        function validateFilePath (val) {
            return (typeof val == "string") || (val instanceof String);
        }

        this.validate(validateFilePath, "File path is invalid");
    }

    File.prototype.__proto__ = Mongoose.SchemaTypes.String.prototype;
    Mongoose.SchemaTypes.File = File;
    Mongoose.Types.File = String;
};

