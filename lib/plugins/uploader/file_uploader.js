/**
 * File Uploader
 */

const Path = require("path");
const UUID = require("uuid/v4");
const Fse = require("fs-extra");

module.exports = class FileUploader {

    constructor({modelName, forklift, filesystem}) {

        this.modelName = modelName;
        this.isFileSystem = filesystem && filesystem.path && filesystem.url;
        this.filesystem = filesystem;
        this.forklift = forklift;
    }

    async uploadFiles(instance, files) {

        for (const file of files) {

            const fieldName = file["schemaKey"];
            const localFilePath = instance[fieldName]["path"];
            const remotePath = `files/${this.modelName.toLowerCase()}/${fieldName}/${UUID()}.${file["ext"]}`;

            let uploadedFile = "";

            if (this.isFileSystem) {

                await Fse.move(localFilePath, Path.join(this.filesystem.path, remotePath), {overwrite: true});
                uploadedFile = Path.join(this.filesystem.url, remotePath);
            }
            else {

                const options = {
                    timestamp: false,
                };

                if (file["contentType"]) {
                    options["ContentType"] = file["contentType"];
                }

                uploadedFile = await this.forklift.upload({
                    source: localFilePath,
                    remotePath,
                    options
                });
            }

            // eslint-disable-next-line
            instance[fieldName] = `${uploadedFile}?${Date.now()}`;
        }
    }
};
