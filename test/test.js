const Path = require("path");
const Fse = require("fs-extra");

const Chai = require("chai");
const Mongoose = require("mongoose");

const Floppy = require("../");

const Expect = Chai.expect;
const Config = require("../config.json");
const TestSchema = require("../test/test_schema");

describe("Floppy", () => {

    // describe("Initialize", () => {
    //
    //     it("should throw error without arguments", () => {
    //
    //         Expect(() => {
    //             new Floppy();
    //         }).to.throw();
    //     });
    //
    //     it("should throw error without mongoose", () => {
    //
    //         Expect(() => {
    //             new Floppy({});
    //         }).to.throw();
    //     });
    //
    //     it("should throw error without s3 or filesystem", () => {
    //
    //         Expect(() => {
    //             new Floppy({mongoose: Mongoose});
    //         }).to.throw();
    //     });
    //
    //     it("should not throw error with mongoose & s3", () => {
    //
    //         Expect(() => {
    //             new Floppy({mongoose: Mongoose, s3: Config.s3});
    //         }).to.not.throw();
    //     });
    //
    //     it("should not throw error with mongoose & filesystem", () => {
    //
    //         Expect(() => {
    //             new Floppy({mongoose: Mongoose, filesystem: {path: "test", url: "test"}});
    //         }).to.not.throw();
    //     });
    //
    //     it("should throw error without valid plugins", () => {
    //
    //         Expect(() => {
    //             new Floppy({mongoose: Mongoose, s3: Config.s3}, ["attachmentx"]);
    //         }).to.throw();
    //     });
    //
    //     it("should not throw error with mongoose & s3 & valid plugins", () => {
    //
    //         Expect(() => {
    //             new Floppy({mongoose: Mongoose, s3: Config.s3}, ["attachment", "timestamp", "slug", "shortid"]);
    //         }).to.not.throw();
    //     });
    // });
    //
    // describe("Types", () => {
    //
    //     it("should register new types", () => {
    //
    //         // Create new mongoose instance
    //         const mongooseTest = new Mongoose.Mongoose();
    //         new Floppy({mongoose: mongooseTest, s3: Config.s3});
    //         const registeredTypeNames = Floppy.getAvailableTypes();
    //
    //         for (let typeName of registeredTypeNames) {
    //             Expect(mongooseTest.Schema.Types[typeName]).to.exist;
    //         }
    //     });
    // });

    describe("Plugins", () => {

        const connectionOptions = {
            keepAlive: true,
            connectTimeoutMS: 30000,
            useNewUrlParser: true,
            useCreateIndex: true
        };

        let floppy;
        let mongooseTest;
        let testSchema;

        describe("Timestamp plugin", () => {

            before("Connect to Database", async () => {

                floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
                mongooseTest = new Mongoose.Mongoose();
                await mongooseTest.connect(Config.mongoUrl, connectionOptions);
                testSchema = TestSchema(mongooseTest);
            });

            let testModel;

            it("should register timestamp plugin", () => {
                floppy.setPlugins(testSchema, ["timestamp"]);
                Expect(testSchema.tree).to.includes.keys(["createdAt", "updatedAt"]);
            });

            it("should correctly set createdAt and updatedAt", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);

                const testInstance = await testModel.create({test_title: "created"});
                Expect(testInstance).to.exist;
                Expect(testInstance.updatedAt).to.exist;
                Expect(testInstance.createdAt).to.exist;
                Expect(testInstance.createdAt).to.equal(testInstance.updatedAt);

                testInstance.test_title = "updated";
                await testInstance.save();
                // Since its update, updatedAt and createdAt should not be same.
                Expect(testInstance.createdAt).to.not.equal(testInstance.updatedAt);
            });

            after("Disconnect from Database", async () => {
                testSchema = null;
                floppy = null;
                await mongooseTest.connection.db.dropCollection("tests");
                await mongooseTest.disconnect();
            });
        });

        describe("ShortId plugin", () => {

            before("Connect to Database", async () => {

                floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
                mongooseTest = new Mongoose.Mongoose();
                await mongooseTest.connect(Config.mongoUrl, connectionOptions);
                testSchema = TestSchema(mongooseTest);
            });

            let testModel;

            it("should register _id with string type", () => {
                floppy.setPlugins(testSchema, ["shortid"]);
                Expect(testSchema.tree).to.includes.keys(["_id"]);
                Expect(testSchema.tree["_id"]["type"]).to.equal(mongooseTest.Schema.Types.String);
            });

            it("should create new item with _id with string type", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);
                const testInstance = await testModel.create({test_title: "created"});
                Expect(testInstance["_id"]).to.exist;
                Expect(testInstance["_id"]).to.be.a("string");
            });

            after("Disconnect from Database", async () => {
                testSchema = null;
                floppy = null;
                await mongooseTest.connection.db.dropCollection("tests");
                await mongooseTest.disconnect();
            });
        });

        describe("Slug plugin", () => {

            before("Connect to Database", async () => {

                floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
                mongooseTest = new Mongoose.Mongoose();
                await mongooseTest.connect(Config.mongoUrl, connectionOptions);
                testSchema = TestSchema(mongooseTest);
            });

            let testModel;

            it("should register slug plugin with slug ref", () => {
                floppy.setPlugins(testSchema, ["slug"]);
                Expect(testSchema.tree).to.includes.keys(["test_slug"]);
            });

            it("should correctly set test_slug", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);

                const testInstance = await testModel.create({test_title: "created for slug"});
                Expect(testInstance).to.exist;
                Expect(testInstance["test_slug"]).to.exist;
                Expect(testInstance["test_slug"]).to.equal("created-for-slug");

                // Clean up created instances
                await testModel.deleteMany();
            });

            it("should correctly set test_slug with same content in the update", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);

                const testInstance = await testModel.create({test_title: "created for slug"});
                Expect(testInstance["test_slug"]).to.equal("created-for-slug");
                testInstance.test_title = "created for slug";
                await testInstance.save();
                Expect(testInstance["test_slug"]).to.equal("created-for-slug");

                // Clean up created instances
                await testModel.deleteMany();
            });

            it("should correctly add ShortId to test_slug with same content on another document", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);

                await testModel.create({test_title: "created for slug"});
                const testInstance = await testModel.create({test_title: "created for slug"});
                Expect(testInstance["test_slug"]).to.exist;
                Expect(testInstance["test_slug"]).to.not.equal("created-for-slug");
                Expect(testInstance["test_slug"]).to.contains("created-for-slug");

                // Clean up created instances
                await testModel.deleteMany();
            });

            after("Disconnect from Database", async () => {
                testSchema = null;
                floppy = null;
                await mongooseTest.connection.db.dropCollection("tests");
                await mongooseTest.disconnect();
            });
        });

        describe("Attachment plugin with s3", () => {

            let testModel;

            before("Connect to Database", async () => {

                floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
                mongooseTest = new Mongoose.Mongoose();
                await mongooseTest.connect(Config.mongoUrl, connectionOptions);
                testSchema = TestSchema(mongooseTest);
            });

            it("should register attachment plugin", () => {
                floppy.setPlugins(testSchema, ["attachment"]);
            });

            it("should correctly upload image", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);

                Fse.copySync(Path.join(__dirname, "test_image.png"), Path.join(__dirname, "test_image_copy.png"));

                const testInstance = await testModel.create({
                    test_image: {
                        filename: "test_image_copy.png",
                        path: Path.join(__dirname, "test_image_copy.png")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_image).to.exist;
                Expect(testInstance.test_image.main).to.exist;
                Expect(testInstance.test_image.display2).to.exist;
                Expect(testInstance.test_image.display3).to.exist;
            });

            it("should correctly upload image with main_version", async () => {

                Fse.copySync(Path.join(__dirname, "test_image.png"), Path.join(__dirname, "test_image_copy.png"));

                const testInstance = await testModel.create({
                    test_image_2: {
                        filename: "test_image_copy.png",
                        path: Path.join(__dirname, "test_image_copy.png")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_image_2).to.exist;
                Expect(testInstance.test_image_2.main).to.exist;
            });

            it("should correctly upload file", async () => {

                Fse.copySync(Path.join(__dirname, "test_image.png"), Path.join(__dirname, "test_image_copy.png"));

                const testInstance = await testModel.create({
                    test_file: {
                        filename: "test_image_copy.png",
                        path: Path.join(__dirname, "test_image_copy.png")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_file).to.exist;
            });

            it("should correctly upload file with correct mime", async () => {

                Fse.copySync(Path.join(__dirname, "test_file.pdf"), Path.join(__dirname, "test_file_copy.pdf"));

                const testInstance = await testModel.create({
                    test_file_2: {
                        filename: "test_file_copy.pdf",
                        path: Path.join(__dirname, "test_file_copy.pdf")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_file_2).to.exist;
            });

            after("Disconnect from Database", async () => {

                testSchema = null;
                floppy = null;
                await mongooseTest.connection.db.dropCollection("tests");
                await mongooseTest.disconnect();
            });
        });

        describe("Attachment plugin with locale", () => {

            let testModel;

            before("Connect to Database", async () => {

                floppy = new Floppy({
                    mongoose: Mongoose,
                    filesystem: {
                        path: Path.join(__dirname, "assets"),
                        url: "/assets"
                    }
                });

                mongooseTest = new Mongoose.Mongoose();
                await mongooseTest.connect(Config.mongoUrl, connectionOptions);
                testSchema = TestSchema(mongooseTest);
            });

            it("should register attachment plugin", () => {
                floppy.setPlugins(testSchema, ["attachment"]);
            });

            it("should correctly upload file to local system", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);
                await Fse.copy(Path.join(__dirname, "test_image.png"), Path.join(__dirname, "test_image_copy.png"));

                const testInstance = await testModel.create({
                    test_file: {
                        filename: "test_image_copy.png",
                        path: Path.join(__dirname, "test_image_copy.png")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_file).to.exist;
            });

            it("should correctly upload image to local system", async () => {

                testModel = mongooseTest.models && mongooseTest.models["Test"] ? mongooseTest.models["Test"] : mongooseTest.model("Test", testSchema);
                await Fse.copy(Path.join(__dirname, "test_image.png"), Path.join(__dirname, "test_image_copy.png"));

                const testInstance = await testModel.create({
                    test_image: {
                        filename: "test_image_copy.png",
                        path: Path.join(__dirname, "test_image_copy.png")
                    }
                });

                Expect(testInstance).to.exist;
                Expect(testInstance.test_image).to.exist;
                Expect(testInstance.test_image.main).to.exist;
                Expect(testInstance.test_image.display2).to.exist;
                Expect(testInstance.test_image.display3).to.exist;
            });

            after("Disconnect from Database", async () => {

                testSchema = null;
                floppy = null;
                await Fse.remove(Path.join(__dirname, "assets"));
                await mongooseTest.connection.db.dropCollection("tests");
                await mongooseTest.disconnect();

                testSchema = null;
                floppy = null;
            });
        });
    });
});
