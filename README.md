# addin-fuel-transaction-import
An add-in to read fuel card transactions from a file and import to MyGeotab database 

### Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database
```
{
  "name": "Fuel Transaction Import (by Geotab)",
  "supportEmail": "support@geotab.com",
  "version": "2.0.0",
  "items": [{
    "icon": "https://4f3465123da62bdd31d958f0ad36d9b3485a550d.googledrive.com/host/0B2gIwKD5rJDcUGZLRy12X0J5dG8/images/icon.png",
    "path": "EngineMaintenanceLink/",
    "menuName": {
      "en": "Fuel Transaction Import"
    },
    "url": "https://4f3465123da62bdd31d958f0ad36d9b3485a550d.googledrive.com/host/0B2gIwKD5rJDcUGZLRy12X0J5dG8/importFuelTransactions.html"
  }]
}
```

### Contributing
If there's a fuel card provider file you would like to add a parser for, please do! We welcome pull requests.
