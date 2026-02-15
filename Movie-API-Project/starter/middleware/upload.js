const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


const storage = new CloudinaryStorage({
  cloudinary,
  
  params: async(req,file)=>{
    return{
    folder: "user_uploads",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id:`profile_${req.user.id}`
    
   //overwrite:true,
    
  } 
  },

});


const upload = multer({ storage });

module.exports = upload;
