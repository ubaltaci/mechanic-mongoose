/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Path = require("path");
const Async = require("async");
const Slug = require("speakingurl");
const Is = require("is_js");
const Fse = require("fs-extra");

module.exports = (instance, files, forklift, filesystem, callback) => {

    Async.each(files, (file, eachCallback) => {

        const localFilePath = instance[file["schemaKey"]]["path"];
        const uploadFolder = `files/${file["schemaKey"]}/${instance._id}-${Slug(file["name"])}.${file["ext"]}`;

        if (filesystem && filesystem.path && filesystem.url) { // locale path.

            return Fse.move(localFilePath, Path.join(filesystem.path, uploadFolder), (error) => {

                if (error) {
                    return eachCallback(error);
                }

                instance[file["schemaKey"]] = Path.join(filesystem.url, uploadFolder);
                return eachCallback();
            });
        }

        return forklift.upload(localFilePath, uploadFolder, {timestamp: true, ContentType: file["contentType"]}, (error, url) => {

            if (error) {
                return eachCallback(error);
            }

            instance[file["schemaKey"]] = url;
            return eachCallback();
        });

    }, callback);
};
