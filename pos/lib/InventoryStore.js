class InventoryRecord{
    constructor(code,quantityDelta){
        this.code=code;
        this.quantityDelta= quantityDelta;
        this.date= new Date();
    }

    static deserializeJson(val){
        let ot = new InventoryRecord();
        ot.code=val.code;
        ot.quantityDelta= val.quantityDelta;
        ot.date=val.date;
        return ot;
    }

    setCode(code){
        this.code=code;
        return this;
    }

    setQuantityDelta(quantityDelta){
        this.quantityDelta=quantityDelta;
        return this;
    }
}

class InventoryMovement{
    constructor(inventoryNumber,type){
        this.inventoryNumber=inventoryNumber;
        this.type=(type)?type:"I";
        this.date= new Date();
        this.items=new Array();
        this.status="open";
        this.cancelledInventoryNumber=null;
        this.ammendingInventoryNumber=null;
    }

    static deserializeJson(val){
        let p = new InventoryMovement(val.inventoryNumber);
        p.date= val.date;
        if(val.items){
            p.items=val.items.map(function(itemJson){return InventoryItem.deserializeJson(itemJson);});
        }
        p.status=val.status;
        p.cancelledInventoryNumber=val.cancelledInventoryNumber;
        p.ammendingInventoryNumber=val.ammendingInventoryNumber;
        return p;
    }

    static fromOrder(order){
        let im=null;
        if(order.items){
            im = new InventoryMovement(order.orderNumber,"O");
            for(var item of order.items){
                im.addItem(item,item.quantity*(-1)); // selling decreases the quantity
            }
        }
        return im;
    }

    static fromCancelledOrder(order){
        let im=null;
        if(order.items){
            im = new InventoryMovement(order.orderNumber,"O");
            for(var item of order.items){
                im.addItem(item,item.quantity); // cancelling increases the quantity
            }
        }
        return im;
    }

    static fromPurchase(purchase){
        let im=null;
        if(purchase.items){
            im = new InventoryMovement(purchase.purchaseNumber,"P");
            for(var item of purchase.items){
                im.addItem(item,item.quantity); // buying increases the quantity
            }
        }
        return im;
    }
    
    static fromCancelledPurchase(purchase){
        let im=null;
        if(purchase.items){
            im = new InventoryMovement(purchase.purchaseNumber,"P");
            for(var item of purchase.items){
                im.addItem(item,item.quantity*(-1)); // buying increases the quantity
            }
        }
        return im;
    }


    static toRow(inventory){
        return [inventory.inventoryNumber,inventory.date,inventory.items.map(function(item){
            return item.description+'['+item.quantity+']';
        }).join(","),inventory.status,
        (inventory.cancelledInventoryNumber==null?'':inventory.cancelledInventoryNumber)
        +''+(inventory.ammendingInventoryNumber==null?'':inventory.ammendingInventoryNumber)]

    }

    addItem(product,quantityDelta){
        let result= new InventoryRecord(product.code,quantityDelta);
        let index=this.items.push(result);
        result.index=index-1;
        return result;
    }

    deleteItem(index){
        let result=this.items[index];
        this.items.splice(index, 1);
        return result;
    }
    
    resetItems(){  
        this.items=new Array();
    }
}

class InventoryStore{
    constructor(dataStore) {
        console.log("create inventory store class instance");
        this.name='Inventory';
        this.keyPath=['type','inventoryNumber'];
        dataStore.addStore(this);
        this.dataStore=dataStore;
        this.inventoryIndex=Number.parseInt("0"+new Date().getFullYear().toString().substr(-2)+"00000");
        this.currentInventory=null;
    }

    init(callback){
        console.log("init inventory store instance db="+this.dataStore.database);
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor(null, 'prev');
        openCursorRequest.onsuccess = (function (event) {
            let cursor = event.target.result;
            if (cursor) {
                this.currentInventory=Inventory.deserializeJson(cursor.value);
                this.inventoryIndex = this.currentInventory.inventoryNumber; 
                if(cursor.value.status!="open"){
                    this.currentInventory=this.newInventory();
                }
                if(callback){
                    callback();
                }
            } else if(callback){
                this.currentInventory=this.newInventory();
                callback();
            }
        }).bind(this);
    }

