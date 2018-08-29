var currentUser = null;

var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var productStore = new ProductStore(dataStore);
var accountDiv = document.getElementById("accountDiv");
dataStore.openDatabase(init);

function signout() {
    navigator.serviceWorker.controller.postMessage({ 'action': 'signout' });
    setTimeout(function () { document.location = "index.html"; }, 1000);
}

function init() {
    navigator.serviceWorker.register('service-worker.js');
    productStore.listProductAsRows(createProductTable);
    fetch("/pos/userInfo").then(response => { return response.json(); })
        .then(user => {
            currentUser = user;
            if (user && user.username.length > 0) {
                accountDiv.innerHTML = user.username + ' <button onclick="signout()">Sign Out</button>';
                if (user.admin) {
                    document.getElementById("pushToServer").style.display = "block";
                }
            } else {
                document.location = "signin.html";
            }
        }).catch(function () { document.location = "signin.html"; })
}

var table;

var reader;
var progress = document.querySelector('.percent');


document.getElementById('csvfiles').addEventListener('change', handleFileSelect, false);

function abortRead() {
    reader.abort();
}

function errorHandler(evt) {
    switch (evt.target.error.code) {
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
    reader.onabort = function (e) {
        alert('File read cancelled');
    };
    reader.onloadstart = function (e) {
        document.getElementById('progress_bar').className = 'loading';
    };
    reader.onload = function (e) {
        // Ensure that the progress bar displays 100% at the end.
        progress.style.width = '100%';
        progress.textContent = '100%';
        setTimeout("document.getElementById('progress_bar').className='';", 2000);
    }

    // Read in the image file as a binary string.
    var json = Papa.parse(evt.target.files[0],
        {
            header: true,
            complete: function (results, file) {
                console.log("Parsing complete:", results, file);
                if (results.data) {
                    productStore.storeProductArray(results.data,
                        function (successes, errors) { alert("imported " + successes + " product, ignored " + errors) });
                }
            }
        })
}


function createProductTable(rows) {
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
                        action: function () {
                            this.editCell();
                        }
                    },
                    {
                        text: "<span class='mdi mdi-lead-pencil'></span> Edit Row",
                        action: function () {
                            this.editRow();
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        text: "<span class='mdi mdi-delete'></span> Remove",
                        action: function () {
                            if (confirm("Are you sure?")) {
                                this.removeRow();
                            }
                        }
                    }
                ]
            }
        },
        data: {
            headings: ["Code", "Description", "Unit price", "Stock quantity", "Category", "Creation date"],
            data: rows
        }
    });
    table.on("editable.save.cell", function (oldValue, newValue, row) {
        console.log("editable.save.cell " + oldValue + " new=" + newValue + " row=" + row);
        productStore.addProduct(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content, row.cells[4].content);
    });
    table.on("editable.save.row", function (oldValue, row) {
        if (row.cells[0].content == oldValue.cells[0].content) {
            productStore.addProduct(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content, row.cells[4].content);
        } else {
            productStore.deleteProduct(oldValue.cells[0].content, function () {
                productStore.addProduct(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content, row.cells[4].content);
            })
        }
    });
    table.on("editable.remove.row", function (row) {
        productStore.deleteProduct(row.cells[0].content);
    });

}

var lastProductUpdate = 0;
function productCodeChanged(value) {
    lastProductUpdate = Date.now();
    console.log("productCodeChanged " + value + " lastProductUpdate=" + lastProductUpdate);
    if (value) {
        setTimeout(productCodeChangedTimeout, 150, value);
    }
}

function productCodeChangedTimeout() {
    let now = Date.now();
    let timeDiff = now - lastProductUpdate;
    if (timeDiff > 100) {
        lastProductUpdate = now;
        productCode = document.getElementById('productNumber').value;
        console.log("adding item for product " + productCode);
        addItem(productCode);
    } else {
        console.log("timeDiff=" + timeDiff);
    }
}

function addItem(productCode) {
    console.log("addItem productCode=" + productCode);
    productStore.lookup(productCode, productFoundCallback, productNotFoundCallback);
}

function productFoundCallback(product) {
    alert("product already exists")
}
function productNotFoundCallback(productCode) {
    let description = prompt("New product " + productCode + " description", "");
    if ((description === null) || (description == "")) {
        return;
    }
    let unitPrice = 0;
    let i = 3;
    while (!(unitPrice > 0) && i-- > 0) {
        let up = prompt(description + " selling price", "");
        unitPrice = +(Math.round(up + "e+2") + "e-2");
    }
    if (i == 0) {
        alert("cannot add product with price 0");
        return;
    }
    let sq = prompt(description + "quantity in stock", "1");
    let stockQuantity = +(Math.round(sq + "e+2") + "e-2");
    console.log("stockQuantity =" + stockQuantity);
    let category = undefined;
    productStore.addProduct(productCode, description, unitPrice, stockQuantity, category, productStoredCallback);
}

function productStoredCallback(product) {
    table.rows().add(Product.toRow(product));
    alert('product added');
}

function productListDownload(products) {
    let result = "data:application/json;charset=utf-8," + JSON.stringify(products, null, 2);
    let filename = "productList_" + formatDate() + ".json";
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

function excelExport(products) {
    let filename = "productList_" + formatDate() + ".csv";
    var xls = new XlsExport(products, "Product List");
    //xls.exportToXLS(filename);
    xls.exportToCSV(filename);
    return true;
}

function printPriceTags() {
    console.log(table);
    //take the rows appearing in the table (all pages)
    let rows = table.rows().instance.searchData;
    if ((rows) && (rows.length > 0)) {
        var mywindow = window.open('', 'PRINT', 'height=400,width=200');
        mywindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/>');
        mywindow.document.write('<link rel="stylesheet" type="text/css" href="css/pricetags.css">');
        mywindow.document.write('<script src="lib/JsBarcode.min.js"></script>');
        mywindow.document.write('</head><body>');
        let i = 0;
        for (let row of rows) {
            mywindow.document.write('<table class="tag_table">');
            mywindow.document.write('<tr><td colspan="2" class="desc_td">' + row.cells[1].content + '</td></tr>');
            mywindow.document.write('<tr><td><img id="barcode' + i + '"  style="width:80%;height:16mm"/></td><td class="price_td">&#8369;' + row.cells[2].content + '</td></tr>');
            mywindow.document.write('</table>');
            mywindow.document.write('<script>JsBarcode("#barcode' + i + '", ' + row.cells[0].content + ',{format: "CODE128",width:2,');
            mywindow.document.write('height:30,displayValue: false });</script>')
            i++;
        }
        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10*/
        mywindow.print();
        mywindow.close();
        return true;
    } else {
        alert("Please first filter the products to print");
    }
}

function pushFile(products) {
    if (currentUser.admin) {
        let xls = new XlsExport(products, "Product List");
        let content = xls.toBase64(xls.objectToSemicolons());

        //FIXME use configuration
        let owner = "manaty";
        let repo = "michea.github.io";

        fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/pos/data/catalog/products.csv", {
            method: 'PUT',
            mode: 'cors',
            body: {
                "path": "products.csv",
                "message": "update product list",
                "content": content,
                "sha":window.sha1(content)
            },
            headers:{
                'User-Agent': currentUser.username,
                'Content-Type': 'application/vnd.github.v3+json',
                'Authorization': 'token ' + currentUser.password
            },
            credentials: 'same-origin'
        })
            .then(response => response.text()).then(resp => { alert("pushed file:" + resp) })
    }
}