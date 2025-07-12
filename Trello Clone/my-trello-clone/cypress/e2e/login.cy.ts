// cypress/e2e/login.cy.ts

describe('Login Page', () => {
    // Hook này chạy trước mỗi bài test trong 'describe' block
    beforeEach(() => {
        // Truy cập trang đăng nhập trước khi bắt đầu mỗi test
        cy.visit('http://localhost:3000/login');
    });

    // Kịch bản 1: Đăng nhập thành công với thông tin chính xác
    it('should log in a user successfully with correct email and password', () => {
        // Lấy thông tin đăng nhập từ biến môi trường của Cypress để tăng cường bảo mật
        // và dễ dàng thay đổi khi cần.
        const email = Cypress.env('TEST_USER_EMAIL');
        const password = Cypress.env('TEST_USER_PASSWORD');

        // 1. Tìm ô input email và điền giá trị
        cy.get('input[name="email"]').type(email);

        // 2. Tìm ô input password và điền giá trị
        cy.get('input[name="password"]').type(password);

        // 3. Tìm nút submit và click vào nó
        cy.get('button[type="submit"]').contains('Đăng nhập').click();
        console.log('EMAIL:', email);
        console.log('PASSWORD:', password);

        // 4. Xác thực (assert) rằng URL đã được chuyển hướng đến trang dashboard
        cy.url().should('include', '/dashboard');

        // 5. (Kiểm tra bổ sung) Xác thực rằng một phần tử đặc trưng của trang dashboard đã hiển thị
        cy.contains('h2', 'CÁC KHÔNG GIAN LÀM VIỆC').should('be.visible');
    });

    it('should show an error message for incorrect credentials', () => {
        // Gửi thông tin đăng nhập sai
        cy.get('input[name="email"]').type('wrong@example.com');
        cy.get('input[name="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').contains('Đăng nhập').click();

        // ✅ Kiểm tra popup hiển thị lỗi trong DOM
        cy.get('[data-testid="login-error-message"]')
            .should('be.visible')
            .and('contain', 'Email hoặc mật khẩu không đúng');

        // ✅ Xác thực vẫn ở trang login
        cy.url().should('include', '/login');
    });


    // Khối test cho việc đăng nhập bằng Google đã được xóa.
});