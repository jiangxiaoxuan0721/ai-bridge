const fs = require('fs');
const path = require('path');

/**
 * 根据文件扩展名确定语言ID
 * @param {string} extension 文件扩展名
 * @returns {string} 语言ID
 */
function getLanguageId(extension) {
    // Common file extensions and their language IDs
    const languageMap = {
        '.js': 'javascript',
        '.jsx': 'javascriptreact',
        '.ts': 'typescript',
        '.tsx': 'typescriptreact',
        '.py': 'python',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cc': 'cpp',
        '.cxx': 'cpp',
        '.h': 'c',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.xml': 'xml',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.md': 'markdown',
        '.sql': 'sql',
        '.sh': 'shellscript',
        '.bash': 'shellscript',
        '.zsh': 'shellscript',
        '.fish': 'shellscript',
        '.vue': 'vue',
        '.dockerfile': 'dockerfile',
        '.gitignore': 'gitignore',
        '.env': 'properties',
        '.ini': 'ini',
        '.log': 'log'
    };
    
    // Normalize extension to lowercase
    extension = extension.toLowerCase();
    
    // Return the mapped language ID or 'plaintext' if not found
    return languageMap[extension] || 'plaintext';
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 读取文件夹内容
 * @param {string} dirPath 文件夹路径
 * @returns {Array} 文件夹内容列表
 */
function readDirectory(dirPath) {
    const files = [];
    
    try {
        // 读取文件夹内容
        const items = fs.readdirSync(dirPath);
        
        // 获取每个文件/子文件夹的信息
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            files.push({
                name: item,
                path: itemPath,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                lastModified: stats.mtime.toISOString()
            });
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        throw error;
    }
    
    return files;
}

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {string} 文件内容
 */
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

module.exports = {
    getLanguageId,
    debounce,
    readDirectory,
    readFileContent
};