// 批量替換 window.innerWidth 為 isMobile 變數
import fs from 'fs';

const filePath = 'c:\\TanaPOS\\tanapos-v4-mini\\src\\components\\NewPOSSystem.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 替換所有 window.innerWidth <= 768 為 isMobile
content = content.replace(/window\.innerWidth <= 768/g, 'isMobile');

// 替換所有 window.innerWidth > 768 為 !isMobile
content = content.replace(/window\.innerWidth > 768/g, '!isMobile');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 已完成替換所有 window.innerWidth 檢查為 isMobile 變數');
console.log('🔍 替換內容:');
console.log('- window.innerWidth <= 768 → isMobile');
console.log('- window.innerWidth > 768 → !isMobile');
