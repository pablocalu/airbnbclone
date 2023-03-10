const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const Place = require('./models/Place');
const Booking = require('./models/Booking')
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const bcrypt = require('bcryptjs');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'thisisunsecreto';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(
  cors({
    credentials: true,
    origin: 'http://127.0.0.1:5173',
  })
);

mongoose.connect(process.env.MONGO_URL);

app.get('/test', (req, res) => {
  res.json('oki doki');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(user);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie('token', token).json(userDoc);
        }
      );
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' + newName,
  });
  res.json(newName);
});


const photosMiddleware = multer({ dest: 'uploads/' });
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});

app.post('/places', (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos1,
    addedPhotos2,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      addedPhotos1,
      addedPhotos2,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get('/user-places', (req,res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData
    res.json(await Place.find({ owner:id }))
  })
})

app.get('/places/:id', async (req,res) => {
  const {id} = req.params;
  res.json(await Place.findById(id).populate('booking'));
});

app.put('/places', async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos1,
    addedPhotos2,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id)
    if(userData.id === placeDoc.owner.toString()){
      placeDoc.set({
        price,
        title,
        address,
        addedPhotos1,
        addedPhotos2,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
      })
      placeDoc.save()
      res.json('ok')
    }
  })
})

app.get('/places', async (req, res) => {
  res.json( await Place.find())
})



app.post('/booking', async (req,res) => {
  const userData = await getUserDataFromToken(req)
  const { place, dates, numberOfGuests, name, phone, price } = req.body

  try {
    const booking = await Booking.create({
      place, dates, numberOfGuests, name, phone, price, user: userData.id
    })
    await Place.updateOne(
      { _id: place }, 
      { $push: { booking } }
  );

    res.json('ok')
  } catch (error) {
    throw error
  }







})

function getUserDataFromToken(req) {
  return new Promise((resolve, reject)=> {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if(err) throw err;
      resolve(userData)
    })
  })
}

app.get('/bookings', async (req,res) => {
  const userData = await getUserDataFromToken(req)
  res.json(await Booking.find({user: userData.id}).populate('place'))
})

app.put('/cancel', async (req, res) => {
  const userData = await getUserDataFromToken(req)
  const { id } = req.body

 try {
    await Booking.findByIdAndDelete({ _id : id})
    res.json('ok')
  } catch (error) {
    throw error
  }
  
  
  //recibir el id del lugar para cancelar la reserva de ese booking
  //primero recibo el id del lugar, busco el lugar en la db si esta el lugar busco
  //las fechas, elimino las fechas que envio por dates.
  //luego recibo el id del booking
  //elimino ese booking


})

app.listen(4000);
