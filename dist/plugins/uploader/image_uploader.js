/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

var Async = require("async");

module.exports = function (forklift, files, callback) {

    Async.map(files, function (file, eachCallback) {

        var instance = file.instance;
        var key = file.key;

        var extension = undefined;
        try {
            extension = instance[key]["filename"].split(".").pop();
        } catch (e) {
            extension = file.kind instanceof Array ? file.kind[0] : file.kind;
        }

        var s3_path = "files/" + file.uploadFolder + "/" + file.instance.id + "_" + file.key + "." + extension + "?" + Date.now();

        forklift.upload(file.instance[key].path, s3_path, { remove: true }, eachCallback);
    }, callback);
};
//# sourceMappingURL=image_uploader.js.map