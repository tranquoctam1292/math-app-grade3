const fs = require('fs');
const path = require('path');

// Cấu hình giữ nguyên như trước, không cần thay đổi ở đây
const OUTPUT_FILE = 'project_context_full.txt';
const ABSOLUTE_OUTPUT_PATH = path.join(process.cwd(), OUTPUT_FILE);
const IGNORE_DIRS = [ 'node_modules', '.git', '.idea', '.vscode', 'build', 'dist', 'coverage', '.next', 'out', 'venv', '__pycache__' ];
const INCLUDE_EXTS = [ '.js', '.jsx', '.ts', '.tsx', '.py', '.css', '.scss', '.json', '.md', '.txt', '.html' ];
const IGNORE_FILES = [ 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.local', '.DS_Store', OUTPUT_FILE, 'merge_project.js' ];

function mergeFiles() {
    console.log(`\n==============================================`);
    console.log(`📂 Đang kiểm tra tại: ${process.cwd()}`);
    console.log(`💾 Dự kiến tạo file tại: ${ABSOLUTE_OUTPUT_PATH}`);
    console.log(`==============================================\n`);

    const rootDir = process.cwd();
    let fileCount = 0;
    let stream; 

    try {
        // Bước 1: Khởi tạo WriteStream. Nếu lỗi, nó sẽ bị bắt ngay tại đây (lỗi quyền ghi)
        stream = fs.createWriteStream(ABSOLUTE_OUTPUT_PATH, { flags: 'w', encoding: 'utf8' });

        stream.on('error', (err) => {
            console.error(`\n❌ LỖI WRITE STREAM (Quyền/File): Không thể ghi file!`);
            console.error(`Chi tiết lỗi: ${err.message}`);
        });

        stream.write(`PROJECT SOURCE CODE EXPORT\n`);
        stream.write(`Generated on: ${new Date().toISOString()}\n`);
        stream.write(`==========================\n\n`);

        function processDirectory(currentPath) {
            // Bước 2: Quét thư mục. Đây là nơi dễ xảy ra lỗi Permission (EACCES) nhất
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
            console.warn(`👉 Nếu file TXT vẫn không được tạo, hãy kiểm tra lại quyền ghi file (Run as Administrator)`);
        } else {
            console.log(`🎉 HOÀN TẤT! Đã gộp tổng cộng ${fileCount} file.`);
        }

    } catch (err) {
        // Bắt lỗi chung từ processDirectory (lỗi đọc file/thư mục)
        console.error(`\n❌ CHƯƠNG TRÌNH DỪNG LẠI ĐỘT NGỘT! (Lỗi đọc file/thư mục)`);
        console.error(`Lỗi chi tiết: ${err.message}`);
        console.error(`Hãy đảm bảo bạn có quyền truy cập vào tất cả các thư mục con trong dự án.`);
        if (stream) {
             stream.end(); // Đóng stream nếu nó đã được mở
        }
    }
}

mergeFiles();