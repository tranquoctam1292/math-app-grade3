const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH ---
const OUTPUT_FILE = 'project_context_full.txt';

// Đường dẫn tuyệt đối của file kết quả (để bạn dễ tìm)
const ABSOLUTE_OUTPUT_PATH = path.join(process.cwd(), OUTPUT_FILE);

const IGNORE_DIRS = [
    'node_modules', '.git', '.idea', '.vscode', 
    'build', 'dist', 'coverage', '.next', 'out', 'venv', '__pycache__'
];

const INCLUDE_EXTS = [
    '.js', '.jsx', '.ts', '.tsx', 
    '.py', '.css', '.scss', 
    '.json', '.md', '.txt', '.html'
];

const IGNORE_FILES = [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
    '.env', '.env.local', '.DS_Store', 
    OUTPUT_FILE, 'merge_project.js'
];

function mergeFiles() {
    console.log(`\n📂 Đang làm việc tại thư mục: ${process.cwd()}`);
    console.log(`💾 File kết quả sẽ được lưu tại: ${ABSOLUTE_OUTPUT_PATH}`);

    const rootDir = process.cwd();
    let fileCount = 0;

    try {
        const stream = fs.createWriteStream(ABSOLUTE_OUTPUT_PATH, { flags: 'w', encoding: 'utf8' });

        stream.on('error', (err) => {
            console.error(`\n❌ LỖI NGHIÊM TRỌNG: Không thể ghi file!`);
            console.error(`Nguyên nhân: ${err.message}`);
        });

        stream.write(`PROJECT SOURCE CODE EXPORT\n`);
        stream.write(`==========================\n\n`);

        function processDirectory(currentPath) {
            const files = fs.readdirSync(currentPath);

            for (const file of files) {
                const fullPath = path.join(currentPath, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!IGNORE_DIRS.includes(file)) {
                        processDirectory(fullPath);
                    }
                } else {
                    const ext = path.extname(file);
                    // Bỏ check tên file output để tránh loop, check ở trên rồi
                    if (INCLUDE_EXTS.includes(ext) && !IGNORE_FILES.includes(file)) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const relPath = path.relative(rootDir, fullPath);

                        stream.write(`\n${'='.repeat(50)}\n`);
                        stream.write(`FILE PATH: ${relPath}\n`);
                        stream.write(`${'='.repeat(50)}\n`);
                        stream.write(content + "\n");
                        
                        console.log(`✅ Đã thêm: ${relPath}`);
                        fileCount++;
                    }
                }
            }
        }

        processDirectory(rootDir);
        stream.end();

        console.log(`\n-----------------------------------`);
        if (fileCount === 0) {
            console.warn(`⚠️  CẢNH BÁO: Script chạy xong nhưng KHÔNG tìm thấy file nào!`);
            console.warn(`👉 Hãy kiểm tra lại biến INCLUDE_EXTS xem đuôi file dự án của bạn có trong đó không.`);
        } else {
            console.log(`🎉 HOÀN TẤT! Đã gộp tổng cộng ${fileCount} file.`);
            console.log(`👉 Hãy mở file tại: ${ABSOLUTE_OUTPUT_PATH}`);
        }

    } catch (err) {
        console.error(`❌ CÓ LỖI XẢY RA: ${err.message}`);
    }
}

mergeFiles();