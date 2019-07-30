/**
 * Timestamp
 * createdAt + updatedAt will be added automatically
 */

module.exports = (schema) => {

    // Mongoose supports timestamps now!
    // https://mongoosejs.com/docs/guide.html#timestamps
    schema.set("timestamps", true);
};
