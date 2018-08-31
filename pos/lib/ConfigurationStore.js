class ConfigurationItem{
    constructor(code,description,value){
        this.code=code;
        this.description=description;
        this.value=value;
        console.log(ConfigurationItem.toRow(this).join(" "));
    }
    
    static fromObject(val){
        return new ConfigurationItem(val.code,val.description,val.value);
    }
    static toRow(obj){
        return [obj.code,obj.description,obj.value]
    }
}

class ConfigurationStore { 

    constructor(dataStore) {
        console.log("initialize configuration store");
        this.name='Configuration';
        this.keyPath='code';
        dataStore.addStore(this);
        this.dataStore=dataStore;
    }

    listConfigurationItems(callback){
        console.log("listConfigurationItems");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let store = transaction.objectStore(this.name);
        let openCursorRequest = store.openCursor();
        let configuration=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                configuration.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(configuration);
            }
        };
    }
    
    listConfigurationItemsAsRows(callback){
        console.log("listConfigurationItemsAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let store = transaction.objectStore(this.name);
        let openCursorRequest = store.openCursor();
        let configuration=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                configuration.push(ConfigurationItem.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(configuration);
            }
        };
    }


    lookup(code,foundcallback,notfoundcallback){
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let store = transaction.objectStore(this.name);
        let request=store.get(code);
        request.onsuccess=function(event){
            if(request.result){
                foundcallback(request.result);
            } else {
                if(notfoundcallback){
                    notfoundcallback(code);
                }
            }
        };
        request.onerror=function(event){
                console.log("error while looking up the configurationItem  :"+request.error);
        };
    }

    storeConfigurationArray(configuration,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let store = transaction.objectStore(this.name);
        var i=0,successes=0,errors=0;
        putNext();
        function putNext() {
            if (i<configuration.length) {
                let p=ConfigurationItem.fromObject(configuration[i]);
                i++;
                if(!p.code){
                    errors++;
                    putNext();
                } else {
                    store.put(p).onsuccess = putNext;
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

    storeConfigurationItem(configurationItem,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let store = transaction.objectStore(this.name);
        let request=store.put(configurationItem);
        request.onsuccess=function(){
                console.log('configurationItem successfully added');
                if(callback){
                    callback(configurationItem);
                }
        };
        request.onerror=function(){
                console.log("error while storing the configurationItem: "+request.error);
        };
        return productCategory;
    }

    deleteConfigurationItem(code,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let store = transaction.objectStore(this.name);
        let request=store.delete(code);
        request.onsuccess=function(event){
            if(event.type=="success"){
                console.log('config item successfully deleted');
                if(callback){
                    callback();
                }
            } else {
                console.log("failed to delete the config item");
            }
        };
        productCategoryRequest.onerror=function(){
                console.log("error while deleting the confih ite,: "+request.error);
        };
    }



}
