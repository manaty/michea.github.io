
var totalPriceElmt = document.getElementById("totalPrice");
var totalPaidElmt = document.getElementById("totalPaid");
var totalChangeElmt = document.getElementById("totalChange");

var closedTotalPaidTR = document.getElementById("closedTotalPaidTR");
var closedTotalPaid = document.getElementById("closedTotalPaid");
var closedTotalChangeTR = document.getElementById("closedTotalChangeTR");
var closedTotalChange = document.getElementById("closedTotalChange");

var cancelledOrderNumberTR = document.getElementById("cancelledOrderNumberTR");

var cart = document.getElementById("cart");
var productCodeButton = document.getElementById("productNumber");
var manualProductCodeButton = document.getElementById("manualProductNumber");
manualProductCodeButton.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addItem(event.target.value);
    }
});
var orderSearchButton = document.getElementById("orderSearch");

orderSearchButton.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchOrder(event.target.value);
    }
});

var paymentButton = document.getElementById('paymentButton');
var paymentDiv = document.getElementById('paymentDiv');
var printReceiptButton = document.getElementById('printReceiptButton');
var categoriesDiv = document.getElementById("categoriesDiv");
var accountDiv = document.getElementById("accountDiv");


var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
var productStore = new ProductStore(dataStore);
var productCategoryStore = new ProductCategoryStore(dataStore);
var orderStore = new OrderStore(dataStore);
var purchaseStore = new PurchaseStore(dataStore);
var inventoryStore = new InventoryStore(dataStore);
dataStore.openDatabase(init);

var productCategories = new Array();
var allCategories = new Array();
var loggedUser;

function signout() {
    navigator.serviceWorker.controller.postMessage({ 'action': 'signout' });
    setTimeout(function () { document.location = "index.html"; }, 1000);
}

function init() {
    setInterval(function () {
        document.getElementById("dateTime").innerHTML = new Date();
    }, 1000);
    orderStore.init(resetGui);
    productCategoryStore.listProductCategoriesAsMap(function (categorytree, allcategories) {
        productCategories = categorytree;
        allCategories = allcategories;
        buildCategoriesDiv(productCategories, null);
        selectCategory(null);
    })
    fetch("/pos/userInfo").then(response => {
        return response.json();
    }).then(user => {
            if (user && user.username.length > 0) {
                loggedUser=user;
                accountDiv.innerHTML = user.username + ' <button onclick="signout()">Sign Out</button>';
            } else {
                document.location = "signin.html";
            }
        }).catch(function () { document.location = "signin.html"; })
}

var previousSelectedCategory = undefined;
var categoryProducts = {};
function selectCategory(event) {
    console.log("select " + this.code);
    if (this.code && !categoryProducts[this.code]) {
        productStore.listByCatetogry(this.code, addProductsToCategoryDiv);
    }
    let catDiv = document.getElementById("catDiv_")
    if (this.code) {
        catDiv = document.getElementById("catDiv_" + this.code);
    }
    let prevCatDiv = document.getElementById("catDiv_")
    if (previousSelectedCategory) {
        prevCatDiv = document.getElementById("catDiv_" + previousSelectedCategory);
    }
    prevCatDiv.style.display = "none";
    catDiv.style.display = "block";
    previousSelectedCategory = this.code;
}
//GUI function
function addProductsToCategoryDiv(category, products) {
    let catDiv = document.getElementById("catDiv_" + category);
    for (let product of products) {
        let childDiv = document.createElement("button");
        childDiv.className = "category";
        childDiv.addEventListener("click", addItem.bind(null, product.code));
        childDiv.innerHTML = product.description + " " + product.unitPrice;
        catDiv.appendChild(childDiv);
    }
    categoryProducts[category] = products;
}

function buildCategoriesDiv(productCategories, parent) {
    let catDiv = document.createElement("div");
    catDiv.className = "categoriesDiv";
    catDiv.id = "catDiv_" + (parent ? parent.code : "");
    catDiv.style.display = parent ? "none" : "block";
    categoriesDiv.appendChild(catDiv);
    if (parent) {
        let childDiv = document.createElement("button");
        childDiv.className = "category";
        childDiv.addEventListener("click", selectCategory.bind(
            {
                code: (parent.parent) ? parent.parent.code : undefined,
                type: "category"
            }
        ));
        childDiv.innerHTML = "<";
        catDiv.appendChild(childDiv);
    }
    if (productCategories != null) {
        for (let categoryName in productCategories) {
            if (productCategories.hasOwnProperty(categoryName) && productCategories[categoryName] != undefined) {
                let category = productCategories[categoryName];
                let childDiv = document.createElement("button");
                childDiv.className = "category";
                childDiv.style.backgroundImage = "url('img/categories/" + category.code + ".png')";
                childDiv.addEventListener("click", selectCategory.bind({ code: category.code, type: "category" }));
                childDiv.innerHTML = category.code;
                catDiv.appendChild(childDiv);
                if (category.hasOwnProperty("children")) {
                    buildCategoriesDiv(category.children, category);
                } else {
                    buildCategoriesDiv(null, category);
                }
            }
        }
    }
}

