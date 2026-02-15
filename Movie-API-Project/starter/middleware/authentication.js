const jwt = require('jsonwebtoken')
const UnauthenticatedError = require('../errors/unauthenticated')
const { StatusCodes } = require('http-status-codes')

// const authenticated = async(req,res,next)=>{

// try {
//     const token = req.headers.authorization.split(' ')[1]
//     console.log(req.headers.authorization.startsWith('Bearer '))
//  if (!token||!req.headers.authorization.startsWith('Bearer ')){
   
//     throw new UnauthenticatedError('No token provided',StatusCodes.UNAUTHORIZED)

//  }

// const decoded = await jwt.verify(token,process.env.JWT_SECRET)
// console.log(decoded)

// const {id,email,userName} = decoded
// req.user = {id:id,user:userName}
//   next()

// }

// catch(err) {
//     throw new UnauthenticatedError('Invalid Login',StatusCodes.UNAUTHORIZED)
// }
 
  
// }

const authenticated = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Else check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthenticatedError("No token provided", StatusCodes.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, email, userName } = decoded;
    req.user = { id, user: userName };
    next();
  } catch (err) {
    throw new UnauthenticatedError("Invalid Login", StatusCodes.UNAUTHORIZED);
  }
};

module.exports= authenticated