class ProductCategory{
    constructor(code,description,parentCategory,order){
        this.code=code;
        this.description=description;
        this.parentCategory=parentCategory;
        this.order=(order)?order:1;
        //console.log(ProductCategory.toRow(this).join(" "));
    }
    
    static fromObject(val){
        return new ProductCategory(val.code,val.description,val.parentCategory,val.order);
    }
    static toRow(productCategory){
        return [productCategory.code,productCategory.description,productCategory.parentCategory,productCategory.order]
    }
}

class ProductCategoryStore {
    constructor(dataStore) {
        //console.log("initialize productCategory store");
        this.name='ProductCategory';
        this.keyPath='code';
        dataStore.addStore(this);
        this.dataStore=dataStore;
    }

    listProductCategories(callback){
        //console.log("listProductCategories");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productStore = transaction.objectStore(this.name);
        let openCursorRequest = productStore.openCursor();
        let productCategories=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                productCategories.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(productCategories);
            }
        };
    }
    
    listProductCategoriesAsRows(callback){
        console.log("listProductCategoriesAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productCategoryStore = transaction.objectStore(this.name);
        let openCursorRequest = productCategoryStore.openCursor();
        let productCategories=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                productCategories.push(ProductCategory.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(productCategories);
            }
        };
    }

    listProductCategoriesAsMap(callback){
        //console.log("listProductCategoriesAsMap");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productCategoryStore = transaction.objectStore(this.name);
        let openCursorRequest = productCategoryStore.openCursor();
        let allCategories={};
        let result={};
        openCursorRequest.onerror = function (event) {
            console.log(event);
        }
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            let index=1;
            if (cursor) {
                let productCategory = cursor.value;
                allCategories[productCategory.code]=productCategory;
                if(result[productCategory.code]){
                    let children=result[productCategory.code].children;
                    productCategory.children=children;
                    if(!productCategory.parentCategory){
                        result[productCategory.code]=productCategory;
                    } else {
                        result[productCategory.code]=undefined;
                    }
                }
                if(productCategory.parentCategory){
                    if(allCategories[productCategory.parentCategory]){
                        let parent=allCategories[productCategory.parentCategory];
                        if(!parent.children){
                            parent.children={};
                        }
                        parent.children[productCategory.code]=productCategory;
                        productCategory.parent=parent;
                    } else {
                        let parent = new ProductCategory(productCategory.parentCategory,"",null,index++);
                        parent.children={};
                        parent.children[productCategory.code]=productCategory;
                        productCategory.parent=parent;
                        result[productCategory.parentCategory]=parent;
                        allCategories[productCategory.parentCategory]=parent;
                    }
                } else {
                    result[productCategory.code]=productCategory;
                }
                cursor.continue();
            }
            else {
                callback(result,allCategories);
            }
        };
    }



    lookup(productCategoryCode,foundcallback,notfoundcallback){
        //console.log("lookup product category code="+productCategoryCode);
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let productCategoryStore = transaction.objectStore(this.name);
        let productCategoryRequest=productCategoryStore.get(productCategoryCode);
        productCategoryRequest.onsuccess=function(event){
            //console.log("found product with code "+productCategoryCode);
            if(productCategoryRequest.result){
                foundcallback(productRequest.result);
            } else {
                if(notfoundcallback){
                    notfoundcallback(productCategoryCode);
                }
            }
        };
        productCategoryRequest.onerror=function(event){
                console.log("error while looking up the product  :"+productCategoryRequest.error);
        };
    }

    storeProductCategoryArray(productCategories,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productCategoryStore = transaction.objectStore(this.name);
        var i=0,successes=0,errors=0;
        putNext();
        function putNext() {
            if (i<productCategories.length) {
                let p=ProductCategory.fromObject(productCategories[i]);
                i++;
                if(!p.code){
                    errors++;
                    putNext();
                } else {
                    productCategoryStore.put(p).onsuccess = putNext;
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

    storeProductCategory(productCategory,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productCategoryStore = transaction.objectStore(this.name);
        let productCategoryRequest=productCategoryStore.put(productCategory);
        productCategoryRequest.onsuccess=function(){
                //console.log('product category successfully added');
                if(callback){
                    callback(productCategory);
                }
        };
        productCategoryRequest.onerror=function(){
                console.log("error while storing the product category: "+productCategoryRequest.error);
        };
        return productCategory;
    }

    addProductCategory(code,description,parentCategory,order,callback){
        let productCategory = new ProductCategory(code,description,parentCategory,order);
        this.storeProductCategory(productCategory,callback);
        return productCategory;
    }

    deleteProductCategory(code,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let productCategoryStore = transaction.objectStore(this.name);
        let productCategoryRequest=productCategoryStore.delete(code);
        productCategoryRequest.onsuccess=function(event){
            if(event.type=="success"){
                //console.log('product category successfully deleted');
                if(callback){
                    callback();
                }
            } else {
                console.log("failed to delete the product category");
            }
        };
        productCategoryRequest.onerror=function(){
                console.log("error while deleting the product category: "+productCategoryRequest.error);
        };
    }

}
