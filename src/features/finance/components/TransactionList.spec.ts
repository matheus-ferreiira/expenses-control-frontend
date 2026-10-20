import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TransactionList from './TransactionList.vue'
import type { Transaction } from '@/types/finance'

let seq = 0
const tx = (date: string, overrides: Partial<Transaction> = {}) =>
  ({ id: `t${++seq}`, type: 'expense', amount: 10, description: `Item ${seq}`, transaction_date: date, status: 'confirmed', is_recurring: false, ...overrides }) as Transaction

const confirmed = Array.from({ length: 25 }, (_, i) => tx(`2026-10-${String(i + 1).padStart(2, '0')}`))
const scheduled = [tx('2026-10-30', { status: 'pending', type: 'income', amount: 2500 }), tx('2026-10-31', { status: 'pending', amount: 700 })]

const rows = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('li[id^="tx-"]')

describe('transaction list', () => {
  it('keeps scheduled items in a collapsed block with what comes in and goes out', async () => {
    const wrapper = mount(TransactionList, { props: { transactions: [...confirmed, ...scheduled], splitScheduled: true, limit: 20 } })
    const block = wrapper.get('button[aria-expanded="false"]')
    expect(block.text()).toContain('Agendadas (2)')
    expect(block.text()).toContain('2.500,00')
    expect(block.text()).toContain('700,00')
    // Collapsed: only what already happened is listed, latest first, up to the limit
    expect(rows(wrapper)).toHaveLength(20)
    expect(rows(wrapper)[0]!.text()).toContain('Item 25')

    await block.trigger('click')
    expect(rows(wrapper)).toHaveLength(22)
  })

  it('shows the rest with "Ver mais"', async () => {
    const wrapper = mount(TransactionList, { props: { transactions: confirmed, splitScheduled: true, limit: 20 } })
    const more = wrapper.findAll('button').find((b) => b.text().startsWith('Ver mais'))!
    expect(more.text()).toBe('Ver mais (5)')
    await more.trigger('click')
    expect(rows(wrapper)).toHaveLength(25)
    expect(wrapper.findAll('button').some((b) => b.text().startsWith('Ver mais'))).toBe(false)
  })

  it('lists every match, unsplit and unlimited, while a narrowing filter is on', () => {
    const wrapper = mount(TransactionList, { props: { transactions: [...confirmed, ...scheduled], splitScheduled: true, limit: 20, showAll: true } })
    expect(wrapper.text()).not.toContain('Agendadas')
    expect(rows(wrapper)).toHaveLength(27)
  })
})
