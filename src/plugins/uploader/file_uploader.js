/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");

module.exports = (forklift, instance, files, callback) => {

    Async.each(files, (file, eachCallback) => {

        const localFilePath = instance[file["schemaKey"]]["path"];
        const remoteFolder = `files/${file["schemaKey"]}/${instance._id}-${instance[file["schemaKey"]]["filename"]}`;

        forklift.upload(localFilePath, remoteFolder, (error, url) => {

            if (error) {
                return eachCallback(error);
            }
            instance[file["schemaKey"]] = url;
            return eachCallback();
        });

    }, callback);
};
