// src/app/board/[boardId]/layout.tsx
export default function BoardLayout({
                                        children,
                                        modal, // <-- Next.js sẽ tự động truyền slot 'modal' vào đây
                                    }: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}