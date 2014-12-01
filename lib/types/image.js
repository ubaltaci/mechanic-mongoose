/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function(Mongoose) {
    function Image(path, options) {
        Mongoose.SchemaTypes.Mixed.call(this, path, options);
        function validateImage (val) {
            return val && val.filename && val.path;
        }

        this.validate(validateImage, "Uploaded image is not valid");
    }

    Image.prototype.__proto__ = Mongoose.SchemaTypes.Mixed.prototype;
    Mongoose.SchemaTypes.Image = Image;
    Mongoose.Types.Image = Mongoose.SchemaTypes.Mixed;
};

