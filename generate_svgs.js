const fs = require('fs');
const phases = {
  'DRAW': { name: 'fase_robo', text: 'ROBO' },
  'STANDBY': { name: 'fase_espera', text: 'ESPERA' },
  'MAIN 1': { name: 'fase_principal_1', text: 'PRINCIPAL 1' },
  'BATTLE': { name: 'fase_batalla', text: 'BATALLA' },
  'MAIN 2': { name: 'fase_principal_2', text: 'PRINCIPAL 2' },
  'END': { name: 'fase_fin', text: 'FIN' }
};

if (!fs.existsSync('src/assets/phases')) {
  fs.mkdirSync('src/assets/phases', { recursive: true });
}

Object.values(phases).forEach(p => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#60a5fa;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <text x="400" y="180" font-family="'Arial Black', Impact, sans-serif" font-size="120" font-weight="900" font-style="italic" text-anchor="middle" fill="url(#grad)" stroke="#1e40af" stroke-width="4" filter="url(#glow)">${p.text}</text>
    <text x="400" y="180" font-family="'Arial Black', Impact, sans-serif" font-size="120" font-weight="900" font-style="italic" text-anchor="middle" fill="url(#grad)" stroke="#ffffff" stroke-width="1">${p.text}</text>
  </svg>`;
  fs.writeFileSync(`src/assets/phases/${p.name}.svg`, svg);
});
console.log('SVGs generated successfully!');
