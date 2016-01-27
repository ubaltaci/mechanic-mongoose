const Path = require("path");
const Chai = require("chai");
const Mongoose = require("mongoose");

const Floppy = require("../");

const Expect = Chai.expect;
const Config = require("../config.json");
const TestSchema = require("../test/test_schema");

describe("Floppy", () => {

    describe("Initialize", () => {
        it("should throw error without arguments", () => {

            Expect(() => {
                new Floppy();
            }).to.throw("Mongoose is not exist or is not valid.");
        });

        it("should throw error without mongoose", () => {

            Expect(() => {
                new Floppy({});
            }).to.throw("Mongoose is not exist or is not valid.");
        });

        it("should throw error without s3", () => {

            Expect(() => {
                new Floppy({mongoose: Mongoose});
            }).to.throw("S3 should be passed to Floppy constructor");
        });

        it("should not throw error with mongoose & s3", () => {

            Expect(() => {
                new Floppy({mongoose: Mongoose, s3: Config.s3});
            }).to.not.throw();
        });

        it("should throw error without valid plugins", () => {

            Expect(() => {
                new Floppy({mongoose: Mongoose, s3: Config.s3}, ["attachmentx"]);
            }).to.throw();
        });

        it("should not throw error with mongoose & s3 & valid plugins", () => {

            Expect(() => {
                new Floppy({mongoose: Mongoose, s3: Config.s3}, ["attachment", "timestamp", "slug", "shortid"]);
            }).to.not.throw();
        });
    });

    describe("Types", () => {
        it("should register new types", () => {

            // Create new mongoose instance
            const mongooseTest = new Mongoose.Mongoose();
            new Floppy({mongoose: mongooseTest, s3: Config.s3});
            const registeredTypeNames = Floppy.getAvailableTypes();

            for (let typeName of registeredTypeNames) {
                Expect(mongooseTest.Schema.Types[typeName]).to.exist;
            }
        });
    });

    describe("Plugins", () => {

        const connectionOptions = {
            server: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}},
            replset: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
        };
        let floppy;
        let mongooseTest;
        let testSchema;

        /*
         describe("Timestamp plugin", () => {

         before("Connect to Database", (done) => {
         floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
         mongooseTest = new Mongoose.Mongoose();
         mongooseTest.connect(Config.mongourl, connectionOptions);
         mongooseTest.connection.on("error", (error) => {
         return done(error);
         });

         mongooseTest.connection.once("open", () => {
         testSchema = TestSchema(mongooseTest);
         return done();
         });
         });

         let testModel;

         it("should register timestamp plugin", () => {
         floppy.setPlugins(testSchema, ["timestamp"]);
         Expect(testSchema.tree).to.includes.keys(["createdAt", "updatedAt"]);
         });

         it("should correctly set createdAt and updatedAt", (done) => {
         testModel = mongooseTest.model("Test", testSchema);
         testModel.create({test_title: "created"}, (error, testInstance) => {
         Expect(error).to.not.exist;
         Expect(testInstance).to.exist;
         Expect(testInstance.updatedAt).to.exist;
         Expect(testInstance.createdAt).to.exist;

         // Since its create, updatedAt and createdAt should be same.
         Expect(testInstance.createdAt).to.equal(testInstance.updatedAt);

         setTimeout(() => {

         testInstance.test_title = "updated";
         testInstance.save((error) => {

         Expect(error).to.not.exist;
         // Since its update, updatedAt and createdAt should not be same.
         Expect(testInstance.createdAt).to.not.equal(testInstance.updatedAt);
         done();
         });
         }, 2000);

         });
         });

         after("Disconnect from Database", (done) => {
         testSchema = null;
         floppy = null;
         mongooseTest.connection.db.dropCollection("tests", function (error) {
         if (error) {
         return done(error);
         }
         mongooseTest.disconnect();
         done();
         });
         });
         });

         describe("ShortId plugin", () => {

         before("Connect to Database", (done) => {

         floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
         mongooseTest = new Mongoose.Mongoose();
         mongooseTest.connect(Config.mongourl, connectionOptions);
         mongooseTest.connection.on("error", (error) => {
         return done(error);
         });

         mongooseTest.connection.once("open", () => {
         testSchema = TestSchema(mongooseTest);
         return done();
         });
         });

         let testModel;

         it("should register _id with string type", () => {
         floppy.setPlugins(testSchema, ["timestamp", "slug", "shortid"]);
         Expect(testSchema.tree).to.includes.keys(["_id"]);
         Expect(testSchema.tree["_id"]["type"]).to.equal(mongooseTest.Schema.Types.String)
         });

         it("should create new item with _id with string type", (done) => {

         testModel = mongooseTest.model("Test", testSchema);

         testModel.create({test_title: "created"}, (error, instance) => {
         Expect(instance["_id"]).to.exist;
         Expect(instance["_id"]).to.be.a("string");
         done();
         });
         });

         after("Disconnect from Database", (done) => {
         testSchema = null;
         floppy = null;
         mongooseTest.connection.db.dropCollection("tests", function (error) {
         if (error) {
         return done(error);
         }
         mongooseTest.disconnect();
         done();
         });
         });
         });

         describe("Slug plugin", () => {

         before("Connect to Database", (done) => {
         floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
         mongooseTest = new Mongoose.Mongoose();
         mongooseTest.connect(Config.mongourl, connectionOptions);
         mongooseTest.connection.on("error", (error) => {
         return done(error);
         });

         mongooseTest.connection.once("open", () => {
         testSchema = TestSchema(mongooseTest);
         return done();
         });
         });

         let testModel;
         let testInstance;

         it("should register slug plugin with slug ref", () => {
         floppy.setPlugins(testSchema, ["timestamp", "slug"]);
         Expect(testSchema.tree).to.includes.keys(["test_slug"]);
         });

         it("should correctly set test_slug", (done) => {

         testModel = mongooseTest.model("Test", testSchema);

         testModel.create({test_title: "created"}, (error, instance) => {
         Expect(error).to.not.exist;
         Expect(instance).to.exist;
         Expect(instance["test_slug"]).to.exist;
         Expect(instance["test_slug"]).to.equal("created");
         testInstance = instance;
         done();

         });
         });

         it("should correctly set test_slug with same content", (done) => {

         testModel = mongooseTest.model("Test", testSchema);

         testInstance.test_title = "created";
         testInstance.save((error) => {
         Expect(error).to.not.exist;
         Expect(testInstance).to.exist;
         Expect(testInstance["test_slug"]).to.exist;
         Expect(testInstance["test_slug"]).to.equal("created");
         done();

         });
         });

         it("should correctly set test_slug with same content on another document", (done) => {

         testModel = mongooseTest.model("Test", testSchema);

         testModel.create({test_title: "created"}, (error, instance) => {
         Expect(error).to.not.exist;
         Expect(instance).to.exist;
         Expect(instance["test_slug"]).to.exist;
         Expect(instance["test_slug"]).to.not.equal("created");
         Expect(instance["test_slug"]).to.contains("created");
         testInstance = instance;
         done();

         });
         });

         after("Disconnect from Database", (done) => {
         testSchema = null;
         floppy = null;
         mongooseTest.connection.db.dropCollection("tests", function (error) {
         if (error) {
         return done(error);
         }
         mongooseTest.disconnect();
         done();
         });
         });
         });
         */

        describe("Attachment plugin", () => {

            let testModel;

            before("Connect to Database", (done) => {
                floppy = new Floppy({mongoose: Mongoose, s3: Config.s3});
                mongooseTest = new Mongoose.Mongoose();
                mongooseTest.connect(Config.mongourl, connectionOptions);
                mongooseTest.connection.on("error", (error) => {
                    return done(error);
                });

                mongooseTest.connection.once("open", () => {
                    testSchema = TestSchema(mongooseTest);
                    testModel = mongooseTest.model("Test", testSchema);
                    floppy.setPlugins(testSchema, ["attachment"]);
                    return done();
                });
            });

            it("should correctly upload image", (done) => {

                testModel.create({
                    test_image: {
                        filename: "test_image.png",
                        path: Path.join(__dirname, "test_image.png")
                    }
                }, (error, instance) => {
                    
                    Expect(error).to.not.exist;
                    Expect(instance).to.exist;
                    Expect(instance.test_image).to.exist;
                    Expect(instance.test_image.main).to.exist;
                    Expect(instance.test_image.display2).to.exist;
                    Expect(instance.test_image.display3).to.exist;

                    return done();
                });
            });

            it("should correctly upload image with main_version", (done) => {

                testModel.create({
                    test_image_2: {
                        filename: "test_image.png",
                        path: Path.join(__dirname, "test_image.png")
                    }
                }, (error, instance) => {

                    Expect(error).to.not.exist;
                    Expect(instance).to.exist;
                    Expect(instance.test_image_2).to.exist;
                    Expect(instance.test_image_2.main).to.exist;
                    return done();
                });
            });

            it("should correctly upload file", (done) => {
                testModel.create({
                    test_file: {
                        filename: "test_image.png",
                        path: Path.join(__dirname, "test_image.png")
                    }
                }, (error, instance) => {

                    Expect(error).to.not.exist;
                    Expect(instance).to.exist;
                    Expect(instance.test_file).to.exist;
                    return done();
                });
            });

            after("Disconnect from Database", (done) => {
                testSchema = null;
                floppy = null;
                mongooseTest.connection.db.dropCollection("tests", function (error) {
                    mongooseTest.disconnect();
                    done();
                });
            });
        });

    });
});