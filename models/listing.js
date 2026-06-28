
const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String
       
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },


    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: ["trending", "rooms", "iconic cities", "castles", "pools", "camping", "farms", "arctic", "domes", "boats"],
    },
    review:[
        {
            type: Schema.Types.ObjectId,
            ref: "review",
        },
    ],

    owner: {
       type: Schema.Types.ObjectId,
       ref: "User",
    },
});

listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing){
        await Review.deleteMany({_id: {$in: listing.review}});
    }
});

const listing = mongoose.model("listing", listingSchema);
module.exports = listing;