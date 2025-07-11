// cypress/e2e/registration.cy.ts

describe('Registration Page', () => {
    // Chạy trước mỗi bài test trong 'describe' block này
    beforeEach(() => {
        // 1. Truy cập trang đăng ký
        cy.visit('http://localhost:3000/signup')
    });

    // Kịch bản 1: Người dùng đăng ký thành công
    it('should allow a new user to register successfully with valid credentials', () => {
        // Sử dụng timestamp để tạo email và username duy nhất cho mỗi lần chạy test
        const uniqueId = Date.now();
        const email = `testuser${uniqueId}@example.com`;
        const username = `TestUser${uniqueId}`;
        const password = 'password123';

        // 2. Tìm các ô input và điền thông tin
        cy.get('input[placeholder="Nhập email của bạn"]').type(email);
        cy.get('input[placeholder="Nhập tên người dùng"]').type(username);
        cy.get('input[placeholder="Nhập mật khẩu"]').type(password);

        // 3. Lắng nghe sự kiện 'alert' của trình duyệt
        cy.on('window:alert', (text) => {
            // 4. Kiểm tra nội dung của alert
            expect(text).to.contain('Đăng ký thành công! Chúng tôi đã gửi một liên kết xác thực đến email của bạn.');
        });

        // 5. Click vào nút đăng ký
        cy.get('button[type="submit"]').contains('Đăng ký').click();

        // 6. (Assertion bổ sung) Kiểm tra xem nút có chuyển sang trạng thái "loading" không
        cy.get('button[type="submit"]').should('be.disabled').and('contain', 'Đang xử lý...');

        // 7. (Assertion cuối cùng) Kiểm tra xem các ô input đã được reset sau khi thành công
        cy.get('input[placeholder="Nhập email của bạn"]').should('have.value', '');
        cy.get('input[placeholder="Nhập tên người dùng"]').should('have.value', '');
    });


    // Kịch bản 2: Hiển thị lỗi khi email đã tồn tại
    it('should display an error message when trying to register with an existing email', () => {
        // Dùng một email đã tồn tại. Thay thế bằng một email bạn biết chắc đã có trong DB test của Supabase.
        // Hoặc tốt hơn, hãy mock API response.
        const existingEmail = 'existinguser@example.com';

        // Mock (giả lập) API call đến Supabase
        cy.intercept('POST', '**/auth/v1/signup', (req) => {
            // Chỉ intercept khi email gửi đi là email đã tồn tại
            if (req.body.email === existingEmail) {
                req.reply({
                    statusCode: 422, // Hoặc bất kỳ mã lỗi nào Supabase trả về
                    body: {
                        message: "User already registered", // Giả lập thông báo lỗi của Supabase
                    },
                });
            } else {
                // Cho các request khác đi qua bình thường
                req.continue();
            }
        }).as('signupRequest');


        // Điền thông tin với email đã tồn tại
        cy.get('input[placeholder="Nhập email của bạn"]').type(existingEmail);
        cy.get('input[placeholder="Nhập tên người dùng"]').type('AnotherUser');
        cy.get('input[placeholder="Nhập mật khẩu"]').type('password123');

        // Lắng nghe sự kiện alert
        cy.on('window:alert', (text) => {
            expect(text).to.contain('Đăng ký thất bại: User already registered');
        });

        // Click nút đăng ký
        cy.get('button[type="submit"]').contains('Đăng ký').click();

        // Đợi cho request API được hoàn thành
        cy.wait('@signupRequest');
    });


    // Kịch bản 3: Kiểm tra tính năng ẩn/hiện mật khẩu
    it('should toggle password visibility', () => {
        const passwordInput = 'input[placeholder="Nhập mật khẩu"]';

        // 1. Mật khẩu ban đầu phải là type="password"
        cy.get(passwordInput).should('have.attr', 'type', 'password');

        // 2. Click vào icon con mắt
        cy.get(passwordInput).siblings('button').click();

        // 3. Mật khẩu bây giờ phải là type="text"
        cy.get(passwordInput).should('have.attr', 'type', 'text');

        // 4. Click lần nữa
        cy.get(passwordInput).siblings('button').click();

        // 5. Mật khẩu phải quay về type="password"
        cy.get(passwordInput).should('have.attr', 'type', 'password');
    });


    // Kịch bản 4: Kiểm tra xác thực HTML5 cho các trường bắt buộc
    it('should not submit the form if required fields are empty', () => {
        // Click nút submit ngay lập tức mà không điền gì
        cy.get('button[type="submit"]').contains('Đăng ký').click();

        // Trình duyệt sẽ tự động focus vào trường bắt buộc đầu tiên bị thiếu
        // Chúng ta có thể kiểm tra xem trường email có đang ở trạng thái 'invalid' hay không
        cy.get('input[placeholder="Nhập email của bạn"]:invalid')
            .should('have.length', 1) // Phải có 1 trường email invalid
            .then(($input) => {
                // Kiểm tra thông báo validation của trình duyệt (cách này có thể khác nhau giữa các trình duyệt)
                const validationMessage = ($input[0] as HTMLInputElement).validationMessage;
                cy.wrap(validationMessage).should('not.be.empty');

            });
    });


    // Kịch bản 5: Kiểm tra xác thực HTML5 cho độ dài mật khẩu
    it('should show a validation error for a password shorter than 6 characters', () => {
        cy.get('input[placeholder="Nhập email của bạn"]').type('shortpass@example.com');
        cy.get('input[placeholder="Nhập tên người dùng"]').type('ShortPassUser');
        cy.get('input[placeholder="Nhập mật khẩu"]').type('12345');

        // Lắng nghe sự kiện alert
        cy.on('window:alert', (text) => {
            // Kiểm tra nội dung của alert
            expect(text).to.contain('Password should be at least 6 characters');
        });

        // Click submit
        cy.get('button[type="submit"]').contains('Đăng ký').click();
    });

});