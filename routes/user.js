var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-Helpers');
var Userhelpers=require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIN){
    next()
  }else{
    res.redirect('/login');

  }
}


 

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log(user)
  let cartcount=null
  if(req.session.user){
  cartcount=await Userhelpers.GetCartCount(req.session.user._id)
  }
   
  productHelper.getAllProducts().then((Products)=>{
   
     
    
    res.render('user/view-products',{Products,user,cartcount});

  })
});


router.get('/login',(req,res)=>{
  if(req.session.loggedIN){
    res.redirect('/')
  }else{ 
    
    res.render('user/login',{"loginErr":req.session.loginErr});
    req.session.loginErr=false
  }
})


router.get('/signup',(req,res)=>{
  res.render('user/signup');
})


router.post('/signup',(req,res)=>{
  Userhelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIN=true
    req.session.user=response
    res.redirect('/')


  })

})


router.post('/login',(req,res)=>{
  Userhelpers.dologin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIN=true
      req.session.user=response.user

      res.redirect('/')
    }else{
      req.session.loginErr="Wrong Password or UserName"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await Userhelpers.getCartProducts(req.session.user._id)
  let TotalValue=await Userhelpers.GetTotalAmount(req.session.user._id)
  console.log(products);
  res.render('user/cart',{products,user:req.session.user._id,TotalValue});
})


router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call")
  Userhelpers.addtoCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})

  })
})

router.post('/change-product-quantity',async(req,res,next)=>{
  console.log(req.body);
  Userhelpers.ChangeProductQuantity(req.body).then(async(response)=>{
    response.total=await Userhelpers.GetTotalAmount(req.session.user._id)
    res.json(response)

  })
   
   


})


router.get('/remove-from-cart/:id', (req, res) => {
  let Proid = req.params.id;
  let userID = req.session.user._id; // ✅ FIXED lowercase _id

  Userhelpers.removeFromCart(Proid, userID)
    .then(() => {
      res.json({ status: true });
    })
    
});

router.get('/place-order',verifyLogin,async(req,res)=>{
  let Total=await Userhelpers.GetTotalAmount(req.session.user._id)
  res.render('user/place-order',{Total,user:req.session.user});
})



router.post('/place-order',async(req,res)=>{
  let userID=req.session.user._id
  console.log(userID)

  let products=await Userhelpers.GetCartProductsList(userID)
  let TotalPrice=await Userhelpers.GetTotalAmount(userID)
  let orderId=await Userhelpers.placeOrder(req.body,products,TotalPrice,userID)
  
  
    if(req.body['payment-method'] === 'COD'){
      res.json({ codSuccess:true});

    }else{
      const razorpayOrder = await Userhelpers.generateRazorpay(orderId,TotalPrice);
       
      res.json(razorpayOrder);
     
      
    }
    
    console.log(req.body);
    
   
    



  
  
  
   
  
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders',async(req,res)=>{
  let orders=await Userhelpers.GetUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})

})


router.get('/view-order-products/:id',async(req,res)=>{
  let orderId=req.params.id
  console.log(orderId)
  let products=await Userhelpers.GetOrderProducts(orderId)
  console.log(products)
  res.render('user/view-order-products',{user:req.session.user,products,orderId})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  Userhelpers.VerifyPayment(req.body).then(()=>{
    Userhelpers.ChangePaymentStatus(req.body.order.receipt).then(()=>{
      console.log("Payment Succesfull")
      res.json({status:true})
      

    })


  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})



 







module.exports = router;
