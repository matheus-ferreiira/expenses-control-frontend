import { config, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AssistantProposal from './AssistantProposal.vue'
import type { AssistantMessage } from '@/types/assistant'

config.global.stubs = { RouterLink: true }

const message: AssistantMessage = {
  id: 'proposal',
  role: 'assistant',
  content: 'Confira',
  status: 'pending',
  expires_at: '2099-01-01T00:00:00Z',
  created_at: '2026-11-17T00:00:00Z',
  results: null,
  actions: [
    {
      entity: 'task',
      operation: 'update',
      id: 'task',
      data: { due_time: '09:00', due_date: '2026-11-18' },
      before: { title: 'Estudar', due_time: '08:00', due_date: '2026-11-18' },
    },
  ],
}

describe('AssistantProposal', () => {
  it('shows concrete changes and only requests approval after the user clicks', async () => {
    const wrapper = mount(AssistantProposal, { props: { message, busy: false } })
    expect(wrapper.text()).toContain('Antes: 08:00')
    expect(wrapper.text()).toContain('09:00')
    expect(wrapper.text()).toContain('18/11/2026')
    expect(wrapper.emitted('approve')).toBeUndefined()
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('approve')).toHaveLength(1)
  })

  it('disables confirmation while a request is in progress', () => {
    const wrapper = mount(AssistantProposal, { props: { message, busy: true } })
    expect(
      wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined),
    ).toBe(true)
  })

  it.each(['applied', 'rejected', 'superseded'] as const)(
    'does not offer confirmation for %s plans',
    (status) => {
      const wrapper = mount(AssistantProposal, {
        props: { message: { ...message, status }, busy: false },
      })
      expect(wrapper.findAll('button')).toHaveLength(0)
    },
  )

  it('does not offer approval for expired plans', () => {
    const wrapper = mount(AssistantProposal, {
      props: { message: { ...message, expires_at: '2000-01-01T00:00:00Z' }, busy: false },
    })
    expect(wrapper.text()).toContain('expirada')
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('renders model content as text and explicitly marks deletion', () => {
    const wrapper = mount(AssistantProposal, {
      props: {
        message: {
          ...message,
          actions: [
            {
              entity: 'task',
              operation: 'delete',
              id: 'task',
              data: {},
              before: { title: '<script>alert(1)</script>' },
            },
          ],
        },
        busy: false,
      },
    })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('Este plano também exclui')
    expect(wrapper.text()).toContain('<script>alert(1)</script>')
  })
})
