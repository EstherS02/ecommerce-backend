import multer from "multer";
import path from "path";

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
]

function fileFilter(req, file, cb) {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"));
    }
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/') // Means pjt folder
    },
    filename(req, file, cb) {
        const extension = path.extname(file.originalname)
        cb(null, `${Date.now()}${extension}`)
    }
})

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

export default upload;