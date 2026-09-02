const mongoose =
  require("mongoose");


const roomSchema =
  new mongoose.Schema(

    {

      roomId: {

        type: String,

        required: true,

        unique: true,

        index: true,

      },


      name: {

        type: String,

        required: true,

        trim: true,

      },


      participants: [

        {

          type: String,

          trim: true,

        },

      ],

    },

    {

      timestamps: true,

    }

  );


module.exports =
  mongoose.model(
    "Room",
    roomSchema
  );