class Product{
    constructor(code,description,unitPrice,stockQuantity,category,order){
        this.code=code;
        this.description=description;
        this.unitPrice=+(Math.round(unitPrice+ "e+2")  + "e-2");
        this.stockQuantity=isNaN(stockQuantity)?0:+(Math.round(stockQuantity+ "e+2")  + "e-2");
        this.creationDate=new Date();
        this.category=category;
        this.order=order;
        console.log(Product.toRow(this).join(" "));
    }
    
    static fromObject(val){
        return new Product(val.code,val.description,val.unitPrice,val.stockQuantity,val.category,val.order);
    }
    static toRow(product){
        return [product.code,product.description,product.unitPrice,product.stockQuantity,product.category,product.creationDate]
    }
}

class ProductStore {
    constructor(dataStore) {
        console.log("initialize product store");
        this.name='Product';
        this.keyPath='code';
        dataStore.addStore(this);
        this.dataStore=dataStore;
    }

    listProducts(callback){
        console.log("listProducts");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productStore = transaction.objectStore(this.name);
        let openCursorRequest = productStore.openCursor();
        let products=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                products.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(products);
            }
        };
    }

    listByCatetogry(category,callback){
        
    }
    
    listProductAsRows(callback){
        console.log("listProductAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productStore = transaction.objectStore(this.name);
        let openCursorRequest = productStore.openCursor();
        let products=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                products.push(Product.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(products);
            }
        };
    }


    lookup(productCode,foundcallback,notfoundcallback){
        console.log("lookup product code="+productCode);
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productStore = transaction.objectStore(this.name);
        let productRequest=productStore.get(productCode);
        productRequest.onsuccess=function(event){
            console.log("found product with code "+productCode);
            if(productRequest.result){
                foundcallback(productRequest.result);
            } else {
                if(notfoundcallback){
                    notfoundcallback(productCode);
                }
            }
        };
        productRequest.onerror=function(event){
                console.log("error while looking up the product :"+productRequest.error);
        };
    }

    storeProductArray(products,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productStore = transaction.objectStore(this.name);
        var i=0,successes=0,errors=0;
        putNext();
        function putNext() {
            if (i<products.length) {
                let p=Product.fromObject(products[i]);
                i++;
                if((!p.code)||(p.code.length<4)||isNaN(p.unitPrice)){
                    errors++;
                    putNext();
                } else {
                    productStore.put(p).onsuccess = putNext;
                    successes++;
                }
            } else {
                console.log('update complete');
                if(callback){
                    callback(successes,errors);
                }
            }
        }           
    }

    storeProduct(product,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productStore = transaction.objectStore(this.name);
        let productRequest=productStore.put(product);
        productRequest.onsuccess=function(){
                console.log('product successfully added');
                if(callback){
                    callback(product);
                }
        };
        productRequest.onerror=function(){
                console.log("error while storing the product: "+productRequest.error);
        };
        return product;
    }

    addProduct(code,description,unitPrice,stockQuantity,category,callback){
        if(isNaN(unitPrice)){throw "invalid unit price";}
        if(isNaN(stockQuantity)){throw "invalid stock quantity";}
        let product = new Product(code,description,unitPrice,stockQuantity,category,0);
        this.storeProduct(product,callback);
        return product;
    }

    deleteProduct(code,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productStore = transaction.objectStore(this.name);
        let productRequest=productStore.delete(code);
        productRequest.onsuccess=function(event){
            if(event.type=="success"){
                console.log('product successfully deleted');
                if(callback){
                    callback();
                }
            } else {
                console.log("failed to delete the product");
            }
        };
        productRequest.onerror=function(){
                console.log("error while deleting the product: "+productRequest.error);
        };
    }

    registerInventoryMovement(inventoryMovement){
        for(var item of inventoryMovement.items){
            this.lookup(item.code,(function(product){
                product.stockQuantity+=item.quantityDelta;
                this.storeProduct(product);
            }).bind(this))
        }
    }
}
