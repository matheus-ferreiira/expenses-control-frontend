import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CategoryBreakdownList from './CategoryBreakdownList.vue'
import CategoryTransactionsSheet from './CategoryTransactionsSheet.vue'
import { financeApi } from '@/services/api/finance'
import type { CategoryBreakdownItem, Transaction } from '@/types/finance'

vi.mock('@/services/api/finance', () => ({ financeApi: { categoryTransactions: vi.fn() } }))
vi.mock('@/stores/finance', () => ({ useFinanceStore: () => ({ categories: [] }) }))

const category: CategoryBreakdownItem = { category_id: 'food', category: 'Alimentação', color: '#888', total: 25, count: 1, percentage: 100 }
const shared = { id: 'shared', description: 'Almoço compartilhado', transaction_date: '2026-10-10', amount: 100, economic_effect: { income: 0, expense: 2500 } } as Transaction
const response = (data: Transaction[], page = 1, last = 1) => ({ data, meta: { current_page: page, last_page: last, total: last, per_page: 1, from: page, to: page } })

function mountSheet() {
  return mount(CategoryTransactionsSheet, {
    props: { open: true, category, type: 'expense', month: '2026-10' },
    global: { stubs: Object.fromEntries(['Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription'].map((name) => [name, { template: '<div><slot /></div>' }])) },
  })
}

beforeEach(() => vi.resetAllMocks())

describe('category breakdown', () => {
  it('opens the exact category with an accessible button, including uncategorized entries', async () => {
    const uncategorized = { ...category, category_id: null, category: 'Sem categoria' }
    const wrapper = mount(CategoryBreakdownList, { props: { categories: [category, uncategorized], selectable: true } })
    await wrapper.get('button[aria-label="Ver transações de Sem categoria"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[uncategorized]])
  })

  it('requests the selected month/category and shows the economic share before opening details', async () => {
    vi.mocked(financeApi.categoryTransactions).mockResolvedValue(response([shared]))
    const wrapper = mountSheet()
    await flushPromises()
    expect(financeApi.categoryTransactions).toHaveBeenCalledWith({ year: 2026, month: 10, category_id: 'food', type: 'expense', page: 1 })
    expect(wrapper.get('li').text()).toContain('25,00')
    expect(wrapper.get('li').text()).not.toContain('100,00')
    await wrapper.get('li button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[shared]])
    wrapper.unmount()
  })

  it('appends pages and retries a failed next page without losing prior transactions', async () => {
    const request = vi.mocked(financeApi.categoryTransactions)
    request.mockResolvedValueOnce(response([shared], 1, 2))
    const wrapper = mountSheet()
    await flushPromises()
    request.mockRejectedValueOnce(new Error('network'))
    await wrapper.findAll('button').find((button) => button.text().startsWith('Carregar mais'))!.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível')
    expect(wrapper.findAll('li')).toHaveLength(1)
    request.mockResolvedValueOnce(response([{ ...shared, id: 'second' }], 2, 2))
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(request.mock.lastCall?.[0].page).toBe(2)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Carregar mais')
    wrapper.unmount()
  })

  it('ignores late responses when changing to income or another month/category', async () => {
    let resolveOld!: (value: ReturnType<typeof response>) => void
    const request = vi.mocked(financeApi.categoryTransactions)
    request.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
    const wrapper = mountSheet()
    request.mockResolvedValueOnce(response([]))
    await wrapper.setProps({ type: 'income', month: '2026-09', category: { ...category, category_id: null, category: 'Sem categoria' } })
    await flushPromises()
    expect(request.mock.lastCall?.[0]).toEqual({ year: 2026, month: 9, type: 'income', category_id: null, page: 1 })
    resolveOld(response([shared]))
    await flushPromises()
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.text()).toContain('Nenhuma transação confirmada')
    wrapper.unmount()
  })
})
