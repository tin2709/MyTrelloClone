// src/components/DescriptionEditor.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    LuBold, LuItalic, LuList, LuChevronDown, LuLink2,
    LuImage, LuPlus, LuAtSign, LuSmile, LuCode, LuQuote, LuSearch, LuMoveHorizontal
} from 'react-icons/lu';

// --- HOOK TÙY CHỈNH: Đóng khi click ra ngoài ---
const useClickOutside = (ref: React.RefObject<HTMLDivElement | null>, handler: () => void) => { // <--- SỬA Ở ĐÂY

    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
        };
    }, [ref, handler]);
};

// --- COMPONENT CHUNG: Dropdown Menu ---
interface DropdownMenuProps {
    buttonContent: React.ReactNode;
    children: React.ReactNode;
}
const DropdownMenu = ({ buttonContent, children }: DropdownMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 p-2 rounded-md hover:bg-gray-200 ${isOpen ? 'bg-gray-300' : ''}`}
            >
                {buttonContent}
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-72 bg-white rounded-md shadow-lg border z-10">
                    {children}
                </div>
            )}
        </div>
    );
};


// --- CÁC DROPDOWN CỤ THỂ ---

const HeadingDropdown = ({ editor }: { editor: Editor }) => {
    const options = [
        { label: 'Văn bản bình', command: () => editor.chain().focus().setParagraph().run(), style: 'font-normal', shortcut: 'Ctrl+Alt+0' },
        { label: 'Heading 1', command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), style: 'text-2xl font-bold', shortcut: 'Ctrl+Alt+1', isActive: editor.isActive('heading', { level: 1 }) },
        { label: 'Heading 2', command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), style: 'text-xl font-bold', shortcut: 'Ctrl+Alt+2', isActive: editor.isActive('heading', { level: 2 }) },
        { label: 'Heading 3', command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), style: 'text-lg font-bold', shortcut: 'Ctrl+Alt+3', isActive: editor.isActive('heading', { level: 3 }) },
        // Thêm các heading khác nếu cần
    ];
    return (
        <DropdownMenu buttonContent={<><span className="font-bold text-lg">Aa</span><LuChevronDown size={16} /></>}>
            <div className="p-2 space-y-1">
                {options.map((opt, i) => (
                    <button key={i} onClick={opt.command} className={`w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-100 ${opt.isActive ? 'bg-blue-100 text-blue-700' : ''}`}>
                        <span className={opt.style}>{opt.label}</span>
                        <kbd className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">{opt.shortcut}</kbd>
                    </button>
                ))}
            </div>
        </DropdownMenu>
    );
};

const ListDropdown = ({ editor }: { editor: Editor }) => {
    const options = [
        { label: 'Danh sách dấu đầu dòng', command: () => editor.chain().focus().toggleBulletList().run(), shortcut: 'Ctrl+Shift+8', isActive: editor.isActive('bulletList') },
        { label: 'Danh sách được đánh số', command: () => editor.chain().focus().toggleOrderedList().run(), shortcut: 'Ctrl+Shift+7', isActive: editor.isActive('orderedList') }
    ];
    return (
        <DropdownMenu buttonContent={<><LuList size={20} /><LuChevronDown size={16} /></>}>
            <div className="p-2 space-y-1">
                {options.map((opt, i) => (
                    <button key={i} onClick={opt.command} className={`w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-100 ${opt.isActive ? 'bg-blue-100 text-blue-700' : ''}`}>
                        <span className="text-blue-600 font-medium">{opt.label}</span>
                        <kbd className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">{opt.shortcut}</kbd>
                    </button>
                ))}
            </div>
        </DropdownMenu>
    );
};

const InsertDropdown = ({ editor }: { editor: Editor }) => {
    const insertItems = [
        { icon: LuAtSign, title: 'Đề cập', description: 'Đề cập đến ai đó để gửi thông báo cho họ', command: () => alert('Mention clicked!') },
        { icon: LuSmile, title: 'Biểu tượng cảm xúc', description: 'Sử dụng biểu tượng cảm xúc để thể hiện ý kiến và cảm xúc', command: () => alert('Emoji clicked!') },
        { icon: LuCode, title: 'Đoạn mã', description: 'Hiển thị mã có bôi đậm cú pháp', command: () => editor.chain().focus().toggleCodeBlock().run() },
        { icon: LuQuote, title: 'Trích dẫn', description: 'Tạo một khối trích dẫn', command: () => editor.chain().focus().toggleBlockquote().run() },
    ];
    return (
        <DropdownMenu buttonContent={<><LuPlus size={20} /><LuChevronDown size={16} /></>}>
            <div className="p-2">
                <div className="relative mb-2">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" placeholder="Tìm kiếm" className="w-full pl-10 pr-4 py-2 border rounded-md"/>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                    {insertItems.map((item, i) => (
                        <button key={i} onClick={item.command} className="w-full flex items-start gap-3 text-left p-2 rounded-md hover:bg-gray-100">
                            <div className="p-2 bg-gray-100 rounded-md"><item.icon size={20} /></div>
                            <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </DropdownMenu>
    );
};

// --- Component Thanh công cụ (Toolbar) ĐÃ CẬP NHẬT ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const SimpleButton = ({ onClick, isActive, children }: { onClick: () => void, isActive: boolean, children: React.ReactNode }) => (
        <button type="button" onClick={onClick} className={`p-2 rounded-md hover:bg-gray-200 ${isActive ? 'bg-gray-300' : ''}`}>{children}</button>
    );

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-white rounded-t-md">
            <HeadingDropdown editor={editor} />
            <SimpleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><LuBold size={20}/></SimpleButton>
            <SimpleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><LuItalic size={20}/></SimpleButton>
            <SimpleButton onClick={() => alert('More styles clicked!')} isActive={false}><LuMoveHorizontal size={20}/></SimpleButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <ListDropdown editor={editor} />
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <SimpleButton onClick={() => alert('Link clicked!')} isActive={editor.isActive('link')}><LuLink2 size={20}/></SimpleButton>
            <SimpleButton onClick={() => alert('Image clicked!')} isActive={false}><LuImage size={20}/></SimpleButton>
            <InsertDropdown editor={editor} />
        </div>
    );
};

// --- Component Trình soạn thảo chính (Không đổi) ---
interface DescriptionEditorProps {
    initialContent: string;
    onSave: (htmlContent: string) => void;
    onCancel: () => void;
}

export const DescriptionEditor = ({ initialContent, onSave, onCancel }: DescriptionEditorProps) => {
    const editor = useEditor({
        extensions: [ StarterKit ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none p-4 focus:outline-none min-h-[120px]',
            },
        },
    });

    const handleSave = () => {
        if (editor) { onSave(editor.getHTML()); }
    };

    return (
        <div className="bg-white rounded-md border border-blue-500 shadow-lg">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-b-md">
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-semibold text-sm">Lưu</button>
                <button onClick={onCancel} type="button" className="bg-transparent hover:bg-gray-200 px-4 py-1.5 rounded-md font-medium text-sm">Hủy</button>
            </div>
        </div>
    );
};