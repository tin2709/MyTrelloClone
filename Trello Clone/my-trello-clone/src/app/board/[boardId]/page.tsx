'use client';

// =======================================================================
// --- IMPORTS ---
// =======================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useFormState, useFormStatus } from 'react-dom';
import {
    DndContext, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext, arrayMove, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    createList, copyList, updateListOrder, moveList, moveAllCards
} from './list-actions';
import {
    createCard, updateCardOrder
} from './card-actions';
import {
    LuLayoutGrid, LuUser, LuSettings, LuChevronDown, LuList, LuCalendar,
    LuPlus, LuChevronLeft, LuStar, LuUsers, LuArmchair, LuFilter,
    LuMoveHorizontal, LuX
} from 'react-icons/lu';

// =======================================================================
// --- ĐỊNH NGHĨA CÁC TYPES ---
// =======================================================================
interface Card {
    id: string;
    title: string;
    position: number;
    list_id: string;
}
interface List {
    id: string;
    title: string;
    position: number;
    cards: Card[];
}
interface Workspace {
    id: string;
    name: string;
}
interface BoardData {
    id: string;
    title: string;
    workspace: Workspace | null;
    lists: List[];
}

// =======================================================================
// --- PROPS INTERFACES CHO CÁC COMPONENT PHỤ ---
// =======================================================================
interface CopyListFormProps {
    originalList: List;
    boardId: string;
    onClose: () => void;
    onListCopied: () => void;
}
interface AddCardFormProps {
    listId: string;
    boardId: string;
    onCancel: () => void;
    onCardCreated: () => void;
}
interface ListActionsMenuProps {
    onClose: () => void;
    onAddCardClick: () => void;
    onCopyClick: () => void;
    onMoveClick: () => void;
    onMoveAllCardsClick: () => void;
}
interface AddListFormProps {
    boardId: string;
    onCancel: () => void;
    onListCreated: () => void;
}
interface MoveListFormProps {
    listToMove: List;
    currentBoardId: string;
    onClose: () => void;
    onListMoved: () => void;
}
interface MoveAllCardsMenuProps {
    sourceList: List;
    boardId: string;
    allLists: List[];
    onClose: () => void;
    onCardsMoved: (sourceTitle: string, destTitle: string) => void;
}
interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}
// =======================================================================
// --- CÁC COMPONENT PHỤ ---
// =======================================================================
const MoveAllCardsMenu = ({
                              sourceList,
                              boardId,
                              allLists,
                              onClose,
                              onCardsMoved
                          }: MoveAllCardsMenuProps) => {
    const initialState = { success: false, error: undefined };
    const [state, formAction] = useFormState(moveAllCards, initialState);
    const menuRef = useRef<HTMLDivElement>(null);
    const submittedFormRef = useRef<HTMLFormElement | null>(null);

    // const destinationLists = allLists.filter(list => list.id !== sourceList.id);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if(state.success && submittedFormRef.current) {
            const destId = submittedFormRef.current.destinationListId.value;
            const destList = allLists.find(l => l.id === destId);
            onCardsMoved(sourceList.title, destList?.title || '');
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
            onClose();
        }
    }, [state, onClose, onCardsMoved, allLists, sourceList.title]);

    return (
        <div
            ref={menuRef}
            className="absolute top-0 left-0 w-full h-full bg-white rounded-md shadow-lg z-30 border"
        >
            <div className="relative flex items-center justify-center p-2 border-b">
                <button
                    onClick={onClose}
                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                >
                    <LuChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-gray-600 truncate px-8">
                    Di chuyển toàn bộ thẻ trong {sourceList.title}
                </span>
                <button
                    onClick={onClose}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                >
                    <LuX size={16} />
                </button>
            </div>
            <div className="p-1">
                {allLists.map(list => {
                    // Nếu là danh sách hiện tại, hiển thị dạng text màu xám
                    if (list.id === sourceList.id) {
                        return (
                            <div
                                key={list.id}
                                className="text-left text-sm px-3 py-1.5 text-gray-400"
                            >
                                {list.title} (hiện tại)
                            </div>
                        );
                    }
                    // Nếu là danh sách khác, hiển thị dạng nút bấm trong form
                    return (
                        <form
                            key={list.id}
                            action={(formData) => {
                                submittedFormRef.current = document.querySelector(`form[data-key="${list.id}"]`);
                                formAction(formData);
                            }}
                            data-key={list.id}
                        >
                            <input type="hidden" name="sourceListId" value={sourceList.id} />
                            <input type="hidden" name="destinationListId" value={list.id} />
                            <input type="hidden" name="boardId" value={boardId} />
                            <button
                                type="submit"
                                className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                            >
                                {list.title}
                            </button>
                        </form>
                    );
                })}
            </div>
        </div>
    );
};
const CopyListForm = ({
                          originalList,
                          boardId,
                          onClose,
                          onListCopied
                      }: CopyListFormProps) => {
    const initialState = { success: false, error: undefined, errors: undefined };
    const [state, formAction] = useFormState(copyList, initialState);
    const { pending } = useFormStatus();
    const formRef = useRef<HTMLFormElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (state.success) {
            onListCopied();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
            onClose();
        }
    }, [state, onListCopied, onClose]);

    return (
        <div className="absolute inset-0 bg-gray-900/30 z-20 flex items-start justify-center p-2">
            <div
                ref={containerRef}
                className="w-full bg-gray-100 rounded-lg shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative text-center border-b border-gray-300 py-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Sao chép danh sách
                    </h3>
                    <button
                        onClick={onClose}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full"
                    >
                        <LuX size={16} />
                    </button>
                </div>
                <div className="p-2">
                    <form action={formAction} ref={formRef}>
                        <input type="hidden" name="originalListId" value={originalList.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <label htmlFor="title" className="text-xs font-bold text-gray-600">
                            Tên
                        </label>
                        <textarea
                            name="title"
                            id="title"
                            defaultValue={originalList.title}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            className="w-full mt-1 p-2 border-2 border-blue-500 rounded-md focus:outline-none resize-none"
                            rows={3}
                        />
                        {state.errors?.title && (
                            <p className="text-red-500 text-xs mt-1">
                                {state.errors.title}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {pending ? 'Đang tạo...' : 'Tạo danh sách'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
const ToastNotification = ({ message, type, onClose }: ToastNotificationProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Tự động đóng sau 5 giây

        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-lg shadow-lg z-50 flex items-center gap-3";
    const typeClasses = type === 'success'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <LuList className={`text-2xl ${iconColor}`} />
            <p className="flex-grow text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/10"
            >
                <LuX />
            </button>
        </div>
    );
};
const WorkspaceSidebar = ({
                              workspaceName,
                              activeBoardName
                          }: {
    workspaceName: string,
    activeBoardName: string
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    return (
        <aside className="w-64 border-r border-gray-200 p-2 flex flex-col shrink-0 bg-purple-800 text-white">
            <div className="p-2">
                <Link
                    href={`/dashboard`}
                    className="flex items-center gap-2 w-full hover:bg-purple-700/50 p-2 rounded-md"
                >
                    <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-md font-bold text-xl">
                        {workspaceName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm text-gray-100">{workspaceName}</p>
                        <p className="text-xs text-gray-400">Miễn phí</p>
                    </div>
                    <LuChevronLeft className="ml-auto text-gray-400" />
                </Link>
            </div>
            <nav className="flex-grow space-y-1 px-2">
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuLayoutGrid className="text-lg" /> Bảng
                </Link>
                <Link href="#" className="flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-gray-200 hover:bg-purple-700/50">
                    <LuUser className="text-lg" /> Thành viên <LuPlus className="ml-auto"/>
                </Link>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-200 hover:bg-purple-700/50 rounded-md"
                >
                    <div className="flex items-center gap-3">
                        <LuSettings className="text-lg" />
                        <span>Các cài đặt Không gian làm việc</span>
                    </div>
                    <LuChevronDown className={`transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSettingsOpen && (
                    <div className="pl-5 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 pt-2 pb-1 px-2">
                            Dạng xem Không gian làm việc
                        </p>
                        <Link href="#" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-200 hover:bg-purple-700/50">
                            <LuList className="text-lg"/> Bảng
                        </Link>
                        <Link href="#" className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left text-gray-200 hover:bg-purple-700/50">
                            <LuCalendar className="text-lg"/> Lịch
                        </Link>
                    </div>
                )}
                <div className="border-t border-purple-700 my-2"></div>
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-gray-200">Các bảng của bạn</h3>
                    <button className="p-1 hover:bg-purple-700/50 rounded-md"><LuPlus /></button>
                </div>
                <button className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-semibold text-left bg-purple-600 text-white">
                    <div className="w-6 h-6 bg-fuchsia-700 rounded-sm"></div>
                    {activeBoardName}
                </button>
            </nav>
            <div className="p-2 mt-auto">
                <button className="w-full bg-purple-100/20 text-white p-2 rounded-md text-sm font-semibold hover:bg-purple-100/30">
                    Dùng thử Premium miễn phí
                </button>
            </div>
        </aside>
    );
};

const BoardHeader = ({ boardName }: { boardName: string }) => (
    <div className="p-3 flex items-center gap-4 text-white bg-black/20 backdrop-blur-sm">
        <h1 className="text-xl font-bold">{boardName}</h1>
        <button className="p-2 rounded-md hover:bg-white/20"><LuStar /></button>
        <div className="w-px h-6 bg-white/30"></div>
        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20">
            <LuUsers/> Hiển thị với Không gian làm việc
        </button>
        <button className="flex items-center gap-2 p-2 bg-white/20 rounded-md font-semibold">
            <LuArmchair/> Bảng
        </button>
    </div>
);

const BoardSubHeader = () => (
    <div className="p-3 flex items-center justify-between text-white bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20">
                <LuArmchair /> Dạng xem bảng
            </button>
            <div className="w-px h-6 bg-white/30"></div>
            <button className="flex items-center gap-2 p-2 rounded-md hover:bg-white/20">
                <LuFilter /> Bộ lọc
            </button>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 flex items-center justify-center rounded-full font-bold text-sm border-2 border-white">
                PT
            </div>
            <button className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-md text-sm">
                Chia sẻ
            </button>
            <button className="p-2 rounded-md hover:bg-white/20">
                <LuMoveHorizontal/>
            </button>
        </div>
    </div>
);

const AddCardForm = ({
                         listId,
                         boardId,
                         onCancel,
                         onCardCreated
                     }: AddCardFormProps) => {
    const initialState = { success: false, error: undefined };
    const [state, formAction] = useFormState(createCard, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success) {
            onCardCreated();
            formRef.current?.reset();
            formRef.current?.querySelector('textarea')?.focus();
        } else if (state.error) {
            alert(state.error);
        }
    }, [state, onCardCreated]);

    return (
        <form action={formAction} ref={formRef} className="px-1">
            <input type="hidden" name="listId" value={listId} />
            <input type="hidden" name="boardId" value={boardId} />
            <textarea
                name="title"
                placeholder="Nhập tiêu đề cho thẻ này..."
                autoFocus
                className="w-full p-2 rounded-md shadow-sm resize-none focus:outline-none"
                rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {pending ? 'Đang thêm...' : 'Thêm thẻ'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-300 rounded-full"
                >
                    <LuX size={20} />
                </button>
            </div>
        </form>
    );
};

const AddListForm = ({
                         boardId,
                         onCancel,
                         onListCreated
                     }: AddListFormProps) => {
    const initialState = { success: false, error: undefined, errors: undefined, list: undefined };
    const [state, formAction] = useFormState(createList, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success && state.list) {
            onListCreated();
            formRef.current?.reset();
        } else if (state.error) {
            alert(state.error);
        }
    }, [state, onListCreated]);

    return (
        <div className="w-72 bg-gray-200 rounded-lg p-2 shrink-0 h-fit">
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="boardId" value={boardId} />
                <input
                    type="text"
                    name="title"
                    placeholder="Nhập tên danh sách..."
                    autoFocus
                    className="w-full p-2 border-2 border-blue-500 rounded-md focus:outline-none"
                />
                {state?.errors?.title && (
                    <p className="text-red-500 text-xs mt-1">
                        {state.errors.title}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <button
                        type="submit"
                        disabled={pending}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {pending ? 'Đang thêm...' : 'Thêm danh sách'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-300 rounded-full"
                    >
                        <LuX size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- COMPONENT MỚI: MOVE LIST FORM ---
const MoveListForm = ({
                          listToMove,
                          currentBoardId,
                          onClose,
                          onListMoved
                      }: MoveListFormProps) => {
    const supabase = createClient();
    const [movableBoards, setMovableBoards] = useState<{ id: string, title: string }[]>([]);
    const [targetBoardLists, setTargetBoardLists] = useState<{ id: string, position: number }[]>([]);
    const [targetBoardId, setTargetBoardId] = useState(currentBoardId);

    const [state, formAction] = useFormState(moveList, { success: false });
    const { pending } = useFormStatus();
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBoards = async () => {
            // SỬA LỖI 4: Thay đổi query select
            const { data, error } = await supabase.from('Boards').select('id, title');

            // SỬA LỖI 3: Sử dụng biến `error`
            if (error) {
                console.error("Lỗi khi fetch các bảng:", error);
            } else if (data) {
                setMovableBoards(data);
            }
        };
        fetchBoards();
    }, [supabase]);

    useEffect(() => {
        if (targetBoardId) {
            const fetchListsForBoard = async () => {
                const { data, error } = await supabase
                    .from('Lists')
                    .select('id, position')
                    .eq('board_id', targetBoardId)
                    .order('position');

                // SỬA LỖI 3: Sử dụng biến `error`
                if (error) {
                    console.error(`Lỗi khi fetch danh sách cho bảng ${targetBoardId}:`, error);
                } else if(data) {
                    setTargetBoardLists(data);
                }
            };
            fetchListsForBoard();
        }
    }, [targetBoardId, supabase]);

    useEffect(() => {
        if (state.success) {
            onListMoved();
            onClose();
        } else if (state.error) {
            alert(`Lỗi: ${state.error}`);
        }
    }, [state, onListMoved, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const positionOptions = useMemo(() => {
        const numLists = targetBoardLists.length;
        const maxPosition = targetBoardId === currentBoardId ? numLists : numLists + 1;
        return Array.from({ length: maxPosition }, (_, i) => i);
    }, [targetBoardLists, targetBoardId, currentBoardId]);

    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-30 flex items-start justify-center p-4">
            <div
                ref={formRef}
                className="bg-white w-72 rounded-lg shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative text-center border-b p-2">
                    <button
                        onClick={onClose}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"
                    >
                        <LuChevronLeft />
                    </button>
                    <h3 className="font-semibold">Di chuyển danh sách</h3>
                    <button
                        onClick={onClose}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100"
                    >
                        <LuX />
                    </button>
                </div>
                <div className="p-3">
                    <form action={formAction}>
                        <input type="hidden" name="listId" value={listToMove.id} />
                        <input type="hidden" name="currentBoardId" value={currentBoardId} />

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500">
                                Bảng thông tin
                            </label>
                            <select
                                name="targetBoardId"
                                value={targetBoardId}
                                onChange={(e) => setTargetBoardId(e.target.value)}
                                className="w-full mt-1 p-2 border bg-gray-100 rounded-md"
                            >
                                {movableBoards.map(board => (
                                    <option key={board.id} value={board.id}>
                                        {board.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500">
                                Vị trí
                            </label>
                            <select
                                name="position"
                                defaultValue={listToMove.position}
                                className="w-full mt-1 p-2 border bg-gray-100 rounded-md"
                            >
                                {positionOptions.map(pos => (
                                    <option key={pos} value={pos}>
                                        {pos + 1}
                                        {targetBoardId === currentBoardId && pos === listToMove.position && " (hiện tại)"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {pending ? 'Đang di chuyển...' : 'Di chuyển'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ListActionsMenu = ({
                             onClose,
                             onAddCardClick,
                             onCopyClick,
                             onMoveClick,
                             onMoveAllCardsClick,
                         }: ListActionsMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute top-10 right-0 w-64 bg-white rounded-md shadow-lg z-20 border"
        >
            <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium text-gray-500 mx-auto">
                    Thao tác
                </span>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                >
                    <LuX size={16} />
                </button>
            </div>
            <nav className="p-1">
                <button
                    onClick={() => { onAddCardClick(); onClose(); }}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                >
                    Thêm thẻ
                </button>
                <button
                    onClick={() => { onCopyClick(); onClose(); }}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                >
                    Sao chép danh sách
                </button>
                <button
                    onClick={() => { onMoveClick(); onClose(); }}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                >
                    Di chuyển danh sách
                </button>
                <div className="my-1 border-t"></div>
                <button
                    onClick={() => { onMoveAllCardsClick(); onClose(); }}
                    className="w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-gray-100"
                >
                    Di chuyển tất cả thẻ trong danh sách này
                </button>
            </nav>
        </div>
    );
};

const KanbanCard = ({ boardId, card }: { boardId: string; card: Card }) => {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({
        id: card.id,
        data: { type: 'Card', card },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white rounded-md p-2.5 shadow-sm mb-2 cursor-grab hover:bg-gray-50 active:cursor-grabbing"
        >
            <Link href={`/board/${boardId}/card/${card.id}`} scroll={false} className="block">
                <p className="text-sm text-gray-800">{card.title}</p>
            </Link>
        </div>
    );
};

const KanbanList = ({
                        list, boardId, allLists, onCardCreated, onListUpdated,onShowToast
                    }: {
    list: List;
    boardId: string;
    allLists: List[];
    onCardCreated: () => void;
    onListUpdated: () => void;
    onShowToast: (message: string) => void;


}) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isMovingAllCards, setIsMovingAllCards] = useState(false);

    const handleCopyClick = () => { setIsMenuOpen(false); setIsCopying(true); };
    const handleMoveClick = () => { setIsMenuOpen(false); setIsMoving(true); };
    const handleMoveAllCardsClick = () => { setIsMenuOpen(false); setIsMovingAllCards(true); };
    const handleCardsMoved = (sourceTitle: string, destTitle: string) => {
        onListUpdated();
        onShowToast(
            `Tất cả các thẻ trong danh sách "${sourceTitle}" đã được chuyển sang danh sách "${destTitle}".`
        );
    }
    const cardIds = useMemo(() => list.cards.map(card => card.id), [list.cards]);

    const {
        setNodeRef, attributes, listeners, transform, transition, isDragging
    } = useSortable({
        id: list.id,
        data: { type: 'List', list },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative w-72 bg-gray-100 rounded-lg p-1 shrink-0 h-fit"
        >
            {isCopying && (
                <CopyListForm
                    originalList={list}
                    boardId={boardId}
                    onClose={() => setIsCopying(false)}
                    onListCopied={onListUpdated}
                />
            )}
            {isMoving && (
                <MoveListForm
                    listToMove={list}
                    currentBoardId={boardId}
                    onClose={() => setIsMoving(false)}
                    onListMoved={onListUpdated}
                />
            )}
            {isMovingAllCards && (
                <MoveAllCardsMenu
                    sourceList={list}
                    boardId={boardId}
                    allLists={allLists}
                    onClose={() => setIsMovingAllCards(false)}
                    onCardsMoved={handleCardsMoved}
                />
            )}
            <div
                {...attributes}
                {...listeners}
                className="flex justify-between items-center p-2 mb-1 cursor-grab active:cursor-grabbing"
            >
                <h3 className="font-semibold text-gray-700">{list.title}</h3>
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-1.5 hover:bg-gray-300 rounded-md"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <LuMoveHorizontal />
                </button>
                {isMenuOpen && (
                    <ListActionsMenu
                        onClose={() => setIsMenuOpen(false)}
                        onAddCardClick={() => setIsAddingCard(true)}
                        onCopyClick={handleCopyClick}
                        onMoveClick={handleMoveClick}
                        onMoveAllCardsClick={handleMoveAllCardsClick}
                    />
                )}
            </div>
            <SortableContext items={cardIds}>
                <div className="px-1 pt-1 pb-2 space-y-2 min-h-[40px] rounded-md">
                    {list.cards.map((card) => (
                        <KanbanCard key={card.id} boardId={boardId} card={card} />
                    ))}
                </div>
            </SortableContext>
            {isAddingCard ? (
                <AddCardForm
                    listId={list.id}
                    boardId={boardId}
                    onCancel={() => setIsAddingCard(false)}
                    onCardCreated={onCardCreated}
                />
            ) : (
                <button
                    onClick={() => setIsAddingCard(true)}
                    className="w-full text-left p-2 mt-1 hover:bg-gray-200 rounded-md text-gray-600 flex items-center gap-2"
                >
                    <LuPlus /> Thêm thẻ
                </button>
            )}
        </div>
    );
};

// =======================================================================
// --- COMPONENT CHÍNH ---
// =======================================================================
export default function BoardPage({ params }: { params: { boardId: string } }) {
    const [boardData, setBoardData] = useState<BoardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddingList, setIsAddingList] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const supabase = createClient();

    const fetchBoardData = useCallback(async () => {
        const { data, error } = await supabase
            .from('Boards')
            .select(`
                id, title,
                workspace:Workspaces(id, name),
                lists:Lists(id, title, position, cards:Cards(id, title, position, list_id))
            `)
            .eq('id', params.boardId)
            .single();

        if (error) {
            console.error("Lỗi khi fetch dữ liệu bảng:", error);
            setBoardData(null);
        } else if (data) {
            const sortedData = {
                ...data,
                lists: data.lists.sort((a, b) => a.position - b.position).map(list => ({
                    ...list,
                    cards: list.cards.sort((a, b) => a.position - b.position)
                }))
            };
            setBoardData(sortedData as BoardData);
        }
        setLoading(false);
    }, [params.boardId, supabase]);

    useEffect(() => {
        setLoading(true);
        fetchBoardData();
    }, [fetchBoardData]);

    const handleListCreated = useCallback(() => {
        fetchBoardData();
        setIsAddingList(false);
    }, [fetchBoardData]);

    const handleCardCreated = useCallback(() => {
        fetchBoardData();
    }, [fetchBoardData]);
    const handleShowToast = (message: string) => {
        setToast({ message, type: 'success' });
    }
    const listIds = useMemo(() => boardData?.lists.map(list => list.id) || [], [boardData]);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const handleOnDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !boardData) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAList = active.data.current?.type === 'List';
        if (isActiveAList) {
            setBoardData(prev => {
                if (!prev) return null;
                const oldIndex = prev.lists.findIndex(l => l.id === activeId);
                const newIndex = prev.lists.findIndex(l => l.id === overId);
                const reorderedLists = arrayMove(prev.lists, oldIndex, newIndex);

                updateListOrder(
                    reorderedLists.map((list, index) => ({ id: list.id, position: index })),
                    params.boardId
                );

                return { ...prev, lists: reorderedLists };
            });
            return;
        }

        const isActiveACard = active.data.current?.type === 'Card';
        if (isActiveACard) {
            setBoardData(prev => {
                if (!prev) return prev;
                const newLists = [...prev.lists];
                const activeListIndex = newLists.findIndex(l => l.cards.some(c => c.id === activeId));
                if (activeListIndex === -1) return prev;
                const activeCardIndex = newLists[activeListIndex].cards.findIndex(c => c.id === activeId);
                const [activeCard] = newLists[activeListIndex].cards.splice(activeCardIndex, 1);
                const overIsAList = over.data.current?.type === 'List';
                let overListIndex, overCardIndex;
                if (overIsAList) {
                    overListIndex = newLists.findIndex(l => l.id === overId);
                    overCardIndex = newLists[overListIndex].cards.length;
                } else {
                    overListIndex = newLists.findIndex(l => l.cards.some(c => c.id === overId));
                    if (overListIndex === -1) return prev;
                    overCardIndex = newLists[overListIndex].cards.findIndex(c => c.id === overId);
                }
                newLists[overListIndex].cards.splice(overCardIndex, 0, activeCard);
                const updatePromises: Promise<void>[] = [];
                const sourceList = newLists[activeListIndex];
                const destList = newLists[overListIndex];
                destList.cards.forEach((card, index) => {
                    const promise = updateCardOrder(card.id, destList.id, index, params.boardId);
                    updatePromises.push(promise);
                });
                if (activeListIndex !== overListIndex) {
                    sourceList.cards.forEach((card, index) => {
                        const promise = updateCardOrder(card.id, sourceList.id, index, params.boardId);
                        updatePromises.push(promise);
                    });
                }
                Promise.all(updatePromises).catch(err => {
                    console.error("Lỗi khi đồng bộ thứ tự thẻ với server:", err);
                });
                return { ...prev, lists: newLists };
            });
        }
    }, [boardData, params.boardId]);

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Đang tải bảng...</div>;
    }
    if (!boardData) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white">Không tìm thấy bảng.</div>;
    }

    const { title, workspace, lists } = boardData;

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            {toast && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <header className="bg-purple-800/80 backdrop-blur-sm shadow-sm p-2 flex justify-between items-center shrink-0 z-10 border-b border-purple-700 text-white">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 rounded hover:bg-white/20">
                        <LuLayoutGrid className="text-2xl" />
                    </Link>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-sm font-semibold rounded hover:bg-white/20">
                            Các không gian làm việc
                            <LuChevronDown className="inline-block ml-1" />
                        </button>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700">
                        Tạo mới
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="search"
                        placeholder="Tìm kiếm"
                        className="bg-white/20 placeholder:text-gray-300 px-3 py-1.5 border-none rounded-md text-sm hidden md:block"
                    />
                    <div className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full font-bold text-sm">
                        PT
                    </div>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <WorkspaceSidebar
                    workspaceName={workspace?.name || 'Workspace'}
                    activeBoardName={title}
                />
                <main
                    className="flex-1 flex flex-col bg-fuchsia-200 min-w-0"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070')`,
                        backgroundSize: 'cover'
                    }}
                >
                    <BoardHeader boardName={title} />
                    <BoardSubHeader />

                    <div className="flex-1 overflow-x-auto p-4">
                        <DndContext sensors={sensors} onDragEnd={handleOnDragEnd}>
                            <div className="flex gap-4 h-full items-start">
                                <SortableContext items={listIds}>
                                    {lists.map(list => (
                                        <KanbanList
                                            key={list.id}
                                            list={list}
                                            boardId={params.boardId}
                                            allLists={lists} // <-- SỬA LỖI: Truyền toàn bộ danh sách `lists`
                                            onCardCreated={handleCardCreated}
                                            onListUpdated={fetchBoardData}
                                            onShowToast={handleShowToast}
                                        />
                                    ))}
                                </SortableContext>
                                <div>
                                    {!isAddingList ? (
                                        <button
                                            onClick={() => setIsAddingList(true)}
                                            className="w-72 p-2.5 rounded-lg bg-white/30 hover:bg-white/40 text-white font-semibold text-left shrink-0"
                                        >
                                            <LuPlus className="inline-block mr-2" />
                                            Thêm danh sách khác
                                        </button>
                                    ) : (
                                        <AddListForm
                                            boardId={params.boardId}
                                            onCancel={() => setIsAddingList(false)}
                                            onListCreated={handleListCreated}
                                        />
                                    )}
                                </div>
                            </div>
                        </DndContext>
                    </div>
                </main>
            </div>
        </div>
    );
}