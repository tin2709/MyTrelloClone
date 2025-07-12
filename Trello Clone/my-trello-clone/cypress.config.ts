// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Đăng ký task nếu cần
      on('task', {
        async login({ email, password }) {
          console.log(`Logging in as ${email}...`);
          const formData = new FormData();
          formData.append('email', email);
          formData.append('password', password);

          try {
            const { login } = require('./src/app/login/actions-for-test');
            await login({}, formData);
          } catch (error) {
            if (error.digest?.startsWith('NEXT_REDIRECT')) {
              return { success: true };
            }
            throw error;
          }

          return null;
        }
      });
    }
  },
  env: {
    TEST_USER_EMAIL: 'phamtrungtinpy363@gmail.com',
    TEST_USER_PASSWORD: '27092003'
  }
});