function updateTotalPrice() {
    totalPriceElmt.innerHTML = "&#8369;" + orderStore.currentOrder.totalPrice;
    if (orderStore.currentOrder.totalPrice > 0 && orderStore.currentOrder.status == "open") {
        paymentButton.style.display = 'block';
    } else {
        paymentButton.style.display = 'none';
    }
}

var lastProductUpdate = 0;
function productCodeChanged(value) {
    if (isNaN(value)) {
        alert("invalid code");
        return;
    }
    lastProductUpdate = Date.now();
    console.log("productCodeChanged " + value + " lastProductUpdate=" + lastProductUpdate);
    if (value) {
        setTimeout(productCodeChangedTimeout, 150, value);
    }
}

function refreshItemView(itemIndex, item) {
    document.getElementById("item_qty_" + itemIndex).innerHTML = item.quantity;
    document.getElementById("item_price_" + itemIndex).innerHTML = item.price;
    updateTotalPrice();
}

function incQuantity(itemIndex) {
    if (orderStore.currentOrder.status == "open") {
        let item = orderStore.currentOrder.increaseQuantity(itemIndex);
        orderStore.storeCurrentOrder();
        refreshItemView(itemIndex, item);
        productCodeButton.focus();
    }
}

function decQuantity(itemIndex) {
    if (orderStore.currentOrder.status == "open") {
        let item = orderStore.currentOrder.decreaseQuantity(itemIndex);
        orderStore.storeCurrentOrder();
        refreshItemView(itemIndex, item);
        productCodeButton.focus();
    }
}

function delItem(itemIndex) {
    if (orderStore.currentOrder.status == "open") {
        let r = confirm("Remove Item ?");
        if (r == true) {
            orderStore.currentOrder.deleteItem(itemIndex);
            orderStore.storeCurrentOrder();
            cart.removeChild(cart.childNodes[itemIndex]);
        }
        updateTotalPrice();
        productCodeButton.focus();
    }
}

