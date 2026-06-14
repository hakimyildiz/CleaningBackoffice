const fs = require('fs');
const file = 'src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace("credentials: 'include',", "credentials: 'include', cache: 'no-store',");
fs.writeFileSync(file, data);
console.log('Cache disabled');
