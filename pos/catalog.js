var dataStore = new DataStore("micheapos");
var productStore = new ProductStore(dataStore);
dataStore.openDatabase(init);

function init(){
    productStore.listProductAsRows(createProductTable);
}

var table;

var reader;
var progress = document.querySelector('.percent');


document.getElementById('csvfiles').addEventListener('change', handleFileSelect, false);

function abortRead() {
  reader.abort();
}

function errorHandler(evt) {
  switch(evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
      alert('File Not Found!');
      break;
    case evt.target.error.NOT_READABLE_ERR:
      alert('File is not readable');
      break;
    case evt.target.error.ABORT_ERR:
      break; // noop
    default:
      alert('An error occurred reading this file.');
  };
}

function updateProgress(evt) {
  // evt is an ProgressEvent.
  if (evt.lengthComputable) {
    var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
    // Increase the progress bar length.
    if (percentLoaded < 100) {
      progress.style.width = percentLoaded + '%';
      progress.textContent = percentLoaded + '%';
    }
  }
}

function handleFileSelect(evt) {
  // Reset progress indicator on new file selection.
  progress.style.width = '0%';
  progress.textContent = '0%';

  reader = new FileReader();
  reader.onerror = errorHandler;
  reader.onprogress = updateProgress;
  reader.onabort = function(e) {
    alert('File read cancelled');
  };
  reader.onloadstart = function(e) {
    document.getElementById('progress_bar').className = 'loading';
  };
  reader.onload = function(e) {
    // Ensure that the progress bar displays 100% at the end.
    progress.style.width = '100%';
    progress.textContent = '100%';
    setTimeout("document.getElementById('progress_bar').className='';", 2000);
  }

  // Read in the image file as a binary string.
  var json=Papa.parse(evt.target.files[0], 
    {header:true,
        complete: function(results, file) {
            console.log("Parsing complete:", results, file);
            if(results.data){
                productStore.storeProductArray(results.data,
                    function(successes,errors){alert("imported "+successes+" product, ignored "+errors)});
            }
        }
    })
}


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
        headings:["Code","Description","Unit price","Stock quantity","Creation date"],
           data:rows}
    });
    table.on("editable.save.cell",function(oldValue,newValue,row){
        console.log("editable.save.cell "+oldValue+ " new="+newValue+" row="+row);
        productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content,row.cells[3].content);
    });
    table.on("editable.save.row",function(oldValue,row){
        if(row.cells[0].content==oldValue.cells[0].content){
            productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content,row.cells[3].content);
        } else {
            productStore.deleteProduct(oldValue.cells[0].content,function(){
                productStore.addProduct(row.cells[0].content,row.cells[1].content,row.cells[2].content,row.cells[3].content);
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
            let up=prompt(description+" selling price","");
            unitPrice=+(Math.round(up+ "e+2")  + "e-2");
        }
        if(i==0){
            alert("cannot add product with price 0");
            return;
        }
        let sq=prompt(description+"quantity in stock","1");
        let stockQuantity=+(Math.round(sq+ "e+2")  + "e-2");
        console.log("stockQuantity ="+stockQuantity);
        productStore.addProduct(productCode,description,unitPrice,stockQuantity,productStoredCallback);
}

function productStoredCallback(product){
    alert('product added');
    location.reload(); 
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

function excelExport(products){
    let filename = "productList_"+formatDate()+".csv";
    var xls = new XlsExport(products, "Product List");
    //xls.exportToXLS(filename);
    xls.exportToCSV(filename);
    return true;
}