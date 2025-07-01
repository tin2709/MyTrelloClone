// /components/ActivityFeed.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LuX, LuChevronLeft } from 'react-icons/lu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
// GHI CHÚ: Import kiểu 'Tables' từ file types được tạo bởi Supabase CLI
import { Tables } from '@/lib/type'; // Thay đổi đường dẫn nếu cần

// Tạo một kiểu cục bộ để dễ làm việc. Nó kết hợp kiểu Row của 'Activities'
// và kiểu của 'user' được join vào.
type ActivityWithUser = Tables<'Activities'> & {
    user: { full_name: string | null } | null;
};

interface ActivityFeedProps {
    boardId: string;
    onClose: () => void;
}

const renderActivityMessage = (activity: ActivityWithUser) => {
    const userName = <strong>{activity.user?.full_name || 'Một người dùng'}</strong>;
    const { metadata, action_type } = activity;

    // TypeScript giờ đây đã hiểu rõ cấu trúc của metadata trong mỗi case
    switch (action_type) {
        case 'CREATE_LIST':
            return <>{userName} đã thêm danh sách <strong>{metadata.list_name}</strong> vào bảng này.</>;
        case 'COPY_LIST':
            return <>{userName} đã sao chép danh sách <strong>{metadata.source_list_name}</strong> thành <strong>{metadata.new_list_name}</strong>.</>;
        case 'CREATE_CARD':
            return <>{userName} đã thêm thẻ <strong>{metadata.card_name}</strong> vào danh sách <strong>{metadata.list_name}</strong>.</>;
        case 'MOVE_CARD':
            return <>{userName} đã di chuyển thẻ <strong>{metadata.card_name}</strong> từ <strong>{metadata.source_list_name}</strong> đến <strong>{metadata.destination_list_name}</strong>.</>;
        case 'MOVE_LIST':
            if (metadata.is_different_board) {
                return <>{userName} đã di chuyển danh sách <strong>{metadata.list_name}</strong> đến bảng <strong>{metadata.destination_board_name}</strong>.</>;
            }
            return <>{userName} đã di chuyển danh sách <strong>{metadata.list_name}</strong> trong bảng này.</>;
        case 'RECEIVE_LIST':
            return <>{userName} đã di chuyển danh sách <strong>{metadata.list_name}</strong> từ bảng <strong>{metadata.source_board_name}</strong> vào đây.</>;
        case 'MOVE_ALL_CARDS':
            return <>{userName} đã di chuyển tất cả thẻ từ <strong>{metadata.source_list_name}</strong> sang <strong>{metadata.destination_list_name}</strong>.</>;
        default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return <>{userName} đã thực hiện một hành động.</>;
    }
}

const ActivityFeed = ({ boardId, onClose }: ActivityFeedProps) => {
    const supabase = createClient();
    const [activities, setActivities] = useState<ActivityWithUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('Activities')
                // Dùng `*` để lấy tất cả các cột từ Activities, sau đó join user
                .select(`*, user:Users(full_name)`)
                .eq('board_id', boardId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Lỗi khi fetch hoạt động:", error);
            } else if (data) {
                // Không cần filter hay ép kiểu nữa!
                // TypeScript đã hiểu đúng kiểu dữ liệu nhờ vào định nghĩa Row mạnh mẽ.
                setActivities(data);
            }
            setLoading(false);
        };

        fetchActivities();
    }, [boardId, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel(`activity-feed-${boardId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Activities', filter: `board_id=eq.${boardId}` },
                (payload) => {
                    const fetchNewActivityWithUser = async () => {
                        // Chọn các cột cụ thể để đảm bảo kiểu trả về khớp
                        const { data, error } = await supabase
                            .from('Activities')
                            // Dùng `*` ở đây nữa để đảm bảo kiểu dữ liệu nhất quán
                            .select(`*, user:Users(full_name)`)
                            .eq('id', payload.new.id)
                            .single();

                        if (error) {
                            console.error("Lỗi fetch hoạt động mới qua realtime:", error);
                            return;
                        }

                        // Không cần `isActivity` nữa. Nếu `data` tồn tại, nó đã có kiểu đúng.
                        if (data) {
                            setActivities(currentActivities => [data, ...currentActivities]);
                        }
                    };
                    fetchNewActivityWithUser();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, boardId]);


    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-gray-100 shadow-2xl z-50 flex flex-col">
            <header className="relative text-center p-3 border-b shrink-0">
                <button
                    onClick={onClose}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-200"
                >
                    <LuChevronLeft />
                </button>
                <h3 className="font-semibold text-gray-700">Hoạt động</h3>
                <button
                    onClick={onClose}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-200"
                >
                    <LuX />
                </button>
            </header>
            <div className="p-4 flex-grow overflow-y-auto">
                {loading ? (
                    <p>Đang tải hoạt động...</p>
                ) : (
                    <ul className="space-y-4">
                        {activities.map(activity => (
                            <li key={activity.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-purple-600 flex items-center justify-center rounded-full font-bold text-sm text-white shrink-0">
                                    {activity.user?.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800">
                                        {renderActivityMessage(activity)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: vi })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;