var dataStore = new DataStore("micheapos");
var configurationStore = new ConfigurationStore(dataStore);
dataStore.openDatabase(init);
var configurationItems=new Array();

function init(){
    configurationStore.listConfigurationItemsAsRows(createConfigurationTable);
}

var table;

function createConfigurationTable(rows){
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
        headings:["Code","Description","Value"],
           data:rows}
    });
    table.on("editable.save.cell",function(oldValue,newValue,row){
        console.log("editable.save.cell "+oldValue+ " new="+newValue+" row="+row);
        let configurationItem = new ConfigurationItem(row.cells[0].content,row.cells[1].content,row.cells[2].content);
        configurationStore.storeConfigurationItem(configurationItem);
    });
    table.on("editable.save.row",function(oldValue,row){
        if(row.cells[0].content==oldValue.cells[0].content){
            let configurationItem = new ConfigurationItem(row.cells[0].content,row.cells[1].content,row.cells[2].content);
            configurationStore.storeConfigurationItem(configurationItem);
                } else {
                    configurationStore.deleteConfigurationItem(oldValue.cells[0].content,function(){
                    let configurationItem = new ConfigurationItem(row.cells[0].content,row.cells[1].content,row.cells[2].content);
                    configurationStore.storeConfigurationItem(configurationItem);   })
        }
    });
    table.on("editable.remove.row",function(row){
        configurationStore.deleteConfigurationItem(row.cells[0].content);
    });
			
}
