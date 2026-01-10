import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({
    language,
    code,
    onChange,
    readOnly = false,
    onCursorChange,
    remoteCursors = {},
    onEditorMount
}) => {
    const editorRef = useRef(null);
    const cursorThrottleRef = useRef(null);
    const decorationsRef = useRef([]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Call parent callback if provided
        if (onEditorMount) {
            onEditorMount(editor);
        }

        // Define custom theme matching website background
        monaco.editor.defineTheme('collabcode-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#21162E',
                'editor.lineHighlightBackground': '#1a1a2e',
                'editorLineNumber.foreground': '#6b7280',
                'editorLineNumber.activeForeground': '#a855f7',
                'editor.selectionBackground': '#2d2d44',
                'editor.inactiveSelectionBackground': '#1f1f2e',
            }
        });

        monaco.editor.setTheme('collabcode-dark');

        // Listen to cursor position changes
        if (onCursorChange) {
            editor.onDidChangeCursorPosition((e) => {
                const position = e.position;

                // Throttle cursor updates to 100ms
                clearTimeout(cursorThrottleRef.current);
                cursorThrottleRef.current = setTimeout(() => {
                    onCursorChange({
                        lineNumber: position.lineNumber,
                        column: position.column
                    });
                }, 100);
            });
        }
    };

    const handleEditorChange = (value) => {
        if (onChange && !readOnly) {
            onChange(value || '');
        }
    };

    // Render remote cursors
    useEffect(() => {
        if (!editorRef.current) return;

        const editor = editorRef.current;

        console.log('🎨 Rendering cursors:', Object.keys(remoteCursors).length, remoteCursors);

        try {
            // Create decorations for each remote cursor
            const newDecorations = Object.entries(remoteCursors).flatMap(([userId, cursor]) => {
                const { position, userName, userColor } = cursor;

                console.log(`  → User ${userName} (${userColor}) at line ${position.lineNumber}, col ${position.column}`);

                return [
                    {
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        },
                        options: {
                            afterContentClassName: `remote-cursor-caret-${userId}`,
                            hoverMessage: { value: `👤 ${userName}` }
                        }
                    }
                ];
            });

            // Apply decorations
            const ids = editor.deltaDecorations(decorationsRef.current, newDecorations);
            decorationsRef.current = ids;
            console.log('✅ Applied', ids.length, 'cursor decorations', ids);
        } catch (error) {
            console.error('❌ Error rendering cursors:', error);
        }

    }, [remoteCursors]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (cursorThrottleRef.current) {
                clearTimeout(cursorThrottleRef.current);
            }
        };
    }, []);

    return (
        <div className="code-editor-container" >
            <Editor
                height="calc(100vh - 140px)"
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="collabcode-dark"
                options={{
                    readOnly: readOnly,
                    minimap: { enabled: true },
                    fontSize: 14,
            glyphMargin: true,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true
                }}
            />
        </div>
    );
};

export default CodeEditor;
