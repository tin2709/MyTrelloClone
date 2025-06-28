// src/components/DescriptionEditor.tsx

'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';
import {
    LuBold, LuItalic, LuStrikethrough, LuList, LuListOrdered,
    LuHeading1, LuHeading2
} from 'react-icons/lu';

// --- Toolbar Component ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const Button = ({ onClick, children, isActive }: { onClick: () => void, children: React.ReactNode, isActive?: boolean }) => (
        <button
            onClick={onClick}
            type="button"
            className={`p-1.5 rounded-md hover:bg-gray-300 ${isActive ? 'bg-gray-300 text-black' : 'text-gray-600'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-200/80 rounded-t-md">
            <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
                <LuBold size={18} />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
                <LuItalic size={18} />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
                <LuStrikethrough size={18} />
            </Button>
            <div className="w-[1px] h-5 bg-gray-400 mx-1"></div>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
                <LuHeading1 size={18} />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
                <LuHeading2 size={18} />
            </Button>
            <div className="w-[1px] h-5 bg-gray-400 mx-1"></div>
            <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                <LuList size={18} />
            </Button>
            <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                <LuListOrdered size={18} />
            </Button>
        </div>
    );
};


// --- Main Editor Component ---
interface DescriptionEditorProps {
    initialContent: string;
    onSave: (htmlContent: string) => void;
    onCancel: () => void;
}

export const DescriptionEditor = ({ initialContent, onSave, onCancel }: DescriptionEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Tắt các extension không cần thiết nếu muốn
                // heading: false,
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none p-3 min-h-[120px] rounded-b-md border border-t-0 border-gray-300 bg-white',
            },
        },
    });

    const handleSaveClick = () => {
        if (editor) {
            onSave(editor.getHTML());
        }
    };

    return (
        <div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={handleSaveClick}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Lưu
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-transparent rounded-md hover:bg-gray-200"
                >
                    Hủy
                </button>
            </div>
        </div>
    );
};