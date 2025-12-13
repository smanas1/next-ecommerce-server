import multer from "multer";

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fieldSize: 1024 * 1024 * 5, // 5MB limit
    fileSize: 1024 * 1024 * 5,  // 5MB per file
    files: 5  // allow up to 5 files
  },
});
