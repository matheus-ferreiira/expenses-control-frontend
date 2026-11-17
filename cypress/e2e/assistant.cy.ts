/// <reference types="cypress" />

import type { AssistantConversation, AssistantMessage } from '../../src/types/assistant'

const envelope = (data: unknown) => ({ success: true, data, message: '' })
const proposal = (): AssistantMessage => ({
  id: 'proposal-1',
  role: 'assistant',
  content:
    'Reservei uma proposta para amanhã: estudar às 19h e treinar pela manhã. Confira os itens antes de aplicar.',
  status: 'pending',
  created_at: '2026-11-17T12:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
  results: null,
  actions: [
    {
      entity: 'task',
      operation: 'create',
      id: null,
      data: {
        title: 'Estudar inglês',
        due_date: '2026-11-18',
        due_time: '19:00',
        estimated_minutes: 60,
        recurrence_type: 'weekdays',
      },
      before: null,
      timezone: 'America/Sao_Paulo',
    },
    {
      entity: 'habit',
      operation: 'create',
      id: null,
      data: { name: 'Treinar', frequency_type: 'custom', target_days: [1, 3, 5] },
      before: null,
      timezone: 'America/Sao_Paulo',
    },
  ],
})

function setup(configured = true) {
  let conversation: AssistantConversation = {
    id: 'conversation-1',
    title: 'Organizar meu dia',
    updated_at: '2026-11-17T12:00:00Z',
    messages: [],
  }
  // All API traffic is stubbed. These UI tests never contact a real backend or OpenAI.
  cy.intercept('**/api/v1/**', { statusCode: 200, body: envelope([]) })
  cy.intercept(
    'GET',
    '**/api/v1/auth/me',
    envelope({
      id: 'user',
      name: 'Matheus',
      email: 'local@example.test',
      timezone: 'America/Sao_Paulo',
      settings: {},
    }),
  )
  cy.intercept('GET', '**/api/v1/assistant/status', envelope({ configured }))
  cy.intercept('GET', '**/api/v1/assistant/conversations?*', (req) =>
    req.reply(envelope({ items: [conversation], has_more: false })),
  )
  cy.intercept('GET', '**/api/v1/assistant/conversations/conversation-1', (req) =>
    req.reply(envelope(conversation)),
  )
  cy.intercept('POST', '**/api/v1/assistant/conversations/conversation-1/messages', (req) => {
    conversation = {
      ...conversation,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          content: req.body.message,
          status: null,
          actions: null,
          results: null,
          created_at: '2026-11-17T12:00:00Z',
          expires_at: null,
        },
        proposal(),
      ],
    }
    req.reply(envelope(proposal()))
  }).as('send')
  cy.intercept(
    'POST',
    '**/api/v1/assistant/conversations/conversation-1/messages/proposal-1/approve',
    (req) => {
      expect(req.body).to.deep.equal({ confirmed: true })
      const applied: AssistantMessage = {
        ...proposal(),
        status: 'applied',
        results: [
          { entity: 'task', operation: 'create', id: 'created-task' },
          { entity: 'habit', operation: 'create', id: 'created-habit' },
        ],
      }
      conversation.messages = conversation.messages?.map((item) =>
        item.id === applied.id ? applied : item,
      )
      req.reply(envelope(applied))
    },
  ).as('approve')
  cy.visit('/assistant', {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'test-token')
    },
  })
}

describe('Assistente de rotina', { defaultCommandTimeout: 20000 }, () => {
  it('previews the plan, applies only on approval and restores history', () => {
    cy.viewport(1440, 1000)
    setup()
    cy.get('#assistant-message').type('Organize minha rotina de amanhã')
    cy.contains('button', 'Enviar').click()
    cy.wait('@send')
    cy.contains('Estudar inglês').should('be.visible')
    cy.contains('Seg, Qua, Sex').should('be.visible')
    cy.get('@approve.all').should('have.length', 0)
    cy.screenshot('assistant-desktop-proposal')
    cy.contains('button', 'Aprovar e aplicar').click()
    cy.wait('@approve')
    cy.contains('Plano aplicado').should('be.visible')
    cy.contains('a', 'Ver tarefas').should('have.attr', 'href', '/tasks')
    cy.contains('button', 'Aprovar e aplicar').should('not.exist')
    cy.reload()
    cy.contains('Plano aplicado').should('be.visible')
  })

  it('keeps a failed message and reuses the same request ID on retry', () => {
    cy.viewport(390, 844)
    setup()
    let requestId = ''
    cy.intercept('POST', '**/api/v1/assistant/conversations/conversation-1/messages', (req) => {
      if (requestId) expect(req.body.request_id).to.equal(requestId)
      requestId = req.body.request_id
      req.reply({ statusCode: 502, body: { message: 'Falha temporária do assistente' } })
    }).as('failure')
    cy.get('#assistant-message').type('Organize meu dia')
    cy.contains('button', 'Enviar').click()
    cy.wait('@failure')
    cy.contains('Falha temporária').should('be.visible')
    cy.get('#assistant-message').should('have.value', 'Organize meu dia')
    cy.contains('button', 'Enviar').click()
    cy.wait('@failure')
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(390))
    cy.screenshot('assistant-mobile-error')
  })

  it('shows setup guidance when the provider is not configured', () => {
    cy.viewport(390, 844)
    setup(false)
    cy.contains('O assistente está aguardando ativação').should('be.visible')
    cy.get('#assistant-message').should('be.disabled')
    cy.screenshot('assistant-mobile-setup')
  })
})
