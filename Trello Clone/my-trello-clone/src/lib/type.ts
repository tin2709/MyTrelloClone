
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Định nghĩa trước kiểu Enum cho vai trò trong workspace để tái sử dụng
export type WorkspaceRole = "admin" | "member";

export type Database = {
    public: {
        Tables: {
            // Bảng Boards - Bảng công việc (trong một workspace)
            Boards: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    title: string; // text
                    user_id: string; // uuid, người tạo board
                    workspace_id: string; // uuid
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    title: string; // text
                    user_id: string; // uuid
                    workspace_id: string; // uuid
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    title?: string;
                    user_id?: string;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "Boards_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "Users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "Boards_workspace_id_fkey";
                        columns: ["workspace_id"];
                        referencedRelation: "Workspaces";
                        referencedColumns: ["id"];
                    },
                ];
            };

            // Bảng Cards - Các thẻ (công việc) trong một list
            Cards: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    title: string; // text
                    description: string | null; // text
                    position: number; // int4
                    list_id: string; // uuid
                    board_id: string;
                    archived_at: string | null;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    title: string; // text
                    description?: string | null; // text
                    position: number; // int4
                    list_id: string; // uuid
                    board_id: string;
                    archived_at?: string | null;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    title?: string;
                    description?: string | null;
                    position?: number;
                    list_id?: string;
                    board_id?: string;
                    archived_at?: string | null;
                    completed_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "Cards_list_id_fkey";
                        columns: ["list_id"];
                        referencedRelation: "Lists";
                        referencedColumns: ["id"];
                    },
                ];
            };
            Checklists: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    title: string; // text
                    card_id: string; // uuid
                    position: number; // int4
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    title: string; // text
                    card_id: string; // uuid
                    position: number; // int4
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    title?: string;
                    card_id?: string;
                    position?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "Checklists_card_id_fkey";
                        columns: ["card_id"];
                        referencedRelation: "Cards";
                        referencedColumns: ["id"];
                    }
                ];
            };

            // Bảng Checklist_Items - Các mục con trong một checklist
            Checklist_items: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    text: string; // text
                    checklist_id: string; // uuid
                    is_completed: boolean; // boolean
                    position: number; // int4
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    text: string;
                    checklist_id: string;
                    is_completed?: boolean; // Sẽ có giá trị mặc định là 'false' trong DB
                    position: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    text?: string;
                    checklist_id?: string;
                    is_completed?: boolean;
                    position?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "Checklist_items_checklist_id_fkey";
                        columns: ["checklist_id"];
                        referencedRelation: "Checklists";
                        referencedColumns: ["id"];
                    }
                ];
            };

            // Bảng Lists - Các danh sách (cột) trong một board
            Lists: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    title: string; // text
                    position: number; // int4
                    board_id: string; // uuid
                    archived_at: string | null;
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    title: string; // text
                    position: number; // int4
                    board_id: string; // uuid
                    archived_at?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    title?: string;
                    position?: number;
                    board_id?: string;
                    archived_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "Lists_board_id_fkey";
                        columns: ["board_id"];
                        referencedRelation: "Boards";
                        referencedColumns: ["id"];
                    },
                ];
            };

            // Bảng Users - Thông tin hồ sơ công khai của người dùng
            Users: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    full_name: string | null; // text
                    avatar_url: string | null; // text
                };
                Insert: {
                    id: string; // uuid
                    created_at?: string; // timestamptz
                    full_name?: string | null; // text
                    avatar_url?: string | null; // text
                };
                Update: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    full_name?: string | null; // text
                    avatar_url?: string | null; // text
                };
                Relationships: [
                    {
                        foreignKeyName: "Users_id_fkey";
                        columns: ["id"];
                        referencedRelation: "users"; // Bảng 'users' trong schema 'auth'
                        referencedColumns: ["id"];
                    },
                ];
            };

            // Bảng Workspace_members - Quản lý thành viên trong không gian làm việc
            Workspace_members: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    workspace_id: string; // uuid
                    user_id: string; // uuid
                    role: WorkspaceRole; // Enum 'workspace_role'
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    workspace_id: string; // uuid
                    user_id: string; // uuid
                    role: WorkspaceRole; // Enum 'workspace_role'
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    workspace_id?: string;
                    user_id?: string;
                    role?: WorkspaceRole;
                };
                Relationships: [
                    {
                        foreignKeyName: "Workspace_members_workspace_id_fkey";
                        columns: ["workspace_id"];
                        referencedRelation: "Workspaces";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "Workspace_members_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "Users";
                        referencedColumns: ["id"];
                    },
                ];
            };

            // Bảng Workspaces - Không gian làm việc
            Workspaces: {
                Row: {
                    id: string; // uuid
                    created_at: string; // timestamptz
                    name: string; // text
                    description: string | null; // text
                    user_id: string; // uuid, người tạo workspace
                };
                Insert: {
                    id?: string; // uuid
                    created_at?: string; // timestamptz
                    name: string; // text
                    description?: string | null; // text
                    user_id: string; // uuid
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "Workspaces_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "Users";
                        referencedColumns: ["id"];
                    },
                ];
            };
            // Bảng Activities - Lịch sử hoạt động
            Activities: {
                // THAY THẾ TOÀN BỘ KHỐI NÀY
                Row:
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "CREATE_LIST";
                    metadata: { list_name: string };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "COPY_LIST";
                    metadata: { source_list_name: string; new_list_name: string };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "CREATE_CARD";
                    metadata: { card_name: string; list_name: string };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "MOVE_CARD";
                    metadata: {
                        card_name: string;
                        source_list_name: string;
                        destination_list_name: string;
                    };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "MOVE_LIST";
                    metadata: {
                        list_name: string;
                        destination_board_name: string;
                        is_different_board: boolean;
                    };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "RECEIVE_LIST";
                    metadata: { list_name: string; source_board_name: string };
                }
                    | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "MOVE_ALL_CARDS";
                    metadata: {
                        source_list_name: string;
                        destination_list_name: string;
                    };
                }
                | {
                id: string;
                created_at: string;
                user_id: string;
                board_id: string;
                action_type: "ARCHIVE_LIST";
                metadata: { list_name: string };
                }
                | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "RESTORE_LIST";
                    metadata: { list_name: string };
                }
                | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "DELETE_LIST";
                    metadata: { list_name: string };
                }
                | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "ARCHIVE_ALL_CARDS";
                    metadata: { list_name: string };
                }
                | {
                    id: string;
                    created_at: string;
                    user_id: string;
                    board_id: string;
                    action_type: "RESTORE_CARD";
                    metadata: { list_name: string };
                }
                | {
                     id: string;
                     created_at: string;
                     user_id: string;
                     board_id: string;
                     action_type: "DELETE_CARD";
                     metadata: { list_name: string };
                }
                | {
                     id: string;
                     created_at: string;
                     user_id: string;
                     board_id: string;
                     action_type: "MARK_CARD";
                     metadata: { list_name: string };
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    user_id: string;
                    board_id: string;
                    action_type: Database["public"]["Enums"]["activity_type"];
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    user_id?: string;
                    board_id?: string;
                    action_type?: Database["public"]["Enums"]["activity_type"];
                    metadata?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "Activities_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "Users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "Activities_board_id_fkey";
                        columns: ["board_id"];
                        referencedRelation: "Boards";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            create_workspace_and_add_admin: {
                Args: {
                    workspace_name: string;
                    workspace_description: string;
                };
                Returns: unknown; // hoặc kiểu trả về cụ thể nếu bạn biết, ví dụ: { id: string }
            };
            duplicate_list: {
                Args: {
                    original_list_id: string; // uuid
                    new_list_title: string;   // text
                };
                Returns: void; // Hàm không trả về dữ liệu
            };
            move_list_and_reorder: {
                Args: {
                    p_list_id: string       // uuid
                    p_target_board_id: string // uuid
                    p_new_position: number  // integer
                    p_user_id: string       // uuid
                }
                Returns: undefined // Hàm trả về void, nên TypeScript sẽ hiểu là undefined
            }
            move_all_cards_between_lists: {
                Args: {
                    p_source_list_id: string;      // uuid
                    p_destination_list_id: string; // uuid
                    p_user_id: string;             // uuid
                };
                Returns: undefined; // Hàm trả về void, nên TypeScript sẽ hiểu là undefined
            }

        };


        Enums: {
            workspace_role: "admin" | "member";
            activity_type:
                | "CREATE_LIST"
                | "COPY_LIST"
                | "CREATE_CARD"
                | "MOVE_CARD"
                | "MOVE_LIST"
                | "RECEIVE_LIST"
                | "MOVE_ALL_CARDS"
                | "ARCHIVE_LIST"
                | "RESTORE_LIST"
                | "DELETE_LIST"
                | "ARCHIVE_ALL_CARDS"
                | "RESTORE_CARD"
                | "DELETE_CARD"
                | "MARK_CARD"
                | "CREATE_CHECKLIST"
                | "DELETE_CHECKLIST"
                | "CREATE_CHECKLIST_ITEM"
                | "UPDATE_CHECKLIST_ITEM";

        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

// =================================================================
// Phần Code Cũ - Các Helper Types (Không cần thay đổi)
// =================================================================

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
    PublicTableNameOrOptions extends
            | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
            Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R;
        }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
            PublicSchema["Views"])
        ? (PublicSchema["Tables"] &
            PublicSchema["Views"])[PublicTableNameOrOptions] extends {
                Row: infer R;
            }
            ? R
            : never
        : never;

export type TablesInsert<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Insert: infer I;
        }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Insert: infer I;
            }
            ? I
            : never
        : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Update: infer U;
        }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Update: infer U;
            }
            ? U
            : never
        : never;

export type Enums<
    PublicEnumNameOrOptions extends
            | keyof PublicSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
        ? PublicSchema["Enums"][PublicEnumNameOrOptions]
        : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
            | keyof PublicSchema["CompositeTypes"]
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
            schema: keyof Database;
        }
        ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
        ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
        : never;