    listInventorys(callback){
        console.log("listInventorys");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let inventorys=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                inventorys.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(inventorys);
            }
        };
    }
    
    listInventorysAsRows(callback){
        console.log("listInventorysAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let inventorys=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                inventorys.push(Inventory.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(inventorys);
            }
        };
    }


    lookup(inventoryNumber,foundcallback,notfoundcallback){
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let inventoryStore = transaction.objectStore(this.name);
        let inventoryRequest=inventoryStore.get(inventoryNumber);
        inventoryRequest.onsuccess=function(event){
            console.log("found inventory with number "+inventoryNumber);
            if(inventoryRequest.result){
                foundcallback(Inventory.deserializeJson(inventoryRequest.result));
            } else {
                notfoundcallback(inventoryNumber);
            }
        };
        inventoryRequest.onerror=function(event){
                console.log("error while looking up the inventory :"+inventoryRequest.error);
        };
    }

    storeCurrentInventory(callback){
        this.storeInventory(this.currentInventory,callback);
    }

    storeInventory(inventory,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let inventoryStore = transaction.objectStore(this.name);
        let inventoryRequest=inventoryStore.put(inventory);
        inventoryRequest.onsuccess=function(){
                console.log('inventory successfully stored');
                if(callback){
                    callback(inventory);
                }
        };
        inventoryRequest.onerror=function(){
                console.log("error while storing the inventory: "+inventoryRequest.error);
        };
        return inventory;
    }

    closeInventory(callback){
        this.currentInventory.status="paid";
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let inventoryStore = transaction.objectStore(this.name);
        let inventoryRequest=inventoryStore.put(this.currentInventory);
        inventoryRequest.onsuccess=function(){
                console.log('inventory successfully closed');
                if(callback){
                    callback(this.currentInventory);
                }
        };
        inventoryRequest.onerror=function(){
                console.log("error while closing the inventory: "+inventoryRequest.error);
        };
    }

    newInventory(){
        if(this.currentInventory && (this.currentInventory.status=="open")){
            throw "current inventory is still open";
        }
        let inventory=new Inventory(++this.inventoryIndex);
        this.storeInventory(inventory,null);
        return inventory;
    }

    cancelInventory(inventoryToClose){
        if(inventoryToClose.status!='paid'){
            throw "Cannot cancel a inventory that is "+inventoryToClose.status;
        }
        if(((new Date()) - inventoryToClose.date) < 3630000){
            let transaction = this.dataStore.database.transaction(this.name,'readwrite');
            let inventoryStore = transaction.objectStore(this.name);
            let inventory=Inventory.deserializeJson(inventoryToClose);
            inventory.inventoryNumber=++this.inventoryIndex;
            inventoryToClose.ammendingInventoryNumber=inventory.inventoryNumber;
            inventoryToClose.status="cancelled";
            inventory.cancelledInventoryNumber=inventoryToClose.inventoryNumber;
            inventory.status="open";
            inventoryStore.put(inventoryToClose);
            inventoryStore.put(inventory);
            return inventory;
        } else {
            throw "Too late to cancel the inventory";
        } 
    }

    registerOrder(order){
        let im=InventoryMovement.fromOrder(order);
        this.storeInventory(im);
        return im;
    }

    cancelOrder(order){
        let im=InventoryMovement.fromCancelledOrder(order);
        this.storeInventory(im);
        return im;
    }

    registerPurchase(purchase){
        let im=InventoryMovement.fromPurchase(purchase);
        this.storeInventory(im);
        return im;
    }

    cancelPurchase(purchase){
        let im=InventoryMovement.fromCancelledPurchase(purchase);
        this.storeInventory(im);
        return im;
    }
}