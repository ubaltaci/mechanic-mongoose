/**
 *
 * Created by uur on 17/11/14.
 */

var Promise = require("bluebird");
var Forklift = require("mechanic-forklift");

var images = [];
var thumbnailImages = [];
var files = [];

module.exports = function (schema, options) {

    var Mongoose = options.Mongoose;
    var s3 = options.s3;

    schema.pre("save", function (next) {

        var instance = this;
        images = [];
        thumbnailImages = [];
        files = [];

        var items = Object.keys(schema.tree);

        for (var i = 0; i < items.length; i++) {

            var item = items[i];

            // debug purposes
            if ((schema.tree[item].type == Mongoose.SchemaTypes.Image)) {
                // console.log("Schema.tree[item]:", schema.tree[item]);
                // console.log("Instance[item]:", instance[item]);
                // console.log("Instance.isModified(item):", instance.isModified(item));
            }

            if ((schema.tree[item].type == Mongoose.SchemaTypes.Image) && instance[item] && (instance[item] != "") && instance.isModified(item)) {
                if (instance[item].filename && instance[item].path) {

                    var extension;
                    try {
                        extension = instance[item]["headers"]["content-type"].split("/")[1];
                    }
                    catch (e) {
                        extension = "jpg";
                    }

                    images.push({
                        uploadFolder: item,
                        filepath: "images/" + item + "/" + instance._id + "_" + item + "_" + "-main-" + "." + extension,
                        instance: instance,
                        path: instance[item].path,
                        key: item,
                        size: schema.tree[item].size,
                        isThumbnailExist: !!schema.tree[item].thumbnail
                    });

                    if (schema.tree[item].thumbnail) {
                        thumbnailImages.push({
                            uploadFolder: item,
                            filepath: "images/" + item + "/" + instance._id + "_" + item + "_" + "-thumbnail-" + "." + extension,
                            instance: instance,
                            path: instance[item].path,
                            key: item,
                            size: schema.tree[item].thumbnail,
                            isThumbnailExist: false
                        });
                    }
                }
                // check whether URL exists already
                // https://s3-eu-west-1.amazonaws.com/bs-italy/ras/promotions/a6311e1a-f8ad-4c77-b210-7ead28985c27.png?1611153008513
                else if (typeof instance[item] === "string" && instance[item].match(/^http(s)?:\/\//)) {
                    // do nothing, image already exists
                }
                else {
                    console.error("Schema Field: Image should not be empty:(");
                    next("Image should not be empty :(")
                }
            }
            else if ((schema.tree[item].type == Mongoose.SchemaTypes.File) && instance[item] && (instance[item] != "") && instance.isModified(item)) {

                if (instance[item].filename && instance[item].path) {
                    files.push({
                        uploadFolder: item,
                        instance: instance,
                        key: item,
                        kind: schema.tree[item].kind,
                    });

                }
                // check whether URL exists already
                // https://s3-eu-west-1.amazonaws.com/bs-italy/ras/promotions/a6311e1a-f8ad-4c77-b210-7ead28985c27.png?1611153008513
                else if (typeof instance[item] === "string" && instance[item].match(/^http(s)?:\/\//)) {
                    // do nothing, file already exists
                }
                else {
                    console.error("Schema Field: File should not be empty:(");
                    next("File should not be empty :(")
                }
            }
            else if ((schema.tree[item] instanceof Array) && instance[item] && instance[item] != "" && instance[item][0]) {
                var subitems = Object.keys(schema.tree[item][0]);
                var subschemaTree = schema.tree[item][0];
                var subinstances = instance[item];

                for (var j = 0; j < subitems.length; j++) {
                    var subitem = subitems[j];
                    if (subschemaTree[subitem].type == Mongoose.SchemaTypes.Image) {
                        for (var k = 0; k < subinstances.length; k++) {
                            var subinstance = subinstances[k];
                            if (subinstance[subitem] && (subinstance[subitem] != "") && subinstance.isModified(subitem)) {
                                if (subinstance[subitem].filename && subinstance[subitem].path) {

                                    var extension;
                                    try {
                                        extension = subinstance[subitem]["headers"]["content-type"].split("/")[1];
                                    }
                                    catch (e) {
                                        extension = "jpg";
                                    }

                                    images.push({
                                        uploadFolder: subitem,
                                        filepath: "images/" + subitem + "/" + subinstance._id + "_" + subitem + "_" + "-main-" + "." + extension,
                                        instance: subinstance,
                                        path: subinstance[subitem].path,
                                        key: subitem,
                                        size: subschemaTree[subitem].size,
                                        isThumbnailExist: !!subschemaTree[subitem].thumbnail
                                    });
                                }
                            }
                            else if (subinstance[subitem] && (subinstance[subitem] != "") && subinstance.isModified(subitem)) {
                                if (subinstance[item].filename && subinstance[item].path) {
                                    files.push({
                                        uploadFolder: subitem,
                                        instance: subinstance,
                                        key: subitem,
                                        kind: subschemaTree[subitem].kind
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        Promise.all([
            _uploadImages(images, s3, "main"),
            _uploadFiles(files, s3)
        ]).then(function () {
            _uploadImages(thumbnailImages, s3, "thumbnail").then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        }).catch(function (err) {
            next(err);
        });
    });
};

function _uploadImages(images, s3, type) {

    return Promise.map(images, function (image) {

            var instance = image.instance;
            var key = image.key;

            return Forklift.liftImage(image.path, image.filepath, {
                size: {
                    width: image.size.width,
                    height: image.size.height,
                    resizeOption: image.size.resize
                },
                upload: s3,
                remove: !image.isThumbnailExist
            }).then(function (url) {
                if (type != "thumbnail") {
                    image.instance[image.key] = url + "?" + Date.now();
                }
            }).catch(function (err) {
                throw new Error("floppy.js + _uploadImages -> [" + image.key + "] ->\n " + err.message);
            });
        }
    )
        ;
}

function _uploadFiles(files, s3) {

    return Promise.map(files, function (file) {

        var instance = file.instance;
        var key = file.key;
        var extension;
        try {
            extension = instance[key]["filename"].split(".").pop();
        }
        catch (e) {
            extension = file.kind instanceof Array ? file.kind[0] : file.kind;
        }

        var file_path = "files/" + file.uploadFolder + "/" + file.instance.id + "_" + file.key + "." + extension;

        return Forklift.liftFile(file.instance[key].path, file_path, {
            upload: s3
        }).then(function (url) {
            file.instance[file.key] = url + "?" + Date.now();
        }).catch(function (err) {
            throw new Error("floppy.js + _uploadFiles -> [" + file.key + "] ->\n " + err.message);
        });
    });
}