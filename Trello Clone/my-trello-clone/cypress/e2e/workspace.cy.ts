// cypress/e2e/workspace.cy.ts

describe('Workspace Management', () => {
    // Luôn chạy trước mỗi bài test để đảm bảo người dùng đã đăng nhập
    // và đang ở đúng trang bắt đầu.
    beforeEach(() => {
        // Lệnh tùy chỉnh để đăng nhập nhanh chóng.
        cy.login();

        // Truy cập trang dashboard.
        cy.visit('/dashboard');
    });

    /**
     * Kịch bản 1: Kiểm tra luồng tạo workspace thành công (Happy Path).
     * Test này mô phỏng chính xác hành vi của component WorkspaceForm.
     */
    it('should create a new workspace successfully via client-side API calls', () => {
        // Sử dụng timestamp để đảm bảo tên workspace là duy nhất cho mỗi lần chạy test.
        const workspaceName = `Cypress Test Workspace ${Date.now()}`;
        const workspaceDescription = 'This is a test workspace created by Cypress.';

        // 1. Mở form tạo workspace bằng cách click vào nút '+'
        cy.contains('h2', 'CÁC KHÔNG GIAN LÀM VIỆC').siblings('button').click();

        // 2. Xác thực rằng form đã hiển thị trên màn hình
        cy.get('input#ws-name').should('be.visible');
        cy.get('textarea#ws-description').should('be.visible');

        // 3. Điền thông tin hợp lệ vào form
        cy.get('input#ws-name').type(workspaceName);
        cy.get('textarea#ws-description').type(workspaceDescription);

        // 4. Lắng nghe (intercept) chính xác 2 request mạng mà hàm handleSubmit sẽ tạo ra.
        // Đây là bước quan trọng nhất để sửa lỗi 'cy.wait() timed out'.
        cy.intercept('POST', '**/rest/v1/Workspaces?select=%2A').as('createWorkspaceRequest');
        cy.intercept('POST', '**/rest/v1/Workspace_members*').as('addMemberRequest');

        // 5. Click nút "Lưu" để submit form
        cy.get('button[type="submit"]').contains('Lưu').click();

        // 6. Đợi cho cả hai request mạng hoàn thành.
        // Điều này đảm bảo rằng dữ liệu đã được lưu thành công trên server.
        cy.wait(['@createWorkspaceRequest', '@addMemberRequest']);

        // 7. Lắng nghe và xác thực nội dung của thông báo alert thành công.
        cy.on('window:alert', (text) => {
            expect(text).to.contain('Tạo không gian làm việc thành công!');
        });

        // 8. Sau khi thành công, component sẽ gọi onSuccess và fetch lại dữ liệu.
        // Kiểm tra kết quả cuối cùng trên UI: workspace mới phải xuất hiện trên sidebar.
        cy.get('aside').contains(workspaceName).should('be.visible');
    });

    /**
     * Kịch bản 2: Kiểm tra validation của form (Unhappy Path).
     * Test này xác minh rằng nút "Lưu" bị vô hiệu hóa khi tên rỗng.
     */
    it('should disable the save button if workspace name is empty, and enable it when filled', () => {
        // 1. Mở form tạo workspace
        cy.contains('h2', 'CÁC KHÔNG GIAN LÀM VIỆC').siblings('button').click();

        // 2. Xác thực rằng nút "Lưu" ban đầu bị vô hiệu hóa (disabled)
        // vì trường tên đang trống, đúng theo logic `disabled={!name.trim()}`.
        cy.get('button[type="submit"]').contains('Lưu').should('be.visible').and('be.disabled');

        // 3. Gõ một vài ký tự vào trường tên
        cy.get('input#ws-name').type('Tên hợp lệ');

        // 4. Bây giờ, nút "Lưu" phải được kích hoạt và có thể click được
        cy.get('button[type="submit"]').contains('Lưu').should('not.be.disabled');

        // 5. Xóa hết ký tự trong trường tên
        cy.get('input#ws-name').clear();

        // 6. Nút "Lưu" phải quay lại trạng thái bị vô hiệu hóa
        cy.get('button[type="submit"]').contains('Lưu').should('be.disabled');
    });
});