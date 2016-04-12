/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

var Async = require("async");
var Slug = require("speakingurl");

module.exports = function (forklift, instance, files, callback) {

    Async.each(files, function (file, eachCallback) {

        var localFilePath = instance[file["schemaKey"]]["path"];
        var remoteFolder = "files/" + file["schemaKey"] + "/" + instance._id + "-" + Slug(file["name"]) + "." + file["ext"];

        forklift.upload(localFilePath, remoteFolder, function (error, url) {

            if (error) {
                return eachCallback(error);
            }

            instance[file["schemaKey"]] = url;
            return eachCallback();
        });
    }, callback);
};
//# sourceMappingURL=file_uploader.js.map