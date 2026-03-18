import https from 'https';

const options = {
  hostname: 'api.flowhub.com',
  port: 443,
  path: '/v0/inventoryNonZero',
  method: 'GET',
  headers: {
    'clientId': 'b76eaed3-e036-433a-b4ab-2d32b5ca4c69',
    'key': '9696b127-4e84-4229-a6cc-1fbd2a7e9ec6',
    'Accept': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    let inventory = [];
    try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.data)) inventory = parsed.data;
        else if (Array.isArray(parsed)) inventory = parsed;
    } catch(e) {
        console.error(e);
        return;
    }
    
    // Check mt-pleasant location
    const mtP = inventory.filter(i => i.locationId === '96de8175-4e2f-448a-aa93-02152d35eccd');
    
    const categories = mtP.map(i => i.category);
    const uniqueCats = [...new Set(categories)];
    console.log("Categories in mt-pleasant:", uniqueCats);

    // Check for duplicate SKUs inside the SAME category
    const skuMap = {};
    let dupes = 0;
    mtP.forEach(i => {
        if (!i.sku) return;
        if (skuMap[i.sku]) {
            dupes++;
        } else {
            skuMap[i.sku] = true;
        }
    });
    console.log("Duplicate SKUs within Flowhub response:", dupes);

  });
});
req.on('error', console.error);
req.end();
