import multer from 'multer'
import path from 'path'

// save files to server/src/uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`
    cb(null, uniqueName)
  }
})

export const upload = multer({ storage })