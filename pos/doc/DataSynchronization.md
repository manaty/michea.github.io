# Data Synchronization
When you open the Pos in some browser window, the catalog, orders, purchases... are stored in a local database.
This is why when you open in on a new computer or a new browser, your catalog or order history will be empty.

By hosting the Pos files on github, you will be able to save your data as files so they can be synchronized to all the Pos instance you use.

Github provides free hosting for opensource websites, in order to follow the opensource principles, the catalog (including inventory and selling price) will be stored in an open format (anyone can read it).
If you dont want your catalog to be open, please contact us for the closed edition of the software.

The sales (orders) and puchases, although stored on public github servers are encrypted with a password.

## Catalog storage
Catalog comes as 2 files, one file list all categories and one file list all products.
When the Pos is open it check the last Catalog Synchronization Date (CSD) and list the catalog files present on the server (in the directory /pos/data/catalog) 

### Catagory files

The categories are stored in a file named "categories.csv"

each time the category page is displayed (and if you are online, or when you come online) category file metadata is read. if the date of the last commit is greater that the last local download date then a popup propose to download and merge the categories from the server. 
