import fs, { unlink } from "fs/promises"
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

export async function uploadToS3(file) {
    try {
        const fileContent = await fs.readFile(file.path);

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.filename,
            Body: fileContent,
            ContentType: file.mimetype
        })

        await s3.send(command);

        await unlink(file.path);

        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.filename}`;

    } catch (error) {
        console.error("Error deleting file:",error, error.message)
        return error
    }
}