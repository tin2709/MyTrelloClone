// cypress.config.js
const { defineConfig } = require('cypress');
// Import Server Action của bạn
const { login } = require('./src/app/login/actions-for-test'); // Cần tạo file này

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Đăng ký task 'login'
      on('task', {
        async login({ email, password }) {
          console.log(`Attempting to log in as ${email} from Cypress task...`);

          // Server Actions được thiết kế để nhận FormData.
          // Chúng ta cần giả lập nó.
          const formData = new FormData();
          formData.append('email', email);
          formData.append('password', password);

          try {
            // Server Action trả về một redirect, chúng ta cần bắt lỗi này
            await login({}, formData);
          } catch (error) {
            // Bắt lỗi redirect và xử lý nó
            if (error.digest?.startsWith('NEXT_REDIRECT')) {
              console.log('Login successful, caught redirect.');
              // Trả về một đối tượng thành công, hoặc session nếu có
              return { success: true };
            }
            // Nếu là lỗi khác, throw nó ra
            console.error('Login task failed:', error);
            throw error;
          }

          // Trả về null nếu không có redirect, để Cypress biết có lỗi
          return null;
        }
      });
    },
  },
  // Thêm biến môi trường để bảo mật credentials
  env: {
    TEST_USER_EMAIL: 'phamtrungtinpy363@gmail.com',
    TEST_USER_PASSWORD: '27092003',
  },
});