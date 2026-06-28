if(process.env.NODE_ENV != "production"){
require("dotenv").config();
}
console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
//const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/review.js");
const session = require("express-session");
const Booking = require("./models/booking.js");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn, isOwner, validateReview, isReviewAuthor, validateBooking, isBookingOwner} = require("./middleware.js");
const { saveRedirectUrl } = require("./middleware.js"); 

const multer = require('multer');
const {storage} = require("./cloudConfig.js");
const upload = multer({ storage });


//connect with database

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connect to DB");
    }) 
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

// //connection (exports) model from listing.js
// //Testing
// app.get("/testlisting", async(req, res) => {
//     let sampleListing = new listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing"); 
// });



//Simple route to test server. Visiting http://localhost:8080/ shows a message.
// app.get("/", (req,res) => {
//     res.send("Hi, i am root")
// });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

//cookie
const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
    expires: Date.now() + 7 *24 * 60 * 60 * 1000,
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
},
};
app.use(session(sessionOptions));

//Flash Success Message
app.use(flash());

//password Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// create fake user
// app.get("/demouser", async(req,res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student",
//     });
//     let registerUser = await User.register(fakeUser, "Helloworld");
//     res.send(registerUser);
// });

//Index Route
app.get("/listings", async (req, res) => {
    let { search, category } = req.query;
    let filter = {};

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } },
        ];
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index", { allListings, search, category });
});

//New Route
app.get("/listings/new", isLoggedIn,  (req, res) => {
    res.render("listings/new.ejs");
});

//Show Route
//Show Route
app.get("/listings/:id", async(req,res) => {
    
    let { id } = req.params;
    const listingData = await Listing.findById(id)
    .populate({
        path: "review",
        populate: {
        path: "author",
        },
    })
    .populate("owner");
    if(!listingData){
        req.flash("error","Listing you requested for does not exits!"); //can't access deleted post from URL
       return res.redirect("/listings");
    }

    let isFavorited = false;
    if (req.user) {
        isFavorited = req.user.favorites.some((favId) => favId.equals(id));
    }

    res.render("listings/show.ejs", {listing: listingData, isFavorited});
});

//Toggle Wishlist Route
app.post("/listings/:id/favorite", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    let user = await User.findById(req.user._id);

    if (user.favorites.some((favId) => favId.equals(id))) {
        user.favorites.pull(id);
        req.flash("success", "Removed from wishlist!");
    } else {
        user.favorites.push(id);
        req.flash("success", "Added to wishlist!");
    }

    await user.save();
    res.redirect(`/listings/${id}`);
});

//Wishlist Page Route
app.get("/wishlist", isLoggedIn, async (req, res) => {
    let user = await User.findById(req.user._id).populate("favorites");
    res.render("listings/wishlist.ejs", { favorites: user.favorites });
});

//create route
app.post(
  "/listings",
  isLoggedIn,
  upload.single("listing[image]"),
  async (req, res) => {

    // SAFETY CHECK (important)
    if (!req.file) {
      req.flash("error", "Image upload failed");
      return res.redirect("/listings/new");
    }

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  }
);



//Edit route
app.get("/listings/:id/edit", isLoggedIn , isOwner, async (req, res) => {
    let {id} = req.params;
    const foundListing = await Listing.findById(id);
    req.flash("success", " Listing Updated!");
    res.render("listings/edit.ejs", {listing: foundListing});

});

//Update Route
app.put(
  "/listings/:id",
  isLoggedIn,
  upload.single("listing[image]"),
  isOwner,
  async (req, res) => {

    let { id } = req.params;

    // get the listing document
    let listing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true }
    );

    // if new image uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
      await listing.save(); // ✅ document save
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  }
);


//delete route
app.delete("/listings/:id", isLoggedIn , isOwner,  async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", " Listing Deleted!");

    res.redirect("/listings");
});



//Reviews route
app.post("/listings/:id/review", validateReview, isLoggedIn, async(req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.review.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", " Review create!");
    res.redirect(`/listings/`);
})

//Delete Review Rute
app.delete("/listings/:id/review/:reviewId",
    async(req, res) => {
        let {id, reviewId} = req.params;

        await Listing.findByIdAndUpdate(id, {$pull: {review: reviewId}});
        await Review.findByIdAndDelete(reviewId);

        req.flash("success", " Review Deleted!");
         res.redirect(`/listings/${req.params.id}`);
    }
);

//user signup router
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

app.post("/signup", async(req, res) => {
    try{
    let {username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if(err){
            return next(err);
        }
        req.flash("success", "welcome to wanderlust!");
        res.redirect("/listings");
    });
    
    }catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
}

})
//Login
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.post("/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async(req,res) => {
        req.flash("success","welcome back to wanderlust !");
        let redirectUrl = res.locals.redirectUrl || "/listings";
        res.redirect(redirectUrl);

    }
);

//logout
app.get("/logout", (req, res, next) =>{
    req.logout((err) => {
        if(err){
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
        
    })
})

//Create Booking Route
app.post("/listings/:id/book", isLoggedIn, validateBooking, async (req, res) => {
    let { id } = req.params;
    let { checkIn, checkOut, guests } = req.body.booking;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    checkIn = new Date(checkIn);
    checkOut = new Date(checkOut);

    // Prevent double-booking: check for any overlapping dates on this listing
    const overlapping = await Booking.findOne({
        listing: id,
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
    });

    if (overlapping) {
        req.flash("error", "Those dates are not available for this listing.");
        return res.redirect(`/listings/${id}`);
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price;

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests,
        totalPrice,
    });

    await newBooking.save();

    req.flash("success", "Booking confirmed!");
    res.redirect("/trips");
});

//My Trips Route
app.get("/trips", isLoggedIn, async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ checkIn: 1 });

    res.render("bookings/index.ejs", { bookings });
});

//Cancel Booking Route
app.delete("/trips/:bookingId", isLoggedIn, isBookingOwner, async (req, res) => {
    let { bookingId } = req.params;
    await Booking.findByIdAndDelete(bookingId);
    req.flash("success", "Booking cancelled!");
    res.redirect("/trips");
});

app.listen(8081, () =>{
    console.log("server is listening to port 8081 ");
});