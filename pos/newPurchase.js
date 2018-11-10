var totalPriceElmt=document.getElementById("totalPrice");
var cancelledPurchaseNumberTR=document.getElementById("cancelledPurchaseNumberTR");
 
var cart=document.getElementById("cart");
var productCodeButton = document.getElementById("productNumber");
var manualProductCodeButton = document.getElementById("manualProductNumber");
var purchasedProducts={};

manualProductCodeButton.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addItem(event.target.value);
    }
});
var purchaseSearchButton = document.getElementById("purchaseSearch");

purchaseSearchButton.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchPurchase(event.target.value);
    }
});

var closeButton=document.getElementById('closeButton');
var accountDiv = document.getElementById("accountDiv");
let username=Authentication.getUsername();
if(username){
    accountDiv.innerHTML = username + ' <button onclick="Authentication.signout()">Sign Out</button>';
} else {
    document.location = "signin.html";
}

var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var productStore = new ProductStore(dataStore);
var purchaseStore = new PurchaseStore(dataStore);
var inventoryStore = new InventoryStore(dataStore);
dataStore.openDatabase(init);



function init(){
    setInterval(function () {
        let curTime=new Date();
        document.getElementById("dateTime").innerHTML = curTime.toLocaleTimeString();
    }, 1000);
    purchaseStore.init(resetGui);
}

//GUI function
function updateTotalPrice(){
    totalPriceElmt.innerHTML="&#8369;"+purchaseStore.currentPurchase.totalPrice;
    if(purchaseStore.currentPurchase.totalPrice>0 && purchaseStore.currentPurchase.status=="open"){
        closeButton.style.display='block';
    } else {
        closeButton.style.display='none';
    }

}

var lastProductUpdate=0;
function productCodeChanged(value){
    if(isNaN(value)){
        alert("invalid code");
        return;
    } 
    lastProductUpdate=Date.now();
    console.log("productCodeChanged "+value+" lastProductUpdate="+lastProductUpdate);
    if(value){
        setTimeout(productCodeChangedTimeout,150,value);
    }
}

function refreshItemView(itemIndex,item){
    document.getElementById("item_qty_"+itemIndex).innerHTML=item.quantity;
    document.getElementById("item_price_"+itemIndex).innerHTML=item.price;
    updateTotalPrice();
}

function incQuantity(itemIndex){
    if(purchaseStore.currentPurchase.status=="open"){
        let item=purchaseStore.currentPurchase.increaseQuantity(itemIndex);
        purchaseStore.storeCurrentPurchase();
        refreshItemView(itemIndex,item);
        productCodeButton.focus();
    }
}

function decQuantity(itemIndex){
    if(purchaseStore.currentPurchase.status=="open"){
        let item=purchaseStore.currentPurchase.decreaseQuantity(itemIndex);
        purchaseStore.storeCurrentPurchase();
        refreshItemView(itemIndex,item);
        productCodeButton.focus();
    }
}

function delItem(itemIndex){
    if(purchaseStore.currentPurchase.status=="open"){
        let r = confirm("Remove Item ?");
        if (r == true) {
            purchaseStore.currentPurchase.deleteItem(itemIndex);
            purchaseStore.storeCurrentPurchase();
            cart.removeChild(cart.childNodes[itemIndex]);
        }
        updateTotalPrice();
        productCodeButton.focus();
    }
}

function addItemToCart(item){
    cart.innerHTML+='<tr id="item_'+item.index+'">'
    +'<td class="code-td" id="cart_item_'+item.code+'" index="'+item.index+'">'+item.code+'</td>'
    +'<td class="desc-td" id="item_desc_'+item.index+'">'+item.description+'</td>'
    +'<td class="unit-td">'+item.unitPrice+'</td>'
    +'<td class="qty-td" id="item_qty_'+item.index+'">'+item.quantity+'</td>'
    +'<td class="price-td" id="item_price_'+item.index+'">'+item.price+'</td>'
    +'<td class="action-td"><button onclick="incQuantity('+item.index+')">+</button>'
    +' <button onclick="decQuantity('+item.index+')">-</button>'
    +' <button onclick="delItem('+item.index+')">X</button></td>'
    +'</tr>';
    updateTotalPrice();
    productCodeButton.focus();
}

function productCodeChangedTimeout(){
    let now=Date.now();
    let timeDiff=now-lastProductUpdate;
    if(timeDiff>100){
        lastProductUpdate=now;
        productCode=document.getElementById('productNumber').value;
        console.log("adding item for product "+productCode);
        addItem(productCode);
    } else {
        console.log("timeDiff="+timeDiff);
    }
}

//Controler functions
function searchPurchase(purchaseNumber){
    if(!isNaN(purchaseNumber)){
        purchaseStore.lookup(Number.parseInt(purchaseNumber),searchPurchaseFound,searchPurchaseNotFound);
        purchaseSearchButton.value="";
    }
}

