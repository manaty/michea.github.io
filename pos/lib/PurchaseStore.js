class PurchaseItem{
    constructor(packQuantity,packPrice){
        this.quantity=1;
        this.price=packPrice;
        this.packQuantity=packQuantity;
        this.packPrice=packPrice;
        if(!isNaN(this.packPrice)){
            this.unitPrice = +(Math.round(this.packPrice/this.packQuantity+ "e+2")  + "e-2");
        }
        this.computePrice();
    }

    static deserializeJson(val){
        let ot = new PurchaseItem(val.packQuantity,val.packPrice);
        ot.code=val.code;
        ot.price=val.price;
        ot.quantity= val.quantity;
        ot.description=val.description;
        ot.computePrice();
        return ot;
    }

    setCode(code){
        this.code=code;
        return this;
    }

    setDescription(description){
        this.description=description;
        return this;
    }

    setQuantity(quantity){
        if(quantity!=this.quantity){
                this.quantity=quantity;
                this.computePrice();
        }
        return this;
    }

    computePrice(){
        this.price = +(Math.round(this.packPrice*this.quantity+ "e+2")  + "e-2");
    }
}

class Purchase{
    constructor(purchaseNumber){
        this.purchaseNumber=purchaseNumber;
        this.date= new Date();
        this.items=new Array();
        this.totalPrice=0;
        this.status="open";
        this.cancelledPurchaseNumber=null;
        this.ammendingPurchaseNumber=null;
    }

    static deserializeJson(val){
        let p = new Purchase(val.purchaseNumber);
        p.date= val.date;
        if(val.items){
            p.items=val.items.map(function(itemJson){return PurchaseItem.deserializeJson(itemJson);});
        }
        p.totalPrice=val.totalPrice;
        p.status=val.status;
        p.cancelledPurchaseNumber=val.cancelledPurchaseNumber;
        p.ammendingPurchaseNumber=val.ammendingPurchaseNumber;
        return p;
    }

    static toRow(purchase){
        return [purchase.purchaseNumber,purchase.date,purchase.items.map(function(item){
            return item.description+'['+item.quantity+']';
        }).join(","),purchase.totalPrice,purchase.status,
        (purchase.cancelledPurchaseNumber==null?'':purchase.cancelledPurchaseNumber)
        +''+(purchase.ammendingPurchaseNumber==null?'':purchase.ammendingPurchaseNumber)]

    }

    addItem(product,packQuantity,packPrice){
        let result= new PurchaseItem(packQuantity,packPrice);
         result.setCode(product.code).setDescription(product.description);
        let index=this.items.push(result);
        result.index=index-1;
        this.totalPrice+=result.price;
        return result;
    }

    updateItemDescription(index,description){
        let result=this.items[index];
        result.setDescription(description);
        this.lastUpdate=new Date();
        return result;
    }

    increaseQuantity(index){
        let result=this.items[index];
        this.updateItemQuantity(index,result.quantity+1);
        return result;
    }

    decreaseQuantity(index){
        let result=this.items[index];
        if(result.quantity>0){
            this.updateItemQuantity(index,result.quantity-1);
        }
        return result;
    }

    updateItemQuantity(index,quantity){
        let result=this.items[index];
        let oldPrice=result.price;
        result.setQuantity(quantity);
        this.totalPrice+=result.price-oldPrice;
        return result;
    }

    deleteItem(index){
        let result=this.items[index];
        let oldPrice=result.price;
        this.items.splice(index, 1);
        this.totalPrice-=oldPrice;
        return result;
    }
    
    resetItems(){  
        this.items=new Array();
        this.totalPrice=0;
    }
}

class PurchaseStore{
    constructor(dataStore) {
        console.log("create purchase store class instance");
        this.name='Purchase';
        this.keyPath='purchaseNumber'
        dataStore.addStore(this);
        this.dataStore=dataStore;
        this.purchaseIndex=Number.parseInt("0"+new Date().getFullYear().toString().substr(-2)+"00000");
        this.currentPurchase=null;
    }

