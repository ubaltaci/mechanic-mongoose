/**
 *
 * Created by uur on 17/11/14.
 */

module.exports = function(Mongoose) {
    function Image(path, options) {
        Mongoose.SchemaTypes.String.call(this, path, options);
        function validateImagePath (val) {
            return (typeof val == "string") || (val instanceof String);
        }

        this.validate(validateImagePath, "Image path is invalid");
    }

    Image.prototype.__proto__ = Mongoose.SchemaTypes.String.prototype;
    Mongoose.SchemaTypes.Image = Image;
    Mongoose.Types.Image = String;
};

