const handle404Error = (req, res) => {
    const status = res.statusCode;

    if (status === 500) {
        res.render('page-500');
    } else if(status == 404){
        res.render('page-404');
    }
};
module.exports = { handle404Error };