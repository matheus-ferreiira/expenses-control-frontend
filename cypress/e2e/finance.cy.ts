/**
 * Finance smoke test: every finance screen opens and its main action works, against a LOCAL backend.
 * Two bugs lived in these paths unnoticed (archiving an account, editing/completing a goal).
 *
 * Needs: backend on API_URL (default http://localhost:8001) with a local user E2E_EMAIL / E2E_PASSWORD
 * (default dev@vault.test / VaultDev2026!). Registration is closed, so create that user once locally.
 * Run: npm run test:e2e:dev   or   npx cypress run --config baseUrl=http://localhost:5176
 */
const API = (Cypress.env('API_URL') as string | undefined) ?? 'http://localhost:8001'
const EMAIL = (Cypress.env('E2E_EMAIL') as string | undefined) ?? 'dev@vault.test'
const PASSWORD = (Cypress.env('E2E_PASSWORD') as string | undefined) ?? 'VaultDev2026!'
const stamp = Date.now()

let token = ''

function api(method: string, path: string, body?: object) {
  return cy.request({
    method,
    url: `${API}/api/v1/${path}`,
    body,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
}

function visit(path: string) {
  cy.visit(path, { onBeforeLoad: (win) => win.localStorage.setItem('auth_token', token) })
}

describe('Finanças', () => {
  before(() => {
    cy.request('POST', `${API}/api/v1/auth/login`, { email: EMAIL, password: PASSWORD }).then((r) => {
      token = r.body.data.token
    })
  })

  beforeEach(() => cy.viewport(390, 844))

  it('Visão Geral mostra o mês, o saldo e as transações', () => {
    visit('/finance')
    cy.contains('Saldo', { timeout: 20000 }).should('be.visible')
    cy.contains('h2', 'Transações').should('be.visible')
    cy.contains('button', 'Filtros').click()
    cy.contains('Valem para a lista de transações do mês.').should('be.visible')
  })

  it('Contas: arquiva e desarquiva uma conta', () => {
    const name = `E2E conta ${stamp}`
    api('POST', 'finance/accounts', { name, type: 'checking', balance: 0, currency: 'BRL', color: '#3B82F6' }).then((r) => {
      const id = r.body.data.id as string
      visit('/finance/accounts')
      cy.contains(name, { timeout: 20000 }).should('be.visible')
      cy.get(`[aria-label="Ver transações de ${name}"]`).find('[aria-label="Opções da conta"]').click()
      cy.contains('[role="menuitem"]', 'Arquivar').click()
      cy.contains('button', 'Arquivar').click()
      cy.contains('Conta arquivada').should('be.visible')
      cy.contains('button', /Arquivadas/).click()
      cy.get(`[aria-label="Ver transações de ${name}"]`).find('[aria-label="Opções da conta"]').click()
      cy.contains('[role="menuitem"]', 'Desarquivar').click()
      cy.contains('Conta reativada').should('be.visible')
      // An account with history cannot be deleted (on purpose): leave the test account archived
      api('PATCH', `finance/accounts/${id}`, { is_active: false })
    })
  })

  it('Contas: abre "Saldo em uma data"', () => {
    visit('/finance/accounts')
    cy.contains('button', 'Saldo em uma data', { timeout: 20000 }).click()
    cy.contains('Quanto havia em cada conta no fim do dia escolhido.').should('be.visible')
  })

  it('Cartões, Orçamento, Categorias e Relatórios abrem', () => {
    visit('/finance/cards')
    cy.contains('button', 'Novo cartão', { timeout: 20000 }).should('be.visible')
    visit('/finance/budget')
    cy.contains(/Orçado|Nenhum orçamento/, { timeout: 20000 }).should('be.visible')
    visit('/finance/categories')
    cy.contains('Despesas', { timeout: 20000 }).should('be.visible')
    cy.contains('button', 'Adicionar categoria').should('be.visible')
    visit('/finance/reports')
    cy.contains(/Mês fechado|Em andamento|Previsão/, { timeout: 20000 }).should('be.visible')
    cy.contains('button', 'Anual').click()
    cy.contains(/Ano fechado|Em andamento|Previsão/, { timeout: 20000 }).should('be.visible')
  })

  it('Metas: edita e conclui uma meta', () => {
    const name = `E2E meta ${stamp}`
    api('POST', 'finance/goals', { name, target_amount: 1000, color: '#5CA8F5' }).then((r) => {
      const id = r.body.data.id as string
      visit('/finance/goals')
      cy.get(`[aria-label="Editar meta ${name}"]`, { timeout: 20000 }).click()
      cy.contains('Editar meta').should('be.visible')
      cy.get('input[placeholder^="Ex: Viagem"]').clear()
      cy.get('input[placeholder^="Ex: Viagem"]').type(`${name} editada`)
      cy.contains('button', 'Salvar').click()
      cy.contains(`${name} editada`, { timeout: 20000 }).should('be.visible')
      api('POST', `finance/goals/${id}/complete`).its('status').should('eq', 200)
      api('DELETE', `finance/goals/${id}`)
    })
  })
})
