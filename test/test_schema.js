/**
 *
 *
 */

module.exports = (mongoose) => {

    return new mongoose.Schema({

        test_image: {
            type: mongoose.Schema.Types["Image"],
            versions: {
                main: {
                    size: "200x200",
                    resize: "^",
                    output: "jpeg",
                    quality: 80
                },
                display2: "960x",
                display3: "x960"
            }
        },

        test_image_2: {
            type: mongoose.Schema.Types["Image"],
            versions: "1920x1080"
        },

        test_file: {
            type: mongoose.Schema.Types["File"],
            extension: ["png"]
        },

        test_file_2: {
            type: mongoose.Schema.Types["File"],
            extension: ["pdf"]
        },

        test_title: {
            type: String,
            slug: "test_slug"
        }

    });
};


