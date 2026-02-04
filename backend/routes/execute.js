import express from 'express';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to check if a command exists
const commandExists = (command) => {
    return new Promise((resolve) => {
        exec(`which ${command}`, (error) => {
            resolve(!error);
        });
    });
};

// Helper function to get installation instructions
const getInstallInstructions = (language) => {
    const instructions = {
        javascript: 'Install Node.js:\n  Ubuntu/Debian: sudo apt-get install nodejs\n  macOS: brew install node',
        python: 'Install Python 3:\n  Ubuntu/Debian: sudo apt-get install python3\n  macOS: brew install python',
        java: 'Install Java JDK:\n  Ubuntu/Debian: sudo apt-get install default-jdk\n  macOS: brew install openjdk',
        go: 'Install Go:\n  Ubuntu/Debian: sudo apt-get install golang\n  macOS: brew install go',
        rust: 'Install Rust:\n  curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
        typescript: 'Install TypeScript:\n  npm install -g typescript'
    };
    return instructions[language] || 'Please install the required compiler/interpreter';
};

// Helper function to execute code
const executeCode = (command, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const process = exec(command, { timeout }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    reject(new Error('Execution timeout (5 seconds exceeded)'));
                } else {
                    resolve({ stdout, stderr, error: error.message });
                }
            } else {
                resolve({ stdout, stderr, error: null });
            }
        });
    });
};

// POST /api/execute - Execute code
router.post('/', async (req, res) => {
    const { code, language, filename } = req.body;

    if (!code || !language) {
        return res.status(400).json({
            success: false,
            message: 'Code and language are required'
        });
    }

    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    try {
        let command;
        let tempFile;
        let outputFile;
        let result;

        switch (language.toLowerCase()) {
            case 'javascript':
                if (!(await commandExists('node'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Node.js is not installed on the server',
                        output: getInstallInstructions('javascript')
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.js`);
                await fs.writeFile(tempFile, code);
                command = `node "${tempFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                break;

            case 'python':
                if (!(await commandExists('python3'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Python 3 is not installed on the server',
                        output: getInstallInstructions('python')
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.py`);
                await fs.writeFile(tempFile, code);
                command = `python3 "${tempFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                break;

            case 'java':
                if (!(await commandExists('javac'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Java JDK is not installed on the server',
                        output: getInstallInstructions('java')
                    });
                }
                // Extract class name from code (look for public class ClassName)
                const classMatch = code.match(/public\s+class\s+(\w+)/);
                const className = classMatch ? classMatch[1] : (filename ? filename.replace('.java', '') : 'Main');

                tempFile = path.join(tempDir, `${className}.java`);
                const classFile = path.join(tempDir, `${className}.class`);
                await fs.writeFile(tempFile, code);
                command = `cd "${tempDir}" && javac "${className}.java" && java ${className}`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                await fs.unlink(classFile).catch(() => { });
                break;

            case 'cpp':
                if (!(await commandExists('g++'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'G++ compiler is not installed on the server',
                        output: 'Install G++:\n  Ubuntu/Debian: sudo apt-get install g++\n  macOS: xcode-select --install'
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.cpp`);
                outputFile = path.join(tempDir, `temp_${timestamp}_${randomId}`);
                await fs.writeFile(tempFile, code);
                command = `g++ "${tempFile}" -o "${outputFile}" && "${outputFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                await fs.unlink(outputFile).catch(() => { });
                break;

            case 'go':
                if (!(await commandExists('go'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Go is not installed on the server',
                        output: getInstallInstructions('go')
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.go`);
                await fs.writeFile(tempFile, code);
                command = `go run "${tempFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                break;

            case 'rust':
                if (!(await commandExists('rustc'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rust is not installed on the server',
                        output: getInstallInstructions('rust')
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.rs`);
                outputFile = path.join(tempDir, `temp_${timestamp}_${randomId}`);
                await fs.writeFile(tempFile, code);
                command = `rustc "${tempFile}" -o "${outputFile}" && "${outputFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                await fs.unlink(outputFile).catch(() => { });
                break;

            case 'typescript':
                if (!(await commandExists('tsc'))) {
                    return res.status(400).json({
                        success: false,
                        message: 'TypeScript is not installed on the server',
                        output: getInstallInstructions('typescript')
                    });
                }
                tempFile = path.join(tempDir, `temp_${timestamp}_${randomId}.ts`);
                const jsFile = path.join(tempDir, `temp_${timestamp}_${randomId}.js`);
                await fs.writeFile(tempFile, code);
                command = `tsc "${tempFile}" && node "${jsFile}"`;
                result = await executeCode(command);
                await fs.unlink(tempFile).catch(() => { });
                await fs.unlink(jsFile).catch(() => { });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Unsupported language: ${language}`
                });
        }

        // Combine stdout and stderr
        let output = '';
        if (result.stdout) output += result.stdout;
        if (result.stderr) output += result.stderr;
        if (result.error && !result.stdout && !result.stderr) output = result.error;

        res.json({
            success: true,
            output: output || 'Code executed successfully (no output)',
            error: result.error
        });

    } catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Code execution failed',
            output: '',
            error: error.message
        });
    }
});

export default router;
