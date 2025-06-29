'use client';

import { LuStar, LuUsers, LuArmchair, LuFilter, LuMoveHorizontal } from 'react-icons/lu';

interface BoardHeaderProps {
    boardName: string;
    onMenuClick: () => void;
}

export const BoardHeader = ({ boardName, onMenuClick }: BoardHeaderProps) => {
    return (
        <>
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
                    <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-white/20">
                        <LuMoveHorizontal/>
                    </button>
                </div>
            </div>
        </>
    );
};