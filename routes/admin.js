var express = require('express');
var router = express.Router();
const db=require('../configure/connction')
 
 
var productHelper = require('../helpers/product-Helpers');
const collections = require('../configure/collections');
const{ObjectId}=require('mongodb');


 
 

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((Products)=>{
    console.log(Products)
    res.render('admin/view-products',{admin:true,Products});

  })

    
   

});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')

})

router.post('/add-product', (req, res) => {

 productHelper.addProduct(req.body,(id)=>{
    let image = req.files.Image
  
    image.mv('./public/PRODUCT-IMAGES/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product");
      }
    })
    })
})

router.get('/delete-product/:id',(req,res)=>{
  let Proid=req.params.id
  console.log(Proid);
  productHelper.deleteProduct(Proid).then((response)=>{
    res.redirect('/admin/')
  })


})

router.get('/edit-product/:id',async(req,res)=>{
  let product= await productHelper.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{product});
})


router.post('/edit-product/:id',(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    console.log(req.params.id)
    res.redirect('/admin')
    let id=req.params.id
    if(req.files.Image){
      let image=req.files.Image

      image.mv('./public/PRODUCT-IMAGES/'+id+'.jpg')
      
      
      
    }
  })
})

router.get('/all-orders',async(req,res)=>{
  const orders=await db.get().collection('order').find().toArray()
  console.log(orders)
  res.render('admin/all-orders',{admin:true,orders})
})

router.post('/update-order-status/:id', async (req, res) => {
  const orderId = req.params.id
  const status = req.body.status
  await db.get().collection('order')
    .updateOne({ _id: new ObjectId(orderId) }, { $set: { status } })
  res.redirect('/admin/all-orders')
})




  
   

  


  



 
   
   


 

module.exports = router;
