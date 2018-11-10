var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var orderStore = new OrderStore(dataStore);
var inventoryStore = new InventoryStore(dataStore);
var orderNumberToDelete = document.getElementById("orderNumberToDelete");
let username=Authentication.getUsername();
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

function orderListDownload(orders){
    let result = "data:application/json;charset=utf-8," + JSON.stringify(orders, null, 2);
    let filename = "orderList_"+formatDate()+".json";
    result = encodeURI(result);
      // Create a link to trigger the download
    var link = document.createElement("a");
    link.href = result;
    link.download = filename;

    // Append the link
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Remove the link
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
