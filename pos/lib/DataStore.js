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
        let request = window.indexedDB.open(this.dbName,9);
        request.onupgradeneeded = (function() {
            console.log("create/upgrade db");
          this.database = request.result;
          console.log(JSON.stringify(this.database.objectStoreNames));
          for(let store of this.stores){
            if(!this.database.objectStoreNames.contains(store.name)){
                console.log("create "+store.name+" store");
              let dbstrore=this.database.createObjectStore(store.name, {keyPath: store.keyPath});
            }{
                //this.database.deleteObjectStore(store.name);
                console.log("store "+store.name+" was already present in db");  
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