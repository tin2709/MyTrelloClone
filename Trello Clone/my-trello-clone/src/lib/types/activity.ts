// @/lib/types/activity.ts

// Định nghĩa một interface cơ sở chứa các thuộc tính chung
export interface BaseActivity {
    id: string;
    created_at: string;
    user: {
        full_name: string | null;
    } | null;
}

// Định nghĩa các interface cụ thể cho từng loại hành động, kế thừa từ BaseActivity
export interface CreateListActivity extends BaseActivity {
    action_type: 'CREATE_LIST';
    metadata: { list_name: string };
}

export interface CopyListActivity extends BaseActivity {
    action_type: 'COPY_LIST';
    metadata: { source_list_name: string; new_list_name: string };
}

export interface CreateCardActivity extends BaseActivity {
    action_type: 'CREATE_CARD';
    metadata: { card_name: string; list_name: string };
}

export interface MoveCardActivity extends BaseActivity {
    action_type: 'MOVE_CARD';
    metadata: {
        card_name: string;
        source_list_name: string;
        destination_list_name: string;
    };
}

export interface MoveListActivity extends BaseActivity {
    action_type: 'MOVE_LIST';
    metadata: {
        list_name: string;
        destination_board_name: string;
        is_different_board: boolean;
    };
}

export interface ReceiveListActivity extends BaseActivity {
    action_type: 'RECEIVE_LIST';
    metadata: {
        list_name: string;
        source_board_name: string;
    };
}

export interface MoveAllCardsActivity extends BaseActivity {
    action_type: 'MOVE_ALL_CARDS';
    metadata: {
        source_list_name: string;
        destination_list_name: string;
    };
}
export interface ArchiveListActivity extends BaseActivity {
    action_type: 'ARCHIVE_LIST';
    metadata: { list_name: string };
}

export interface RestoreListActivity extends BaseActivity {
    action_type: 'RESTORE_LIST';
    metadata: { list_name: string };
}

export interface DeleteListActivity extends BaseActivity {
    action_type: 'DELETE_LIST';
    metadata: { list_name: string };
}
export interface ArchiveAllCardofListActivity extends BaseActivity {
    action_type: 'ARCHIVE_All_CARDS';
    metadata: { list_name: string };
}
export interface RestoreCardActivity extends BaseActivity {
    action_type: 'RESTORE_CARD';
    metadata: { list_name: string };
}
export interface DeleteCardActivity extends BaseActivity {
    action_type: 'DELETE_CARDS';
    metadata: { list_name: string };
}
export interface MarkCardActivity  extends BaseActivity {
    action_type: 'MARK_CARD';
    metadata: { list_name: string };
}
export interface CreateChecklistActivity extends BaseActivity {
    action_type: 'CREATE_CHECKLIST';
    metadata: {
        card_name: string;
        checklist_name: string;
    };
}

export interface DeleteChecklistActivity extends BaseActivity {
    action_type: 'DELETE_CHECKLIST';
    metadata: {
        card_name: string;
        checklist_name: string;
    };
}

export interface CreateChecklistItemActivity extends BaseActivity {
    action_type: 'CREATE_CHECKLIST_ITEM';
    metadata: {
        checklist_name: string;
        item_text: string;
    };
}

export interface UpdateChecklistItemActivity extends BaseActivity {
    action_type: 'UPDATE_CHECKLIST_ITEM';
    metadata: {
        item_text: string;
        status: 'completed' | 'uncompleted';
    };
}
// Tạo một Union Type từ tất cả các interface trên
export type Activity =
    | CreateListActivity
    | CopyListActivity
    | CreateCardActivity
    | MoveCardActivity
    | MoveListActivity
    | ReceiveListActivity
    | MoveAllCardsActivity
    | ArchiveListActivity
    | RestoreListActivity
    | DeleteListActivity
    | ArchiveAllCardofListActivity
    | RestoreCardActivity
    | DeleteCardActivity
    | MarkCardActivity
    | CreateChecklistActivity
    | DeleteChecklistActivity
    | CreateChecklistItemActivity
    | UpdateChecklistItemActivity;

// SỬA LỖI 1: Bỏ đi hàm bị lồng nhau, chỉ giữ lại một
export function isActivity(obj: unknown): obj is Activity {
    // Dòng if này rất quan trọng, nó kiểm tra để đảm bảo obj là một object
    // và thu hẹp kiểu từ 'unknown' xuống một cái gì đó có thể truy cập được.
    if (
        !obj ||
        typeof obj !== 'object' ||
        !('action_type' in obj) ||
        !('metadata' in obj) ||
        !obj.metadata || // Đảm bảo metadata không phải là null
        typeof obj.metadata !== 'object'
    ) {
        return false;
    }

    // SỬA LỖI 2: Thay 'any' bằng một kiểu an toàn hơn
    const activity = obj as {
        action_type: string,
        metadata: Record<string, unknown>
    };

    switch (activity.action_type) {
        case 'CREATE_LIST':
            return typeof activity.metadata.list_name === 'string';

        case 'COPY_LIST':
            return typeof activity.metadata.source_list_name === 'string' &&
                typeof activity.metadata.new_list_name === 'string';

        case 'CREATE_CARD':
            return typeof activity.metadata.card_name === 'string' &&
                typeof activity.metadata.list_name === 'string';

        case 'MOVE_CARD':
            return typeof activity.metadata.card_name === 'string' &&
                typeof activity.metadata.source_list_name === 'string' &&
                typeof activity.metadata.destination_list_name === 'string';

        case 'MOVE_LIST':
            return typeof activity.metadata.list_name === 'string' &&
                typeof activity.metadata.destination_board_name === 'string' &&
                typeof activity.metadata.is_different_board === 'boolean';

        case 'RECEIVE_LIST':
            return typeof activity.metadata.list_name === 'string' &&
                typeof activity.metadata.source_board_name === 'string';

        case 'MOVE_ALL_CARDS':
            return typeof activity.metadata.source_list_name === 'string' &&
                typeof activity.metadata.destination_list_name === 'string';

        case 'ARCHIVE_LIST':
            return typeof activity.metadata.list_name === 'string';

        case 'RESTORE_LIST':
            return typeof activity.metadata.list_name === 'string';

        case 'DELETE_LIST':
            return typeof activity.metadata.list_name === 'string';

        case 'ARCHIVE_ALLCARD':
            return typeof activity.metadata.list_name === 'string';

        case 'RESTORE_CARD':
            return typeof activity.metadata.list_name === 'string';

        case 'DELETE_CARD':
            return typeof activity.metadata.list_name === 'string';
        case 'MARK_CARD':
            return typeof activity.metadata.list_name === 'string';
        case 'CREATE_CHECKLIST':
            return typeof activity.metadata.card_name === 'string' &&
                typeof activity.metadata.checklist_name === 'string';

        case 'DELETE_CHECKLIST':
            return typeof activity.metadata.card_name === 'string' &&
                typeof activity.metadata.checklist_name === 'string';

        case 'CREATE_CHECKLIST_ITEM':
            return typeof activity.metadata.checklist_name === 'string' &&
                typeof activity.metadata.item_text === 'string';

        case 'UPDATE_CHECKLIST_ITEM':
            return typeof activity.metadata.item_text === 'string' &&
                (activity.metadata.status === 'completed' || activity.metadata.status === 'uncompleted');

        default:
            return false; // Không nhận dạng được action_type
    }
}