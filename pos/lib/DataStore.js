class DataStore{
    
    constructor(dbName){
        this.stores=[];
        this.dbName=dbName;
    }

    addStore(store){
        this.stores.push(store);
    }

    openDatabase(callback){
        console.log("openDatabase");
        let request = window.indexedDB.open(this.dbName,24);
        request.onupgradeneeded = (function(event) {
            console.log("create/upgrade db");
            let upgradeTransaction = event.target.transaction;
          this.database = request.result;
          console.log(JSON.stringify(this.database.objectStoreNames));
          for(let store of this.stores){
            let dbstrore=null;   
            if(!this.database.objectStoreNames.contains(store.name)){
                console.log("create "+store.name+" store");
               dbstrore=this.database.createObjectStore(store.name, {keyPath: store.keyPath});
            }{
                dbstrore=upgradeTransaction.objectStore(store.name);
                //this.database.deleteObjectStore(store.name);
                console.log("store "+store.name+" was already present in db");  
            }
            if(store.indexDefinitions){ 
                for(let indexDef of store.indexDefinitions){
                    console.log("testing index "+indexDef.name+" of store"+store.name+"...");
                    if(!dbstrore.indexNames.contains(indexDef.name)){
                        console.log("...not present, creating it");
                        dbstrore.createIndex(indexDef.name,indexDef.keyName,indexDef.params);
                    } else {
                        console.log("...already present, skiping it");
                    }
                }
            }
          }
        }).bind(this);
        request.onsuccess = (function() {
            this.database = request.result;
            console.log("db opened, it contains "+this.database.objectStoreNames.length+" stores");
            for(let storeName of this.database.objectStoreNames){
                console.log("found store "+storeName);
                //this.database.transaction(storeName,'readwrite').objectStore(storeName).clear();
            }
            callback();
        }).bind(this);
        request.onerror = function (evt) {
            console.error("openDatabase:", evt.target.errorCode);
        };
    }

}