// cypress/support/index.d.ts
declare namespace Cypress {
    interface Chainable {
        /**
         * Custom command to log in a user programmatically.
         * @example cy.login()
         * @example cy.login('user@example.com', 'password123')
         */
        login(email?: string, password?: string): Chainable<void>;
    }
}