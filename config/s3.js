import { S3Client } from "@aws-sdk/client-s3";

console.log("Region:", process.env.AWS_REGION);
console.log("Access Key:", process.env.AWS_ACCESS_KEY_ID);
console.log("Secret Key:", process.env.AWS_SECRET_ACCESS_KEY);

const s3 = new S3Client({
    region: process.env.AWS_REGION,

    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

export default s3;