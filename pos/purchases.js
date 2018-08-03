var dataStore = new DataStore("micheapos");
var purchaseStore = new PurchaseStore(dataStore);
dataStore.openDatabase(init);

function init(){
    purchaseStore.listPurchasesAsRows(createPurchaseTable);
}

var table;


function createPurchaseTable(rows){
    table = new DataTable("table", {
       searchable: true,
       fixedHeight: true,
       data:{
        headings:["Purchase#","Date","Items","Amount","Status","ref"],
           data:rows}
    });
    table.columns().sort(0,'desc');
}

function formatDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('_');
}

function purchaseListDownload(purchases){
    let result = "data:application/json;charset=utf-8," + JSON.stringify(purchases, null, 2);
    let filename = "purchaseList_"+formatDate()+".json";
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