function addItemToCart(item) {
    cart.innerHTML += '<tr id="item_' + item.index + '">'
        + '<td class="code-td" id="cart_item_' + item.code + '" index="' + item.index + '">' + item.code + '</td>'
        + '<td class="desc-td" id="item_desc_' + item.index + '">' + item.description + '</td>'
        + '<td class="unit-td">' + item.unitPrice + '</td>'
        + '<td class="qty-td" id="item_qty_' + item.index + '">' + item.quantity + '</td>'
        + '<td class="price-td" id="item_price_' + item.index + '">' + item.price + '</td>'
        + '<td class="action-td"><button onclick="incQuantity(' + item.index + ')">+</button>'
        + ' <button onclick="decQuantity(' + item.index + ')">-</button>'
        + ' <button onclick="delItem(' + item.index + ')">X</button></td>'
        + '</tr>';
    updateTotalPrice();
    productCodeButton.focus();
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

//Controler functions
function searchOrder(orderNumber) {
    if (!isNaN(orderNumber)) {
        orderStore.lookup(Number.parseInt(orderNumber), searchOrderFound, searchOrderNotFound);
        orderSearchButton.value = "";
    }
}

function searchOrderFound(orderParam) {
    orderStore.currentOrder = orderParam;
    if (orderStore.currentOrder.status != "open") {
        closedTotalPaid.innerHTML = "&#8369;" + orderStore.currentOrder.totalPaid;
        closedTotalChange.innerHTML = "&#8369;" + orderStore.currentOrder.totalChange;
    }
    resetGui();
}


function searchOrderNotFound(orderNumber) {
    alert("order " + orderNumber + " not found.");
    orderSearchButton.value = "";
}

function cancelOrder() {
    if (orderStore.currentOrder.status == "open") {
        let c = confirm("You want to delete all items ?");
        if (c == true) {
            orderStore.currentOrder.resetItems();
            orderStore.currentOrder.resetPayment();
            resetGui();
        }
    } else if (orderStore.currentOrder.status == "paid") {
        if (((new Date()) - orderStore.currentOrder.date) < 3600000) {
            let c = confirm("Cancel this order and create new one ?");
            if (c == true) {
                let im = inventoryStore.cancelOrder(orderStore.currentOrder);
                orderStore.currentOrder = orderStore.cancelOrder(orderStore.currentOrder);
                productStore.registerInventoryMovement(im);
                resetGui();
            }
        } else {
            alert("Sorry we cannot modify this order, it is too old");
        }
    } else if (orderStore.currentOrder.status == "paying") {
        let c = confirm("You want to reset payment an d continue the order?");
        if (c == true) {
            orderStore.currentOrder.resetPayment();
            orderStore.currentOrder.status = "open";
            resetGui();
        }
    } else {
        alert("This order is already cancelled.");
    }
}


function newOrder() {
    orderStore.currentOrder = orderStore.newOrder();
    resetGui();
}

function resetGui() {
    document.getElementById('orderNumber').innerHTML = orderStore.currentOrder.orderNumber;
    document.getElementById('cancelledOrderNumber').innerHTML = orderStore.currentOrder.cancelledOrderNumber;
    cart.innerHTML = "";
    if (orderStore.currentOrder.status == "open") {
        manualProductCodeButton.style.display = 'inline';
        productCodeButton.style.display = 'inline';
        paymentButton.style.display = 'none';
        paymentDiv.style.display = 'none';
        categoriesDiv.style.display = 'flex';
        cancelledOrderNumberTR.style.display = 'none';
    } else {
        manualProductCodeButton.style.display = 'none';
        productCodeButton.style.display = 'none';
        paymentButton.style.display = 'none';
        paymentDiv.style.display = 'flex';
        categoriesDiv.style.display = 'none';
        closedTotalPaidTR.style.display = 'block';
        closedTotalChangeTR.style.display = 'block';
        cancelledOrderNumberTR.style.display = 'block';
    }
    if (orderStore.currentOrder.items) {
        var index = 0;
        orderStore.currentOrder.items.map(function (item) { item.index = index++; addItemToCart(item); });
    }
    updateTotalPrice();
    productCodeButton.focus();
}

function addItem(productCode) {
    console.log("addItem productCode=" + productCode);
    productStore.lookup(productCode, productFoundCallback, productNotFoundCallback);
}

function productFoundCallback(product) {
    console.log("addItemCallback" + JSON.stringify(product));
    let cartItem = document.getElementById("cart_item_" + product.code);
    if (cartItem) {
        incQuantity(cartItem.getAttribute("index"));
    } else {
        let item = orderStore.currentOrder.addItem(product, 1);
        orderStore.storeCurrentOrder();
        addItemToCart(item);
    }
    productCodeButton.value = "";
}
function productNotFoundCallback(productCode) {
    let description = prompt("New product " + productCode + " description", "");
    if ((description === null) || (description == "")) {
        return;
    }
    let unitPrice = 0;
    let i = 3;
    while (!(unitPrice > 0) && i-- > 0) {
        let up = prompt("price", "");
        unitPrice = parseFloat(up).toFixed(2);
    }
    console.log("unitprice i=" + i);
    if (i == 0) {
        alert("cannot add product with price 0");
        return;
    }
    productStore.addProduct(productCode, description, unitPrice, 1, null, productFoundCallback);
}

function productNumberChanged(val) {
    if (val.length == 8) {
        console.log("Product to add= " + val);
    }
}

function refreshPaymentView() {
    totalPaidElmt.value = orderStore.currentOrder.totalPaid;
    totalChangeElmt.innerHTML = "&#8369;" + orderStore.currentOrder.totalChange;
    if (orderStore.currentOrder.totalChange >= 0) {
        printReceiptButton.style.display = 'block';
    } else {
        printReceiptButton.style.display = 'none';
    }
    for (let amount of [1000, 500, 200, 100, 50, 20]) {
        let node = document.getElementById("bill" + amount);
        node.innerHTML = "0";
    }
    for (let amount of [10, 5, 1, 0.25, 0.05, 0.01]) {
        let node = document.getElementById("coin" + amount);
        node.innerHTML = "0";
    }
    if (orderStore.currentOrder.paymentRecords) {

        for (let paymentRecord of orderStore.currentOrder.paymentRecords) {
            let node = document.getElementById(paymentRecord.type + paymentRecord.amount);
            node.innerHTML = "" + (Number.parseFloat(node.innerHTML) + 1);
        }
    }
}

function payOrder() {
    if (orderStore.currentOrder.status == "open") {
        orderStore.currentOrder.status = "paying";
        manualProductCodeButton.style.display = 'none';
        productCodeButton.style.display = 'none';
        paymentButton.style.display = 'none';
        orderStore.currentOrder.resetPayment();
        refreshPaymentView();
        paymentDiv.style.display = 'flex';
        categoriesDiv.style.display = 'none';
    }
}

function registerPaymentRecord(type, amount) {
    if (orderStore.currentOrder.status != "paying") {
        return;
    }
    if (orderStore.currentOrder.totalPaid >= orderStore.currentOrder.totalPrice) {
        alert("You already took enough money!");
        return;
    } else {
        orderStore.currentOrder.registerPaymentRecord(type, amount);
        refreshPaymentView();
    }

}

function undoPaymentRecord() {
    orderStore.currentOrder.undoPaymentRecord();
    refreshPaymentView();
}
function resetPaymentRecords() {
    orderStore.currentOrder.resetPayment();
    refreshPaymentView();
}

function formatAMPM(d) {
    var minutes = d.getMinutes().toString().length == 1 ? '0' + d.getMinutes() : d.getMinutes(),
        hours = d.getHours().toString().length == 1 ? '0' + d.getHours() : d.getHours(),
        ampm = d.getHours() >= 12 ? 'pm' : 'am',
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear() + ' ' + hours + ':' + minutes + ampm;
}

function printReceipt() {
    paymentDiv.style.display = 'none';
    categoriesDiv.style.display = 'flex';
    orderStore.closeOrder(orderStore.currentOrder);
    let im = inventoryStore.registerOrder(orderStore.currentOrder);
    productStore.registerInventoryMovement(im);
    var mywindow = window.open('', 'PRINT', 'height=400,width=200');
    mywindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/>');
    mywindow.document.write('<title>Receipt ' + orderStore.currentOrder.orderNumber + '</title>');
    mywindow.document.write('<link rel="stylesheet" type="text/css" href="css/receipt.css">');
    mywindow.document.write('<script src="/pos/lib/JsBarcode.min.js"></script>');
    mywindow.document.write('</head><body>');
    mywindow.document.write('<div style="text-align: center"><img src="/pos/img/receipt.png" style="width:90%;margin:0px;"/>');
    mywindow.document.write('National Highway, Bi&ntilde;an<br/>4024 Laguna<br/></div>');
    mywindow.document.write('VAT. Reg. TIN: 288-889-273<br/>http://michea.ph');
    mywindow.document.write('<div><br/><span id="currentDateTime" style="text-align: right;width: 100%">' +
        formatAMPM(orderStore.currentOrder.date) + '</span><br/>');
    mywindow.document.write('ORD# <span id="orderNumber">' + orderStore.currentOrder.orderNumber + '</span><br/>');
    if (orderStore.currentOrder.cancelledOrderNumber) {
        mywindow.document.write(' Cancelled# ' + orderStore.currentOrder.cancelledOrderNumber + '<br/>');
    }
    if (orderStore.currentOrder.vipNumber) {
        mywindow.document.write(' VIP# ' + orderStore.currentOrder.vipNumber + '<br/>');
    }
    if(loggedUser){
        mywindow.document.write(' Cashier: ' + loggedUser.username + '<br/>');
    }

    if (orderStore.currentOrder.items) {
        mywindow.document.write('<br/>Items:<br/><table class="price_table">');
        mywindow.document.write('<tr style="font-weight: bold">');
        mywindow.document.write('    <th class="desc_td">Description</th>');
        mywindow.document.write('    <th class="amnt_td" style="font-weight: bold">Qt</th>');
        mywindow.document.write('    <th  class="price_td" style="font-weight: bold">Amnt</th>');
        mywindow.document.write('</tr>');
        for (let item of orderStore.currentOrder.items) {
            mywindow.document.write('<tr><td class="desc_td">' + item.description + '</td>');
            mywindow.document.write('<td class="amnt_td">' + ((item.quantity > 1) ? item.quantity : '') + '</td>');
            mywindow.document.write('<td class="price_td">' + item.price + '</td>');
        }
        mywindow.document.write('</table>');
    }

    mywindow.document.write('<br/><table class="price_table"><tr>');
    mywindow.document.write('<td class="desc_td" style="font-weight: bold">Balance due</td>');
    mywindow.document.write('<td class="price_td" style="font-weight: bold">&#8369;' + orderStore.currentOrder.totalPrice + '</td></tr>');
    mywindow.document.write('<td class="desc_td" style="font-weight: bold">Cash</td>');
    mywindow.document.write('<td class="price_td" style="font-weight: bold">&#8369;' + orderStore.currentOrder.totalPaid + '</td></tr>');
    mywindow.document.write('<td class="desc_td" style="font-weight: bold">Change</td>');
    mywindow.document.write('<td class="price_td" style="font-weight: bold">&#8369;' + orderStore.currentOrder.totalChange + '</td></tr></table>');

    mywindow.document.write('</div><div style="text-align: center">');
    mywindow.document.write('<img id="barcode" style="width:80%;height:8mm"/>');
    mywindow.document.write('Thank you, pls come again!</div>');
    mywindow.document.write('<script>JsBarcode("#barcode", ' + orderStore.currentOrder.orderNumber + ',{format: "CODE128",width:2,');
    mywindow.document.write('height:30,displayValue: false });</script>')
    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    mywindow.print();
    mywindow.close();
    newOrder();
    return true;
}
