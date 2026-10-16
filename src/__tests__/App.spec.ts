import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, h } from 'vue'
import App from '../App.vue'

// The scaffold test expected Vite's "You did it!" page and mounted without Pinia, so it always failed.
describe('App', () => {
  it('mounts the router view with the app providers', async () => {
    const Home = defineComponent({ render: () => h('p', 'Vault') })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Home }] })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })

    expect(wrapper.text()).toContain('Vault')
  })
})
