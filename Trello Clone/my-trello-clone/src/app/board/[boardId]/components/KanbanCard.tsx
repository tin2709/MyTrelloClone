'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Card {
    id: string;
    title: string;
}

export const KanbanCard = ({ boardId, card }: { boardId: string; card: Card }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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