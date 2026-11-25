# 🌍 Wanderlust – Travel & Accommodation Booking Platform

Wanderlust is a full-stack travel and accommodation booking web application where users can explore different destinations, discover unique properties, create listings, book accommodations, write reviews, and save their favorite places to a wishlist.

The application provides an interactive platform for travelers and property owners to manage their travel and accommodation experiences.

## 🚀 Features

### 👤 User Authentication
- User registration and login.
- Secure password authentication using Passport.js.
- Session-based authentication.
- Protected routes for authenticated users.

### 🏡 Property Listings
- Explore available accommodation listings.
- View detailed property information.
- Create new property listings.
- Edit and delete existing listings.
- Upload property images using Cloudinary.

### 🔍 Search & Discovery
- Search listings by title, location, and country.
- Browse accommodation listings.
- Filter listings by categories.

### ❤️ Wishlist
- Add properties to your wishlist.
- Remove properties from your wishlist.
- View all saved properties in one place.

### ⭐ Reviews & Ratings
- Submit reviews for properties.
- Give ratings from 1 to 5 stars.
- Display reviews with user information.

### 📅 Booking Management
- Book accommodations by selecting check-in and check-out dates.
- Specify the number of guests.
- Calculate the total booking price.
- Check for overlapping bookings.
- View and cancel bookings through the My Trips section.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | Backend JavaScript runtime |
| Express.js | Backend web framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| EJS | Server-side rendering |
| Bootstrap | Responsive UI styling |
| JavaScript | Application functionality |
| Passport.js | User authentication |
| Cloudinary | Image storage and management |
| Multer | File upload handling |
| Joi | Data validation |
| Express Session | Session management |
| Connect Flash | Success and error messages |

## 📂 Project Structure
```text
project/
│
├── app.js
├── cloudConfig.js
├── middleware.js
├── schema.js
│
├── models/
│   ├── booking.js
│   ├── listing.js
│   ├── review.js
│   └── user.js
│
├── init/
│   ├── data.js
│   └── index.js
│
├── public/
│   └── css/
│       ├── style.css
│       ├── rating.css
│       └── js/
│           └── script.js
│
├── views/
│   ├── includes/
│   ├── layouts/
│   ├── listings/
│   └── users/
│
├── package.json
└── .gitignore
```

