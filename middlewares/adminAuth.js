const isAdminLogin = (req,res,next)=>{
    try{
        if(req.session.admin)  {
            next();
         } 
         else{
            res.redirect('/admin/signin')
         }
    }
    catch(error){
        console.log(error.message);

    }

}


module.exports={isAdminLogin}