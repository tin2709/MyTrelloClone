// @/app/board/[boardId]/types.ts

// Kiểu dữ liệu chuẩn mà ứng dụng sử dụng
export interface Label {
    id: string;
    name: string;
    color: string;
}

export interface Card {
    id: string;
    title: string;
    position: number;
    list_id: string;
    description: string | null;
    completed_at: string | null;
    dued_at: string | null;
    started_at: string | null;
    labels: Label[]; // Sử dụng mảng Label chuẩn
    Attachments: { count: number }[];
    Checklists: {
        id: string;
        checklist_items: { id: string; is_completed: boolean; }[];
    }[];
}

export interface List {
    id: string;
    title: string;
    position: number;
    cards: Card[];
}

export interface Workspace {
    id: string;
    name: string;
}

export interface BoardData {
    id: string;
    title: string;
    workspace: Workspace | null;
    lists: List[];
}