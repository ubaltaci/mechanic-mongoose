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
                            mongooseTest.connection.db.dropCollection("tests", function (error) {
                                if (error) {
                                    return done(error);
                                }
                                done();
                            });
                        });
                    }, 2000);

                });
            });

            after("Disconnect from Database", () => {
                testSchema = null;
                floppy = null;
                mongooseTest.disconnect();
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

            after("Disconnect from Database", () => {
                testSchema = null;
                floppy = null;
                mongooseTest.disconnect();
            });
        });

    });
});