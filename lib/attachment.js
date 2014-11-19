/**
 *
 * Created by uur on 17/11/14.
 */

var Promise = require("bluebird");
var Forklift = require("mechanic-forklift");

module.exports = function(schema, options) {

    var Mongoose = options.Mongoose;
    var s3 = options.s3;

    schema.pre("save", function (next) {

        var instance = this;
        var images = [];

        var items = Object.keys(schema.tree);

        items.forEach(function (item) {
            if ((schema.tree[item].type == Mongoose.SchemaTypes.Image) && instance[item] && (instance[item] != "") && instance.isModified(item)) {
                images.push({
                    uploadFolder: item,
                    instance: instance,
                    key: item,
                    size: schema.tree[item].size
                });
            }
            else if ((schema.tree[item] instanceof Array) && instance[item][0]) {
                var subitems = Object.keys(schema.tree[item][0]);
                var subschemaTree = schema.tree[item][0];
                var subinstances = instance[item];
                subitems.forEach(function (subitem) {
                    if (subschemaTree[subitem].type == Mongoose.SchemaTypes.Image) {
                        subinstances.forEach(function (subinstance) {
                            if (subinstance[subitem] && (subinstance[subitem] != "") && subinstance.isModified(subitem)) {
                                images.push({
                                    uploadFolder: subitem,
                                    instance: subinstance,
                                    key: subitem,
                                    size: subschemaTree[subitem].size
                                });
                            }
                        });
                    }
                });
            }
        });

        _uploadImages(images, s3).then(function () {
            next();
        }).catch(function (err) {
            next(err);
        });
    });
};

function _uploadImages(images, s3) {

    return Promise.map(images, function (image) {
        var file_path = "images/" + image.uploadFolder + "/" + image.instance.id + "_" + image.key + ".jpg?" + Date.now();
        return Forklift.liftImage(image.instance[image.key], file_path, {
            size: {
                width: image.size.width,
                height: image.size.height,
                resizeOption: image.size.resize

            },
            upload: {
                secret: s3.secret_access,
                key: s3.access,
                bucket: s3.bucket_name
            }
        }).then(function (url) {
            image.instance[image.key] = url;
        }).catch(function (err) {
            throw new Error("floppy.js + uploadImages" + err);
        });
    });
}
