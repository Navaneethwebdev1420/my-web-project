 // product-helpers.js
const db = require('../configure/connction');
const collections=require('../configure/collections');
const { ObjectId } = require('mongodb');
const { response } = require('express');
 




module.exports={
  addProduct:(product,callback)=>{
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data);
          callback(data.insertedId.toString() )
        })
    },
    getAllProducts:()=>{
      return new Promise(async(resolve,reject)=>{
        let Products= await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
        resolve(Products)
      })
    },
    
    deleteProduct:(Proid)=>{
      return new Promise(async(resolve,reject)=>{
       await db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: new  ObjectId(String(Proid))}).then((response)=>{
          //console.log(response);
          console.log(Proid)
          resolve(response)

        })
         
      })

    },
    getProductDetails:(Proid)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id: new ObjectId(String(Proid))}).then((product)=>{
          resolve(product)
        })
      })
    },

    updateProduct:(Proid,ProDetails)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collections.PRODUCT_COLLECTION)
        .updateOne({_id:new ObjectId(String(Proid))},{
          $set:{
            Name:ProDetails.Name,
            Description:ProDetails.Description,
            Price:ProDetails.Price,
            Category:ProDetails.Category


          }


        }).then((response)=>{
          resolve()

        })

      })
    }
     
    

      
    

    
    

     











}
  
    