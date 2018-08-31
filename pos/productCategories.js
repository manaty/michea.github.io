var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var productCategoryStore = new ProductCategoryStore(dataStore);
dataStore.openDatabase(init);
var productCategories = new Array();
var allCategories = new Array();
var accountDiv = document.getElementById("accountDiv");


function signout() {
    navigator.serviceWorker.controller.postMessage({ 'action': 'signout' });
    setTimeout(function () { document.location = "index.html"; }, 1000);
}

//TODO: get it from a PropertyStore
var categoriesCheckDelay = 3600 * 1000; //one hour
var lastCategoriesCheck = new Date(Date.now() - categoriesCheckDelay * 2); //set to 2 hours ago
var willCheckCategoriesLater = false;

function init() {
    productCategoryStore.listProductCategoriesAsRows(createProductCategoryTable);
    productCategoryStore.listProductCategoriesAsMap(function (categorytree, allcategories) {
        productCategories = categorytree;
        allCategories = allcategories;
    });
    configurationStore.fillVariableArrayWithValue([
        [categoriesCheckDelay, "categoriesCheckDelay", 3600 * 1000],
        [lastCategoriesCheck, "lastCategoriesCheck", new Date(Date.now() - categoriesCheckDelay * 2)],
        [willCheckCategoriesLater, "willCheckCategoriesLater", false]

    ]).then(function () {
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }
    );
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
                    productCategoryStore.storeProductCategoryArray(results.data,
                        function (successes, errors) { alert("imported " + successes + " product categories, ignored " + errors) });
                }
            }
        })
}


function createProductCategoryTable(rows) {
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
            headings: ["Code", "Description", "Parent Category", "Order"],
            data: rows
        }
    });
    table.on("editable.save.cell", function (oldValue, newValue, row) {
        console.log("editable.save.cell " + oldValue + " new=" + newValue + " row=" + row);
        productCategoryStore.addProductCategory(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content);
    });
    table.on("editable.save.row", function (oldValue, row) {
        if (row.cells[0].content == oldValue.cells[0].content) {
            productCategoryStore.addProductCategory(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content);
        } else {
            productCategoryStore.deleteProductCategory(oldValue.cells[0].content, function () {
                productCategoryStore.addProductCategory(row.cells[0].content, row.cells[1].content, row.cells[2].content, row.cells[3].content);
            })
        }
    });
    table.on("editable.remove.row", function (row) {
        productCategoryStore.deleteProductCategory(row.cells[0].content);
    });

}
function productCategoryCodeChanged(value) {
    productCategoryCode = document.getElementById('productCategoryNumber').value;
    console.log("adding item for product category " + productCategoryCode);
    addItem(productCategoryCode);
}

function addItem(productCategoryCode) {
    console.log("addItem productCategoryCode=" + productCategoryCode);
    productCategoryStore.lookup(productCategoryCode, productFoundCallback, productNotFoundCallback);
}

function productFoundCallback(productCategory) {
    alert("product category already exists")
}
function productNotFoundCallback(productCategoryCode) {
    let description = prompt("New product category " + productCategoryCode + " description", "");
    if ((description === null) || (description == "")) {
        return;
    }
    let parent = prompt("New product category " + productCategoryCode + " parent", "");
    let order = prompt("New product category " + productCategoryCode + " oreder", "1");
    productCategoryStore.addProductCategory(productCategoryCode, description, parent, order, productCategoryStoredCallback);
}

function productCategoryStoredCallback(productCategory) {
    table.rows().add(ProductCategory.toRow(productCategory));
    table.render();
    alert('product category added');
}

function productCategoryListDownload(products) {
    let result = "data:application/json;charset=utf-8," + JSON.stringify(products, null, 2);
    let filename = "categories_" + formatDate() + ".json";
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

function excelExport(productCategories) {
    let filename = "categories_" + formatDate() + ".csv";
    var xls = new XlsExport(productCategories, "Product Category List");
    //xls.exportToXLS(filename);
    xls.exportToCSV(filename);
    return true;
}


var github_owner = "manaty";
var github_repo = "michea.github.io";
var fileSha = null;
var previousCategories = null;

function updateOnlineStatus(event) {
    if (navigator.onLine) {
        // handle online status
        if ((Date.now() - lastCategoriesCheck) > categoriesCheckDelay) {
            willCheckCategoriesLater = false;
            console.log('online, checking categories');
            let githubAccess=new GithubContentsApiV3(github_owner,github_repo,currentUser.username, currentUser.password);
            githubAccess.retrieveGithubFileSha("pos/data/catalog/categories.csv").then((resp) => {
                    if(fileSha != resp.sha){
                        fileSha = resp.sha;
                        previousCategories = XlsExport.fromBase64(resp.content);
                        Papa.parse(previousCategories,
                            {
                                header: true,
                                complete: function (results, file) {
                                    if (results.data) {
                                        console.log("storing categories:" + results.data);
                                        productCategoryStore.storeProductCategoryArray(results.data,
                                            function (successes, errors) {
                                                alert("imported " + successes + " categories, ignored " + errors);
                                                table.render();
                                            });
                                    }
                                }
                            }
                        )
                    }
                }
            ).catch((e) => { alert(e) });
        } else {
            console.log('online but it not yet time to check if the categories have been updated');
            if (!willCheckCategoriesLater) {
                willCheckCategoriesLater = true;
                setTimeout(updateOnlineStatus, timeout);
            }
        }
    } else {
        // handle offline status
        console.log('offline');
    }
}

function pushFile(productCategories) {
    if (currentUser.admin && productFileSha) {
        let xls = new XlsExport(productCategories, "Product Category List");
        let content = XlsExport.toBase64(xls.objectToSemicolons());
        let githubAccess=new GithubContentsApiV3(github_owner,github_repo,currentUser.username, currentUser.password);
        githubAccess.updateGithubFile("pos/data/catalog/categories.csv",content, fileSha).then((resp)=>{
            console.log("received response" + JSON.stringify(resp));
            if (!resp.content) {
                fileSha = resp.content.sha;
                alert("pushed file: " + resp.content.name);
            } else {
                alert("error while pushing file :" + resp.message);
            }
        }).catch((m,e)=>alert(m+e));
    }
}


