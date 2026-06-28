const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ✅ FIXED IMPORT (Node 22 compatible)
const passportLocalMongoose =
  require("passport-local-mongoose").default ??
  require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  favorites: [
    {
      type: Schema.Types.ObjectId,
      ref: "listing",
    },
  ],
});

// ✅ THIS MUST RECEIVE A FUNCTION
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
