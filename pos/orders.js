var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var orderStore = new OrderStore(dataStore);
var inventoryStore = new InventoryStore(dataStore);
var orderNumberToDelete = document.getElementById("orderNumberToDelete");
var grandTotal = document.getElementById("grandTotal");
let username=Authentication.getUsername();

document.getElementById('orderDate').valueAsDate = new Date();

if(username){
    accountDiv.innerHTML = username + ' <button onclick="Authentication.signout()">Sign Out</button>';
} else {
    document.location = "signin.html";
}
dataStore.openDatabase(init);

function init(){
    orderStore.init(()=>{
        orderNumberToDelete.max= orderStore.currentOrder.orderNumber-1;
        orderStore.listOrdersAsRows(createOrderTable);
        grandTotal.innerHTML=orderStore.grandTotal;
    });
}

var table;


function createOrderTable(rows){
    table = new DataTable("table", {
       searchable: true,
       fixedHeight: true,
       data:{
        headings:["Order#","Date","Items","Amount","Paid","Change","Status","ref"],
           data:rows}
    });
    table.columns().sort(0,'desc');
}

function daySalesDownload(){
    let date = document.getElementById('orderDate').valueAsDate;
    let formatJSON= document.getElementById('jsonRadio').checked;
    orderStore.listOrderForDate(formatJSON,date,(orders,formatJSON,date)=>{
        let result,filename;
        if(!formatJSON) {
            result = "data:text/csv;charset=utf-8," + orderStore.toCSV(orders);
            filename = "orderList_"+formatDate()+".csv";
        } else {
            result = "data:application/json;charset=utf-8," + JSON.stringify(orders, null, 2);
            filename = "orderList_"+formatDate(date)+".json";
        }
        result = encodeURI(result);
        var link = document.createElement("a");
        link.href = result;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  
    }) 
}

function orderListDownload(orders){
    let result = "data:application/json;charset=utf-8," + JSON.stringify(orders, null, 2);
    let filename = "orderList_"+formatDate()+".json";
    result = encodeURI(result);
    var link = document.createElement("a");
    link.href = result;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function purgeOrders(){
    let deleteNumber= orderNumberToDelete.value;
    if(orderStore.currentOrder.orderNumber<=deleteNumber){
        alert("cannot delete all orders, please choose an order number less than "+orderStore.currentOrder.orderNumber);
    } else {
        orderStore.purgeOrders(deleteNumber);
    }
}
