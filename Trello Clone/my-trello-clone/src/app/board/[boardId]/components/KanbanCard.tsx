'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { markCard } from '@/app/board/[boardId]/card-actions'; // Đảm bảo import đúng đường dẫn server action

// Import các icon cần thiết
import { Circle, CheckCircle, Trash2, Pencil } from 'lucide-react';

// === QUAN TRỌNG: Mở rộng kiểu dữ liệu Card ===
// Component này cần biết trạng thái 'completed_at' để hiển thị đúng.
// Bạn phải đảm bảo dữ liệu truyền vào từ component cha có chứa trường này.
interface Card {
    id: string;
    title: string;
    completed_at: string | null; // Thêm trường này
    // Bạn có thể thêm các trường khác nếu cần hiển thị (comment, attachment...)
}

export const KanbanCard = ({ boardId, card }: { boardId: string; card: Card }) => {
    // State để theo dõi khi người dùng di chuột vào thẻ
    const [isHovered, setIsHovered] = useState(false);

    // useTransition để xử lý trạng thái chờ khi gọi server action
    // isPending sẽ là true trong khi server đang xử lý, giúp vô hiệu hóa nút, tránh double-click
    const [isPending, startTransition] = useTransition();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        data: { type: 'Card', card },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Hàm xử lý khi nhấn vào nút đánh dấu hoàn tất
    const handleMarkCard = (e: React.MouseEvent) => {
        // Ngăn sự kiện click lan ra ngoài (vào Link hoặc vào dnd-kit listener)
        e.preventDefault();
        e.stopPropagation();

        startTransition(() => {
            // Gọi server action và truyền các tham số cần thiết
            markCard(card.id, boardId, card.title, card.completed_at);
        });
    };

    // Xác định xem thẻ đã hoàn thành hay chưa
    const isCompleted = !!card.completed_at;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            // Thêm 'relative' để định vị các icon con bên trong
            className="relative bg-white rounded-md shadow-sm mb-2 cursor-grab active:cursor-grabbing"
        >
            {/* --- Phần Checkbox đánh dấu --- */}
            {/* Hiển thị khi hover hoặc khi thẻ đã được hoàn tất */}
            {(isHovered || isCompleted) && (
                <div className="absolute top-1/2 -translate-y-1/2 left-2.5 z-10">
                    <button
                        onClick={handleMarkCard}
                        disabled={isPending}
                        title={isCompleted ? "Đánh dấu chưa hoàn tất" : "Đánh dấu hoàn tất"}
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {isCompleted ? (
                            // Icon khi đã hoàn tất (hình 3)
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            // Icon khi chưa hoàn tất (hình 2)
                            <Circle className="h-5 w-5 text-gray-500" />
                        )}
                    </button>
                </div>
            )}

            {/* --- Phần nội dung thẻ --- */}
            <Link
                href={`/board/${boardId}/card/${card.id}`}
                scroll={false}
                className="block p-2.5"
                style={{
                    // Thêm padding-left để không bị chữ đè lên checkbox
                    paddingLeft: (isHovered || isCompleted) ? '2.5rem' : '0.625rem',
                    transition: 'padding-left 150ms ease-in-out' // Hiệu ứng mượt mà
                }}
            >
                <p className={`text-sm text-gray-800 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {card.title}
                </p>
                {/* Bạn có thể thêm các icon khác như comment, attachment ở đây */}
            </Link>

            {/* --- Các nút hành động bên phải (hiển thị khi hoàn tất) --- */}
            {isCompleted && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2.5 z-10 flex items-center space-x-1">
                    <button className="p-1 text-gray-600 hover:text-gray-900" title="Lưu trữ thẻ">
                        <Trash2 size={16} />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-900" title="Sửa thẻ">
                        <Pencil size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};