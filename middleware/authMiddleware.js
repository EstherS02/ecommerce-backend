import jwt from "jsonwebtoken"

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({
              message: "Token not found"  
            })
        }

        const token = authHeader.split(" ")[1]

        const decode = jwt.verify(
            token, 
            process.env.JWT_SECRET
        )

        req.user = decode;
        next()

    } catch(err) {
        res.status(401).json({
            message: "Invalid or Expired Token"
        })
    }
}