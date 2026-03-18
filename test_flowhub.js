fetch('https://api.flowhub.com/v0/inventoryNonZero', {
    headers: {
        'clientId': 'b76eaed3-e036-433a-b4ab-2d32b5ca4c69',
        'key': '9696b127-4e84-4229-a6cc-1fbd2a7e9ec6',
        'Accept': 'application/json'
    }
}).then(res => res.json()).then(data => {
    let inventory = [];
    if (Array.isArray(data.data)) inventory = data.data;
    else if (Array.isArray(data)) inventory = data;
    console.log("Total items:", inventory.length);
    const noSku = inventory.filter(i => !i.sku).length;
    console.log("Items with no sku:", noSku);
    const sample = inventory.slice(0, 3).map(i => ({ category: i.category, name: i.productName, sku: i.sku }));
    console.log("Sample:", sample);
    
    // Check mt-pleasant location
    const mtP = inventory.filter(i => i.locationId === '96de8175-4e2f-448a-aa93-02152d35eccd');
    console.log("mt-pleasant total items:", mtP.length);
    
    const categories = mtP.map(i => i.category);
    const uniqueCats = [...new Set(categories)];
    console.log("Categories in mt-pleasant:", uniqueCats);
}).catch(console.error);
