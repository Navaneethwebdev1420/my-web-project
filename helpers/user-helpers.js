const db = require('../configure/connction');
const collections=require('../configure/collections');
const bcrypt=require('bcrypt');
const { ObjectId } = require('mongodb');
const { response } = require('express');
const Razorpay = require('razorpay');
const { resolve } = require('node:path');

var instance = new Razorpay({
  key_id: 'rzp_test_RXahPaiiMarRHS',
  key_secret: 'mVj0yGfTrVObhLSa3ERPq9ho'
});
 



module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve( userData )
            })

        })

    },
dologin: (userData) => {
    return new Promise(async (resolve, reject) => {
        let response={}

        try {
            let user = await db.get().collection(collections.USER_COLLECTION)
                .findOne({ Email: userData.Email });
            
            if (user) {
                
                bcrypt.compare(userData.Password, user.Password)
                    .then((status) => {
                        if (status) {
                            console.log("login Success");
                            response.user=user
                            response.status=true
                            resolve(response)
                            
                        } else {
                            console.log("login Failed");
                            resolve({status:false})
                            
                        }
                    })
                    .catch((error) => {
                        console.log("Login not working", error);
                         
                    });
            } else {
                console.log("login Failed done");
                resolve({status:false})
                
            }
        } catch (error) {
            console.log("Database error:", error);
            
        }
    });
},
addtoCart:(Proid,userID)=>{
    let proObj={
        item:new ObjectId(String(Proid)),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let usercart=await db.get().collection(collections.CART_COLLECTION).findOne({user: new ObjectId(String(userID))})
        if(usercart){
            let proExist=usercart.products.findIndex(product=> product.item==Proid)
            console.log(proExist);
            if(proExist!=-1){
                db.get().collection(collections.CART_COLLECTION)
                .updateOne(
                {'user':new ObjectId(String(userID)),'products.item':new ObjectId(String(Proid))},
                {
                    $inc:{"products.$.quantity":1}
                }
            ).then(()=>{
                resolve()

            })
                
            }else{

             db.get().collection(collections.CART_COLLECTION)
            .updateOne({user:new ObjectId(String(userID))},
                {
                        $push:{products:proObj}
                }
        
        
          ).then((response)=>{
            resolve()
          })
        }
             


        }else{
          let cartobj={
            user:new ObjectId(String(userID)),
            products:[proObj]

          }
          db.get().collection(collections.CART_COLLECTION).insertOne(cartobj).then((response)=>{
            resolve()

          })

        }

        

      })
    },
    getCartProducts:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:new ObjectId(String(userID))}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'

                    }

                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                 

               
            ]).toArray()
            
            resolve(cartItems)

        })
    },
    GetCartCount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(String(userID))})
            
            if(cart){
                count=cart.products.length
                
                

            }
            resolve(count)
        })

    },
    ChangeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        console.log("Cart",details.cart)
        console.log("Product",details.product)
        
        return new Promise((resolve,reject)=>{
            if(details.count==-1  && details.quantity==1){
             db.get().collection(collections.CART_COLLECTION)
                .updateOne(
                {_id:new ObjectId(String(details.cart))},
                {
                    $pull:{products:{item:new ObjectId(String(details.product))}}
                }
            ).then((response)=>{
                resolve({removeProduct:true})

            })
            }else{
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:new ObjectId(String(details.cart)), 'products.item':new ObjectId(String(details.product))},
            
                {
                    $inc:{'products.$.quantity':details.count}
                }
                ).then((response)=>{

                    resolve({status:true})
                })

            }

        })

    },
    GetTotalAmount:(userID)=>{
         return new Promise(async(resolve,reject)=>{
            
            let total=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:new ObjectId(String(userID))}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'

                    }

                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:{
                                $multiply:[
                                    '$quantity',
                                    {
                                        $toInt:{
                                            $replaceAll:{
                                                input:'$product.Price',
                                                find:'Rs.',
                                                replacement:''
                                            }
                                        }
                                    }
                                ]
                            }
                        } 
                    }
                }

                 

               
            ]).toArray()
            console.log(total[0].total);
            
            resolve(total[0].total)

        })

    },
    removeFromCart: (Proid, userID) => {
    return new Promise((resolve, reject) => {
    db.get().collection(collections.CART_COLLECTION)
      .updateOne(
        { user: new ObjectId(String(userID)) },
        { $pull: { products: { item: new ObjectId(String(Proid)) } } }
      )
      .then((response) => resolve(response))
       
  });
},
placeOrder:(order,products,total,userID)=>{
    return new Promise((resolve,reject)=>{
       console.log(userID)
        let status=order['payment-method']==='COD'?'placed':'pending'
        let orderobj={
            deliveryDetails:{
                address:order.address,
                pincode:order.pincode,
                date:order.date



            },
            userID:new ObjectId(String(userID)),
            paymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status
        }

        db.get().collection(collections.ORDER_COLLECTION).insertOne(orderobj).then((response)=>{
            db.get().collection(collections.CART_COLLECTION).deleteOne({user:new ObjectId(String(userID))}).then(()=>{
                resolve(response.insertedId.toString());

            })
            
            
        })

    })

},
GetCartProductsList:(userID)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userID)
        let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(String(userID))})
        resolve(cart? cart.products: [])
    })

},
GetUserOrders:(userID)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userID)
        let orders=await db.get().collection(collections.ORDER_COLLECTION)
        .find({userID:new ObjectId(String(userID))}).toArray()
        console.log(orders);
        resolve(orders)

    })
},
GetOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new ObjectId(String(orderId))}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'

                    }

                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                 

               
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)

    })

},
generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var options ={
            amount:total*100,
            currency:"INR",
            receipt:String(orderId),
            notes:{
                description:"E-commerce order payment",
                orderId:orderId
            },
        }
        instance.orders.create(options, (err, order) => {
        if (err) {
          console.error("Razorpay error:", err);
          reject(err);
        } else {
          console.log("NEW Order:",order)
          resolve(order);
        }
      });
    
    })
},
VerifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const {
  createHmac,
} = require('node:crypto');
 let hmac = createHmac('sha256', 'mVj0yGfTrVObhLSa3ERPq9ho');
 hmac.update(details.payment['razorpay_order_id'] +'|' + details.payment['razorpay_payment_id']);
 hmac=hmac.digest('hex')
 if(hmac===details.payment['razorpay_signature']){
    resolve()
 }else{
    reject()
 }



    })
},
ChangePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.ORDER_COLLECTION)
        .updateOne({_id:new ObjectId(String(orderId))},
        {
            $set:{
                status:"placed"
            }
        }
        ).then(()=>{
            resolve()
        })

        

    })

}

    

    



    

}