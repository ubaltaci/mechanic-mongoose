/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function(Mongoose) {
    function File(path, options) {
        Mongoose.SchemaTypes.Mixed.call(this, path, options);
        function validateFile (val) {
            return val && val.filename && val.path;
        }

        this.validate(validateFile, "Uploaded file is invalid");
    }

    File.prototype.__proto__ = Mongoose.SchemaTypes.Mixed.prototype;
    Mongoose.SchemaTypes.File = File;
    Mongoose.Types.File = Mongoose.SchemaTypes.Mixed;
};

