function addtoCart(Proid){
        $.ajax({
          url:'/add-to-cart/'+Proid,
          method:'get',
          success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)


            }
          }

          
        })
    }
function removeProductFromCart(Proid) {
  $.ajax({
    url: '/remove-from-cart/' + Proid,
    method: 'get',
    success: (response) => {
      if (response.status) {
        alert('Product removed from cart!');
        location.reload(); // Refresh to update UI
      }
    }
    
  });
}

 