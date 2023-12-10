const postRegister = async (req, res, next) => {
  try {
    let {
      email,
      password,
      phone,
      username,
      referal
    } = req.body;
    let userData = await customerModel.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });
    const user = await customerModel.findOne({referalCode: referal})
    if(user){
      req.session.referal = referal
    }
    if (userData) {
      return res.redirect('/register');
    } else {
      let passwordhashed = await securePassword(password);
      let user = {
        email: email,
        password: passwordhashed,
        username: username,
        phone: phone,
        referalCode : generateReferralCode(),
      };
      req.session.userDetails = user;
      req.session.otp = await sentOtp(email);
      otpNull(req, res, next);
      res.redirect('/otp');
    }
  } catch (error) {
    console.log(error);
    res.redirect('/register');
  }
};

let loadOTP = async (req, res) => {
  try {
    if (req.session.otpExpired) {
      req.session.otpExpired = false;
      res.render("otp", {
        err: "Otp expired"
      })
    } else if (req.session.otpFalse) {
      req.session.otpFalse = false;
      res.render("otp", {
        err: "Incorrect Otp"
      })
    } else {
      res.render("otp", {
        err: "",
       
      })
    }
  } catch (error) {
    console.log(error.message);
  }
};


let postVerifyOtp = async (req, res, next) => {
  let {
    otp
  } = req.body;
  console.log(otp, req.session.userDetails);
  try {
    if (req.session.otp != null) {
      if (!isNaN(otp)) {
        if (otp === req.session.otp) {
          let response = await customerModel.insertMany([req.session.userDetails])
          req.session.userId = false
          
          res.redirect('/login')
        } else {
          req.session.otpFalse = true;
          res.redirect("/otp");
        }
      }
    } else {
      req.session.otpExpired = true;
      res.redirect("/otp")
    }
  } catch (error) {
    console.error(error);
    res.redirect("/signup")
  }
};