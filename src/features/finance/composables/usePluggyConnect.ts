/**
 * Abre o widget Pluggy Connect (iframe da Pluggy). As credenciais do banco são digitadas no widget e
 * nunca passam pelo VaultOS; o backend só recebe o id do item criado.
 * O SDK é carregado sob demanda para não pesar no bundle das outras telas.
 */
export interface PluggyConnectOptions {
  connectToken: string
  includeSandbox: boolean
  /** Item a autorizar de novo (modo de atualização) */
  updateItem?: string | null
}

export interface PluggyConnectResult {
  /** Id do item criado/atualizado, ou null se o usuário fechou sem concluir */
  itemId: string | null
  /** Último erro mostrado pelo widget, quando ele foi fechado sem sucesso */
  error: string | null
}

export async function openPluggyConnect(options: PluggyConnectOptions): Promise<PluggyConnectResult> {
  const { PluggyConnect } = await import('pluggy-connect-sdk')
  const dark = document.documentElement.classList.contains('dark')

  return new Promise((resolve, reject) => {
    let settled = false
    let lastError: string | null = null
    const finish = (result: PluggyConnectResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const widget = new PluggyConnect({
      connectToken: options.connectToken,
      includeSandbox: options.includeSandbox,
      updateItem: options.updateItem ?? undefined,
      countries: ['BR'],
      language: 'pt',
      theme: dark ? 'dark' : 'light',
      // O sucesso já registra a conexão; o widget continua aberto até o usuário fechar
      onSuccess: ({ item }: { item: { id: string } }) => finish({ itemId: item.id, error: null }),
      // O widget mostra o erro e deixa tentar de novo: só guardamos a mensagem para o caso de fechar
      onError: ({ message }: { message: string }) => {
        lastError = message
      },
      onClose: () => finish({ itemId: null, error: lastError }),
    })
    widget.init().catch((e: unknown) => {
      if (settled) return
      settled = true
      reject(e)
    })
  })
}
