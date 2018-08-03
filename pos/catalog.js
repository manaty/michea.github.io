var dataStore = new DataStore("micheapos");
var productStore = new ProductStore(dataStore);
dataStore.openDatabase(init);

function init(){
    productStore.listProductAsRows(createProductTable);
}

var table;


function createProductTable(rows){
    table = new DataTable("table", {
       searchable: true,
       fixedHeight: true,
       plugins: {
		editable: {
			enabled: true,
			contextMenu: true,
			hiddenColumns: true,
			menuItems: [
				{
					text: "<span class='mdi mdi-lead-pencil'></span> Edit Cell",
					action: function() {
						this.editCell();
					}
				},
				{
					text: "<span class='mdi mdi-lead-pencil'></span> Edit Row",
					action: function() {
						this.editRow();
					}
				},			
				{
					separator: true
				},
				{
					text: "<span class='mdi mdi-delete'></span> Remove",
					action: function() {
						if ( confirm("Are you sure?") ) {
							this.removeRow();
						}
					}
				}
			]
        }
       },
       data:{
        headings:["Code","Description","Unit price","Creation date"],
           data:rows}
    });
    table.on("editable.save.cell",function(oldValue,newValue,row){
        console.log("editable.save.cell "+oldValue+ " new="+newValue+" row="+row);
        productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content);
    });
    table.on("editable.save.row",function(oldValue,row){
        if(row.cells[0].content==oldValue.cells[0].content){
            productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content);
        } else {
            productStore.deleteProduct(oldValue.cells[0].content,function(){
                productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content);
            })
        }
    });
    table.on("editable.remove.row",function(row){
            productStore.deleteProduct(row.cells[0].content);
    });
			
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

function productListDownload(products){
    let result = "data:application/json;charset=utf-8," + JSON.stringify(products, null, 2);
    let filename = "productList_"+formatDate()+".json";
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


var lastProductUpdate=0;
function productCodeChanged(value){
    lastProductUpdate=Date.now();
    console.log("productCodeChanged "+value+" lastProductUpdate="+lastProductUpdate);
    if(value){
        setTimeout(productCodeChangedTimeout,150,value);
    }
}

function productCodeChangedTimeout(){
    let now=Date.now();
    let timeDiff=now-lastProductUpdate;
    if(timeDiff>100){
        lastProductUpdate=now;
        productCode=document.getElementById('productNumber').value;
        console.log("adding item for product "+productCode);
        addItem(productCode);
    } else {
        console.log("timeDiff="+timeDiff);
    }
}

function addItem(productCode){
    console.log("addItem productCode="+productCode);
    productStore.lookup(productCode,productFoundCallback,productNotFoundCallback);
}

function productFoundCallback(product){
    alert("product already exists")
}
function productNotFoundCallback(productCode){
        let description=prompt("New product "+productCode+" description","");
        if ((description === null)||(description=="")) {
            return; 
        }
        let unitPrice=0;
        let i=3;
        while(!(unitPrice>0) && i-->0){
            let up=prompt("price","");
            unitPrice=parseFloat(up).toFixed(2)
        }
        console.log("unitprice i="+i);
        if(i==0){
            alert("cannot add product with price 0");
            return;
        }
        productStore.addProduct(productCode,description,unitPrice,productStoredCallback);
}

function productStoredCallback(product){
    alert('product added');
    location.reload(); 
}