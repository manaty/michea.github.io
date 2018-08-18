class OrderItem{
    construtor(){
        this.unitPrice=0;
        this.quantity=1;
    }

    static deserializeJson(val){
        let ot = new OrderItem();
        ot.code=val.code;
        ot.unitPrice=val.unitPrice;
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

    setUnitPrice(unitPrice){
        if(unitPrice!=this.unitPrice){
            this.unitPrice=unitPrice;
            this.computePrice();
        }
        return this;
    }

    computePrice(){
        this.price = +(Math.round(this.quantity*this.unitPrice+ "e+2")  + "e-2");
    }
}

class PaymentRecord{
    constructor(type,amount){
        this.type=type;
        this.amount=amount;
    }
}

class Order{
    constructor(orderNumber){
        this.orderNumber=orderNumber;
        this.date= new Date();
        this.items=new Array();
        this.paymentRecords=new Array();
        this.totalPaid=0;
        this.totalChange=0;
        this.totalPrice=0;
        this.status="open";
        this.cancelledOrderNumber=null;
        this.ammendingOrderNumber=null;
        this.lastUpdate=null;
    }

    static deserializeJson(val){
        let o = new Order(val.orderNumber);
        o.date= val.date;
        if(val.items){
            o.items=val.items.map(function(itemJson){return OrderItem.deserializeJson(itemJson);});
        }
        if(val.paymentRecords){
            o.paymentRecords=val.paymentRecords.map(function(paymentRecordJson){
                return new PaymentRecord(paymentRecordJson.type,paymentRecordJson.amount);
            });
        }
        o.totalPaid=val.totalPaid;
        o.totalChange=val.totalChange;
        o.totalPrice=val.totalPrice;
        o.status=val.status;
        o.canceledOrderNumber=val.canceledOrderNumber;
        o.ammendingOrderNumber=val.ammendingOrderNumber;
        o.lastUpdate=val.lastUpdate;
        return o;
    }

    static toRow(order){
        return [order.orderNumber,order.date,order.items.map(function(item){
            return item.description+'['+item.quantity+']';
        }).join(","),order.totalPrice,order.totalPaid,order.totalChange,order.status,
        (order.cancelledOrderNumber==null?'':order.cancelledOrderNumber)
        +''+(order.ammendingOrderNumber==null?'':order.ammendingOrderNumber)]

    }

    addItem(product,quantity){
        let result= new OrderItem();
        result.setCode(product.code).setDescription(product.description)
        .setQuantity(quantity).setUnitPrice(product.unitPrice);
        let index=this.items.push(result);
        result.index=index-1;
        this.totalPrice+=result.price;
        this.lastUpdate=new Date();
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
        let oldPrice=result.price;
        result.setQuantity(result.quantity+1);
        this.totalPrice+=result.price-oldPrice;
        this.lastUpdate=new Date();
        return result;
    }

    decreaseQuantity(index){
        let result=this.items[index];
        let oldPrice=result.price;
        if(result.quantity>1){
            result.setQuantity(result.quantity-1);
            this.totalPrice+=result.price-oldPrice;
            this.lastUpdate=new Date();
        }
        return result;
    }

    updateItemQuantity(index,quantity){
        let result=this.items[index];
        let oldPrice=result.price;
        result.setQuantity(quantity);
        this.totalPrice+=result.price-oldPrice;
        this.lastUpdate=new Date();
        return result;
    }

    deleteItem(index){
        let result=this.items[index];
        let oldPrice=result.price;
        this.items.splice(index, 1);
        this.totalPrice-=oldPrice;
        this.lastUpdate=new Date();
        return result;
    }
    
    resetItems(){  
        this.items=new Array();
        this.totalPrice=0;
        this.lastUpdate=new Date();
    }

    registerPaymentRecord(type,amount){
        let paymentRecord = new PaymentRecord(type,amount);
        this.paymentRecords.push(paymentRecord);
        this.updateTotalPaid(this.totalPaid+amount);
        this.lastUpdate=new Date();
    }

    undoPaymentRecord(){
        let paymentRecord = this.paymentRecords.pop();
        if(paymentRecord){
            this.updateTotalPaid(this.totalPaid-paymentRecord.amount);
        } else {
            this.resetPayment();
        }
        this.lastUpdate=new Date();
    }

    resetPayment(){
        this.paymentRecords=new Array();
        this.updateTotalPaid(0);
        this.lastUpdate=new Date();
    }


    updateTotalPaid(amount){
        this.totalPaid=amount;
        this.totalChange=this.totalPaid-this.totalPrice;
        this.lastUpdate=new Date();
    }
}

class OrderStore{
    constructor(dataStore) {
        console.log("create order store class instance");
        this.name='Order';
        this.keyPath='orderNumber'
        dataStore.addStore(this);
        this.dataStore=dataStore;
        this.orderIndex=Number.parseInt("1"+new Date().getFullYear().toString().substr(-2)+"00000");
        this.currentOrder=null;
    }

    init(callback){
        console.log("init order store instance db="+this.dataStore.database);
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor(null, 'prev');
        openCursorRequest.onsuccess = (function (event) {
            let cursor = event.target.result;
            if (cursor) {
                this.currentOrder=Order.deserializeJson(cursor.value);
                this.orderIndex = this.currentOrder.orderNumber; 
                if(cursor.value.status!="open"){
                    this.currentOrder=this.newOrder();
                }
                if(callback){
                    callback();
                }
            } else if(callback){
                this.currentOrder=this.newOrder();
                callback();
            }
        }).bind(this);
    }

    listOrders(callback){
        console.log("listOrders");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let orders=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                orders.push(cursor.value);
                cursor.continue();
            }
            else {
                callback(orders);
            }
        };
    }
    
    listOrdersAsRows(callback){
        console.log("listOrdersAsRows");
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let openCursorRequest = orderStore.openCursor();
        let orders=new Array();
        openCursorRequest.onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                orders.push(Order.toRow(cursor.value));
                cursor.continue();
            }
            else {
                callback(orders);
            }
        };
    }


    lookup(orderNumber,foundcallback,notfoundcallback){
        let transaction = this.dataStore.database.transaction(this.name,'readonly');
        let orderStore = transaction.objectStore(this.name);
        let orderRequest=orderStore.get(orderNumber);
        orderRequest.onsuccess=function(event){
            console.log("found order with number "+orderNumber);
            if(orderRequest.result){
                foundcallback(Order.deserializeJson(orderRequest.result));
            } else {
                notfoundcallback(orderNumber);
            }
        };
        orderRequest.onerror=function(event){
                console.log("error while looking up the order :"+orderRequest.error);
        };
    }

    storeCurrentOrder(callback){
        this.storeOrder(this.currentOrder,callback);
    }

    storeOrder(order,callback){
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let orderStore = transaction.objectStore(this.name);
        let orderRequest=orderStore.put(order);
        orderRequest.onsuccess=function(){
                console.log('order successfully stored');
                if(callback){
                    callback(order);
                }
        };
        orderRequest.onerror=function(){
                console.log("error while storing the order: "+orderRequest.error);
        };
        return order;
    }

    closeOrder(order,callback){
        order.status="paid";
        order.date= new Date();
        let transaction = this.dataStore.database.transaction(this.name,'readwrite');
        let orderStore = transaction.objectStore(this.name);
        let orderRequest=orderStore.put(order);
        orderRequest.onsuccess=function(){
                console.log('order successfully closed');
                if(callback){
                    callback(order);
                }
        };
        orderRequest.onerror=function(){
                console.log("error while closing the order: "+orderRequest.error);
        };
        return order;
    }

    newOrder(){
        if(this.currentOrder && (this.currentOrder.status=="open")){
            throw "current order is still open";
        }
        let order=new Order(++this.orderIndex);
        this.storeOrder(order,null);
        return order;
    }

    cancelOrder(orderToClose){
        if(orderToClose.status!='paid'){
            throw "Cannot cancel an order that is "+orderToClose.status;
        }
        if(((new Date()) - orderToClose.date) < 3630000){
            let transaction = this.dataStore.database.transaction(this.name,'readwrite');
            let orderStore = transaction.objectStore(this.name);
            let order=Order.deserializeJson(orderToClose);
            order.orderNumber=++this.orderIndex;
            orderToClose.ammendingOrderNumber=order.orderNumber;
            orderToClose.status="cancelled";
            order.cancelledOrderNumber=orderToClose.orderNumber;
            order.resetPayment();
            order.status="open";
            orderStore.put(orderToClose);
            orderStore.put(order);
            return order;
        } else {
            throw "Too late to cancel the order";
        } 
    }
}