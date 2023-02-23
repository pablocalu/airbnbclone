const mongoose =  require('mongoose')

const placeSchema = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    title: String,
    address: String,
    addedPhotos1: [String],
    addedPhotos2: [String],
    description: String,
    perks: [String],
    extraInfo: String,
    checkIn: Number,
    checkOut: Number,
    maxGuests: Number
})

const PlaceModel = mongoose.model('Place', placeSchema)

module.exports = PlaceModel 