function searchPurchaseFound(purchaseParam){
    purchaseStore.currentPurchase=purchaseParam;
    resetGui();
}


function searchPurchaseNotFound(purchaseNumber){
    alert("purchase "+purchaseNumber+ " not found.");
    purchaseSearchButton.value="";
}

function cancelPurchase(){
   if(purchaseStore.currentPurchase.status=="open"){
    let c = confirm("You want to delete all items ?");
    if (c== true) {
        purchaseStore.currentPurchase.resetItems();
       resetGui();
    }
   } else if(purchaseStore.currentPurchase.status=="paid"){
        if(((new Date()) - purchaseStore.currentPurchase.date) < 3600000){
        let c = confirm("Cancel this purchase and create new one ?");
            if (c== true) {
                let im=inventoryStore.cancelPurchase(purchaseStore.currentPurchase);
                purchaseStore.currentPurchase = purchaseStore.cancelPurchase(purchaseStore.currentPurchase);
                productStore.registerInventoryMovement(im);
                resetGui();
            }
       } else {
           alert("Sorry we cannot modify this purchase, it is too old");
       }
   } else if(purchaseStore.currentPurchase.status=="paying"){
        let c = confirm("You want to reset payment an d continue the purchase?");
        if (c== true) {
            purchaseStore.currentPurchase.resetPayment();
            purchaseStore.currentPurchase.status="open";
            resetGui();
        }
    } else {
       alert("This purchase is already cancelled.");
   }
}


function newPurchase(){
    purchaseStore.currentPurchase = purchaseStore.newPurchase();
    resetGui();
}

function resetGui(){
    document.getElementById('purchaseNumber').innerHTML=purchaseStore.currentPurchase.purchaseNumber;
    document.getElementById('cancelledPurchaseNumber').innerHTML=purchaseStore.currentPurchase.cancelledPurchaseNumber;
    cart.innerHTML="";
    if(purchaseStore.currentPurchase.status=="open"){
        manualProductCodeButton.style.display='inline';
        productCodeButton.style.display='inline';
        closeButton.style.display='none';
        cancelledPurchaseNumberTR.style.display='none';
    } else {
        manualProductCodeButton.style.display='none';
        productCodeButton.style.display='none';
        closeButton.style.display='none';
        cancelledPurchaseNumberTR.style.display='block';
    }
    if(purchaseStore.currentPurchase.items){
        var index=0;
        purchaseStore.currentPurchase.items.map(function(item){item.index=index++;addItemToCart(item);});
    }
    updateTotalPrice();
    productCodeButton.focus();
}

function addItem(productCode){
    console.log("addItem productCode="+productCode);
    productStore.lookup(productCode,productFoundCallback,productNotFoundCallback);
}

function productFoundCallback(product){
    console.log("addItemCallback"+JSON.stringify(product));
    let quantity=1;
    let price=0;
    if(purchasedProducts[product.code]){
        quantity=purchasedProducts[product.code].quantity;
        price=purchasedProducts[product.code].price;
    }
    let cartItem = document.getElementById("cart_item_"+product.code);
    if(cartItem){
        incQuantity(cartItem.getAttribute("index"),quantity);
    } else {
        if(!purchasedProducts[product.code]){
            quantity = prompt(product.description+" package quantity",quantity);
            if (!isNaN(quantity)) {
                price=prompt(product.description+" buying price",price);
                let pr=parseFloat(price);
                if (pr>0) {
                    let qt=parseInt(quantity);
                    purchasedProducts[product.code]={"quantity":qt,"price":pr};
                    let item=purchaseStore.currentPurchase.addItem(product,qt,pr);
                    purchaseStore.storeCurrentPurchase();
                    addItemToCart(item);
                } else {
                    alert("invalid buying price");
                }
            }
        } else{
            let item=purchaseStore.currentPurchase.addItem(product,quantity,price);
            purchaseStore.storeCurrentPurchase();
            addItemToCart(item);
        }
    }
    productCodeButton.value="";
}

function productNotFoundCallback(productCode){
        let description=prompt("New product "+productCode+" description","");
        if ((description === null)||(description=="")) {
            return; 
        }
        let unitPrice=0;
        let i=3;
        while(!(unitPrice>0) && i-->0){
            let up=prompt("Selling price","");
            unitPrice=parseFloat(up).toFixed(2)
        }
        console.log("unitprice i="+i);
        if(i==0){
            alert("cannot add product with price 0");
            return;
        }
        productStore.addProduct(productCode,description,unitPrice,productFoundCallback);
}

  function productNumberChanged(val){
    if(val.length==8){
        console.log("Product to add= "+val);
    }
  }


  function closePurchase(){
    if(purchaseStore.currentPurchase.status=="open"){
        purchaseStore.closePurchase();
        let im=inventoryStore.registerPurchase(purchaseStore.currentPurchase);
        productStore.registerInventoryMovement(im);
    }
    newPurchase();
    return true;
  }

