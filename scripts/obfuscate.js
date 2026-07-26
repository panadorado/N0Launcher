const fs = require('fs-extra');
const path = require('path');
const { obfuscate } = require('javascript-obfuscator');

const config = {
    // Cấu hình an toàn & cân bằng
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.45,        // Không quá cao để tránh lag
    deadCodeInjection: false,                    // Tắt để an toàn
    debugProtection: false,                      // Tắt để tránh crash
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    selfDefending: false,                        // Tắt để ổn định hơn
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.8,
    transformObjectKeys: true,
    
    // Bỏ qua một số file nhạy cảm
    ignoreRequireImports: true,
};

const foldersToObfuscate = [
    { path: '../dist/renderer/assets', name: 'renderer' },   // Obfuscate mạnh
    { path: '../dist/core', name: 'core' },                   // Obfuscate vừa
    { path: '../dist/utils', name: 'utils' },
    // { path: '../dist/main', name: 'main' },                // Không obfuscate main (an toàn nhất)
    // { path: '../dist/preload', name: 'preload' },         // Không obfuscate preload
];

async function obfuscateFolder(folderPath, folderName) {
    if (!fs.existsSync(folderPath)) {
        console.log(`⚠️ Bỏ qua ${folderName} (không tồn tại)`);
        return;
    }

    const files = await fs.readdir(folderPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    let count = 0;
    for (const file of jsFiles) {
        const filePath = path.join(folderPath, file);
        let code = await fs.readFile(filePath, 'utf8');

        if (code.length < 600) continue;

        try {
            const result = obfuscate(code, config);
            await fs.writeFile(filePath, result.getObfuscatedCode());
            console.log(`   ✓ Obfuscated ${folderName}: ${file}`);
            count++;
        } catch (err) {
            console.warn(`   ⚠️ Lỗi ${folderName}/${file}:`, err.message);
        }
    }
    console.log(`   Hoàn tất ${folderName} (${count} files)`);
}

async function run() {
    console.log('🔒 Bắt đầu obfuscate (chế độ an toàn)...');
    
    for (const folder of foldersToObfuscate) {
        await obfuscateFolder(path.join(__dirname, folder.path), folder.name);
    }

    console.log('✅ Obfuscate hoàn tất!');
}

run().catch(console.error);