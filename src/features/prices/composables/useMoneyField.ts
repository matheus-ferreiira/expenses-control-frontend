import { ref } from 'vue'

function formatDisplay(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Controlled BRL money input state (digits → cents), same behavior as the
 * limit input in CreditCardFormDialog. Bind `:value="display"` + `@input="onInput"`.
 */
export function useMoneyField() {
  const display = ref('')

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement
    const digits = input.value.replace(/\D/g, '')
    display.value = digits ? formatDisplay(parseInt(digits, 10) / 100) : ''
    input.value = display.value
  }

  function setValue(value: number | null | undefined) {
    display.value = value !== null && value !== undefined ? formatDisplay(value) : ''
  }

  function toNumber(): number | null {
    if (!display.value.trim()) return null
    const parsed = parseFloat(display.value.replace(/\./g, '').replace(',', '.'))
    return isNaN(parsed) ? null : parsed
  }

  return { display, onInput, setValue, toNumber }
}
