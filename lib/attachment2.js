/**
 *
 * Created by uur on 17/11/14.
 */

const Forklift = require("s3-forklift");
const Sharp = require("sharp");

var Promise = require("bluebird");
var Forklift = require("mechanic-forklift");

var images = [];
var thumbnailImages = [];
var files = [];

module.exports = (schema, mongoose, s3) => {


    const Mongoose = options.Mongoose;
    var s3 = options.s3;

    schema.pre("save", function (next) {

        var instance = this;
        images = [];
        thumbnailImages = [];
        files = [];

        var items = Object.keys(schema.tree);

        for (var i = 0; i < items.length; i++) {

            var item = items[i];

            if ((schema.tree[item].type == Mongoose.Schema.Types.Image) && instance[item] && (instance[item] != "") && instance.isModified(item)) {
                if (instance[item].filename && instance[item].path) {

                    var extension;
                    try {
                        extension = instance[item]["headers"]["content-type"].split("/")[1];
                    }
                    catch (e) {
                        console.log("Mechanic-Mongoose error ->");
                        console.log(e);
                        extension = "jpg";
                    }
                    var now = Date.now();

                    images.push({
                        uploadFolder: item,
                        filepath: "images/" + item + "/" + instance._id + "_" + item + "_" + "-main-" + "." + extension + "?" + now,
                        instance: instance,
                        path: instance[item].path,
                        key: item,
                        size: schema.tree[item].size,
                        isThumbnailExist: !!schema.tree[item].thumbnail
                    });

                    if (schema.tree[item].thumbnail) {
                        thumbnailImages.push({
                            uploadFolder: item,
                            filepath: "images/" + item + "/" + instance._id + "_" + item + "_" + "-thumbnail-" + "." + extension + "?" + now,
                            instance: instance,
                            path: instance[item].path,
                            key: item,
                            size: schema.tree[item].thumbnail,
                            isThumbnailExist: false
                        });
                    }
                }
                else {
                    next("Something go wrong :(");
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
                else {
                    next("Something go wrong :(");
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
                                if (subinstance[item].filename && subinstance[item].path) {
                                    images.push({
                                        uploadFolder: subitem,
                                        instance: subinstance,
                                        key: subitem,
                                        size: subschemaTree[subitem].size
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
                    image.instance[image.key] = url;
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

        var file_path = "files/" + file.uploadFolder + "/" + file.instance.id + "_" + file.key + "." + extension + "?" + Date.now();

        return Forklift.liftFile(file.instance[key].path, file_path, {
            upload: s3
        }).then(function (url) {
            file.instance[file.key] = url;
        }).catch(function (err) {
            throw new Error("floppy.js + _uploadFiles -> [" + file.key + "] ->\n " + err.message);
        });
    });
}