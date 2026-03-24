import cloudinary from "./cloudinary";

const uploadToCloudinary = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);

    //console.log(result);
    return {
      productImageUrl: result.secure_url,
      productImageId: result.public_id
    }
  } catch (error) {
    console.log(error)
    new Error("Error while uploading to cloudinary");
  }
}

export default uploadToCloudinary;