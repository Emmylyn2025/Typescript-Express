import { v2 as cloudinary } from "cloudinary";

import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.cloudinart_cloud_name;
const cloudKey = process.env.cloudinary_api_key;
const cloudSecret = process.env.cloudinary_api_secret

if (!cloudName || !cloudKey || !cloudSecret) {
  new Error("Cloudinary credentials are missing in env");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudKey,
  api_secret: cloudSecret
});

export default cloudinary;