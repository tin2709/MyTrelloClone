import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    // tsconfig: 'cypress.tsconfig.json', // ✅ chỉ rõ tsconfig riêng
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
