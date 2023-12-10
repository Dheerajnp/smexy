const isLogin = (req,res,next)=>{
    try{
        if(req.session.email)  {
            next();
         } 
         else{
            res.redirect('/login')
         }
    }
    catch(error){
        console.log(error.message);

    }

}




// const isLogout = (req,res,next)=>{
//     try {
        
//     } catch (error) {
        
//     }
// }

module.exports = {
    isLogin
}