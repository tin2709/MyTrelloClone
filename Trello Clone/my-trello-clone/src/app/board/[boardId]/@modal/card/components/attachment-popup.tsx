// app/(main)/boards/[boardId]/@modal/(..)[cardId]/components/attachment-popup.jsx
'use client';

// React & Next.js Core
import React, { useState, useEffect, useActionState, useTransition, useRef } from 'react';

// Supabase
import { createClient } from '@/lib/supabase/client';

// Server Actions
import { createLinkAttachment, createFileAttachment } from '../../../attachment-actions';

// Icons
import { LuX } from 'react-icons/lu';

// --- TYPE DEFINITIONS ---
interface CardDetails { id: string; title: string; description: string | null; started_at: string | null; dued_at: string | null; completed_at: string | null; list: { title: string } | null; }

// --- HELPER COMPONENT (moved here for locality) ---
const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 my-2">
        <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

export function AttachmentPopup({ card, boardId, onClose, onSaveSuccess }: {
    card: CardDetails;
    boardId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [linkState, linkFormAction, isLinkPending] = useActionState(createLinkAttachment, { success: false });
    const [linkUrl, setLinkUrl] = useState('');
    const [linkDisplayName, setLinkDisplayName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [, startDbTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setLinkUrl(''); setLinkDisplayName('');
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const sanitizeFileName = (name: string) =>
                name.normalize("NFD").replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\w.-]+/g, '_');

            const safeFileName = sanitizeFileName(file.name);
            const filePath = `${card.id}/${Date.now()}-${safeFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    // @ts-expect-error - Supabase v2.39+ có onProgress nhưng type có thể chưa cập nhật
                    onProgress: (event: { loaded: number, total: number }) => {
                        setUploadProgress((event.loaded / event.total) * 100);
                    },
                });

            if (uploadError) throw uploadError;

            const formData = new FormData();
            formData.append('cardId', card.id);
            formData.append('boardId', boardId);
            formData.append('cardTitle', card.title);
            formData.append('filePath', filePath);
            formData.append('displayName', file.name);

            startDbTransition(async () => {
                const result = await createFileAttachment({ success: false }, formData);
                if (result.success) {
                    onSaveSuccess();
                    onClose();
                } else {
                    setUploadError(result.error || "Lỗi khi lưu thông tin file.");
                    setIsUploading(false);
                }
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                setUploadError(`Lỗi upload: ${error.message}`);
            } else {
                setUploadError("Đã xảy ra một lỗi upload không xác định.");
            }
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (linkState.success) {
            onSaveSuccess();
            onClose();
        } else if (linkState.error) {
            alert(`Lỗi: ${linkState.error}`);
        }
    }, [linkState, onClose, onSaveSuccess]);

    const canAttachLink = linkUrl.trim() !== '' && linkDisplayName.trim() !== '';

    return (
        <div className="absolute inset-0 bg-black/20 z-20 flex items-center justify-center">
            <div className="bg-white rounded-md p-0 shadow-lg w-80">
                <div className="relative flex items-center justify-center border-b p-2">
                    <span className="text-sm font-medium text-gray-700">Đính kèm</span>
                    <button onClick={onClose} disabled={isUploading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"><LuX size={16} /></button>
                </div>
                <div className="p-4 space-y-4">
                    {/* UI Content remains the same */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-800">Đính kèm tệp từ máy tính của bạn</h4>
                        <p className="text-xs text-gray-500 mb-2">Bạn cũng có thể kéo và thả tệp để tải chúng lên.</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isUploading} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full text-center py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium disabled:opacity-50">Chọn tệp</button>
                        {file && (
                            <div className="mt-2 text-sm text-gray-700">
                                <p>Đã chọn: <span className="font-semibold">{file.name}</span></p>
                                {isUploading && <ProgressBar progress={uploadProgress} />}
                            </div>
                        )}
                        {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                    </div>
                    <hr/>
                    <form action={linkFormAction} className="space-y-3">
                        <input type="hidden" name="cardId" value={card.id} /><input type="hidden" name="boardId" value={boardId} /><input type="hidden" name="cardTitle" value={card.title} />
                        <div>
                            <label className="text-xs font-bold text-gray-500">Tìm kiếm hoặc dán liên kết</label>
                            <input name="linkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Dán liên kết bất kỳ tại đây..." className="w-full mt-1 px-3 py-2 border rounded-md" disabled={!!file || isUploading} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Văn bản hiển thị (không bắt buộc)</label>
                            <input name="displayName" value={linkDisplayName} onChange={(e) => setLinkDisplayName(e.target.value)} placeholder="Văn bản cần hiển thị" className="w-full mt-1 px-3 py-2 border rounded-md" disabled={!!file || isUploading}/>
                        </div>
                        {file ? (
                            <button type="button" onClick={handleFileUpload} disabled={isUploading} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                {isUploading ? `Đang tải... ${Math.round(uploadProgress)}%` : 'Tải lên'}
                            </button>
                        ) : (
                            <button type="submit" disabled={!canAttachLink || isLinkPending} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300">
                                {isLinkPending ? 'Đang đính kèm...' : 'Đính kèm'}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};