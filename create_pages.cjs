const fs = require('fs');
const path = require('path');

const routes = [
  'schedule',
  'customers',
  'users',
  'agencies',
  'agency-staff',
  'services',
  'calendar',
  'invoices',
  'my-invoices',
  'payments',
  'timesheets',
  'properties'
];

routes.forEach(route => {
  const dir = path.join('src', 'app', route);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const compName = route.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const content = `"use client";\n\nimport { MainLayout } from '../../components/layout/MainLayout';\n\nexport default function ${compName}Page() {\n  return (\n    <MainLayout>\n      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">\n        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Yapım Aşamasında</h2>\n        <p className="text-slate-500">Bu sayfanın tasarımı orijinal projede henüz kodlanmamış.</p>\n      </div>\n    </MainLayout>\n  );\n}\n`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

// For cleaners, we integrate CleanersPage
const cleanersDir = path.join('src', 'app', 'cleaners');
if (!fs.existsSync(cleanersDir)) fs.mkdirSync(cleanersDir, { recursive: true });
const cleanersContent = `"use client";\n\nimport { MainLayout } from '../../components/layout/MainLayout';\nimport { CleanersPage } from '../../pages/CleanersPage';\n\nexport default function CleanersRoute() {\n  return (\n    <MainLayout>\n      <CleanersPage />\n    </MainLayout>\n  );\n}\n`;
fs.writeFileSync(path.join(cleanersDir, 'page.tsx'), cleanersContent);
console.log('Pages created successfully.');