    init(callback){
        console.log("init purchase store instance db="+this.dataStore.database);
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor(null, 'prev');
        openCursorRequest.onsuccess = (function (event) {
            let cursor = event.target.result;
            if (cursor) {
                this.currentPurchase=Purchase.deserializeJson(cursor.value);
                this.purchaseIndex = this.currentPurchase.purchaseNumber; 
                if(cursor.value.status!="open"){
                    this.currentPurchase=this.newPurchase();
                }
                if(callback){
                    callback();
                }
            } else if(callback){
                this.currentPurchase=this.newPurchase();
                callback();
            }
        }).bind(this);
    }

    listPurchases(callback){
        console.log("listPurchases");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let purchases=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                purchases.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(purchases);
            }
        };
    }
    
    listPurchasesAsRows(callback){
        console.log("listPurchasesAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let purchases=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                purchases.push(Purchase.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(purchases);
            }
        };
    }


    lookup(purchaseNumber,foundcallback,notfoundcallback){
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let purchaseStore = transaction.objectStore(this.name);
        let purchaseRequest=purchaseStore.get(purchaseNumber);
        purchaseRequest.onsuccess=function(event){
            console.log("found purchase with number "+purchaseNumber);
            if(purchaseRequest.result){
                foundcallback(Purchase.deserializeJson(purchaseRequest.result));
            } else {
                notfoundcallback(purchaseNumber);
            }
        };
        purchaseRequest.onerror=function(event){
                console.log("error while looking up the purchase :"+purchaseRequest.error);
        };
    }

    storeCurrentPurchase(callback){
        this.storePurchase(this.currentPurchase,callback);
    }

    storePurchase(purchase,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let purchaseStore = transaction.objectStore(this.name);
        let purchaseRequest=purchaseStore.put(purchase);
        purchaseRequest.onsuccess=function(){
                console.log('purchase successfully stored');
                if(callback){
                    callback(purchase);
                }
        };
        purchaseRequest.onerror=function(){
                console.log("error while storing the purchase: "+purchaseRequest.error);
        };
        return purchase;
    }

    closePurchase(callback){
        this.currentPurchase.status="paid";
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let purchaseStore = transaction.objectStore(this.name);
        let purchaseRequest=purchaseStore.put(this.currentPurchase);
        purchaseRequest.onsuccess=function(){
                console.log('purchase successfully closed');
                if(callback){
                    callback(this.currentPurchase);
                }
        };
        purchaseRequest.onerror=function(){
                console.log("error while closing the purchase: "+purchaseRequest.error);
        };
    }

    newPurchase(){
        if(this.currentPurchase && (this.currentPurchase.status=="open")){
            throw "current purchase is still open";
        }
        let purchase=new Purchase(++this.purchaseIndex);
        this.storePurchase(purchase,null);
        return purchase;
    }

    cancelPurchase(purchaseToClose){
        if(purchaseToClose.status!='paid'){
            throw "Cannot cancel a purchase that is "+purchaseToClose.status;
        }
        if(((new Date()) - purchaseToClose.date) < 3630000){
            let transaction = this.dataStore.database.transaction(this.name,'readwrite');
            let purchaseStore = transaction.objectStore(this.name);
            let purchase=Purchase.deserializeJson(purchaseToClose);
            purchase.purchaseNumber=++this.purchaseIndex;
            purchaseToClose.ammendingPurchaseNumber=purchase.purchaseNumber;
            purchaseToClose.status="cancelled";
            purchase.cancelledPurchaseNumber=purchaseToClose.purchaseNumber;
            purchase.status="open";
            purchaseStore.put(purchaseToClose);
            purchaseStore.put(purchase);
            inventoryStore.cancelPurchase(purchaseToClose);
            return purchase;
        } else {
            throw "Too late to cancel the purchase";
        } 
    }
}