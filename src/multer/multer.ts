import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = 'src/uploads'
    //Check if uploads folder exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }

    cb(null, dest);
  },

  filename: function (req, file, cb) {

    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
})

const fileFilter = function (req: any, file: any, cb: any) {
  if (!file.mimetype.startsWith('image')) {
    cb(false, new Error('Only images can be uploaded'))
  } else {
    cb(null, 'image allowed');
  }
}


export const upload = multer({
  storage,
  fileFilter,
  limits: 10 * 1024 * 1024 as any //Maximum of 10mb 
});