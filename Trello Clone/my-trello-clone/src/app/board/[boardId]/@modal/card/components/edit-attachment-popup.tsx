// app/(main)/boards/[boardId]/@modal/(..)[cardId]/components/edit-attachment-popup.jsx
'use client';

// React & Next.js Core
import React, { useState, useEffect, useActionState } from 'react';

// Server Actions
import { updateAttachment } from '../../../attachment-actions';

// Icons
import { LuX } from 'react-icons/lu';

// --- TYPE DEFINITIONS ---
interface Attachment { id: string; display_name: string; file_path: string; attachment_type: 'link' | 'upload'; created_at: string; }

export function EditAttachmentPopup({ attachment, boardId, onClose, onSaveSuccess }: {
    attachment: Attachment;
    boardId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}) {
    const [state, formAction] = useActionState(updateAttachment, { success: false });
    const [linkUrl, setLinkUrl] = useState(attachment.file_path);
    const [displayName, setDisplayName] = useState(attachment.display_name);

    useEffect(() => {
        if (state.success) {
            onSaveSuccess();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onClose, onSaveSuccess]);

    return (
        <div className="absolute inset-0 bg-black/10 z-30 flex items-center justify-center">
            <div className="bg-white rounded-md p-0 shadow-lg w-80">
                <div className="relative flex items-center justify-between border-b p-2">
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><LuX size={16} /></button>
                    <span className="text-sm font-medium text-gray-700">Sửa tệp đính kèm</span>
                    <div className="w-7"></div>
                </div>
                <div className="p-4">
                    <form action={formAction} className="space-y-3">
                        <input type="hidden" name="attachmentId" value={attachment.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <input type="hidden" name="oldDisplayName" value={attachment.display_name} />
                        <div>
                            <label className="text-xs font-bold text-gray-500">Tìm kiếm hoặc dán liên kết</label>
                            <input
                                name="newLinkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Văn bản hiển thị</label>
                            <input
                                name="newDisplayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Lưu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};