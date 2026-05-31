<script setup lang="ts">
// Static branding panel — no logic needed
</script>

<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden select-none bg-card">

    <!-- Dot grid — decorative atmospheric texture -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px;"
    />

    <!-- Primary glow — top right, brand-coloured -->
    <div
      class="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full"
      style="background: radial-gradient(circle, hsl(var(--primary) / 0.07) 0%, transparent 65%);"
    />

    <!-- Bottom gradient fade to panel surface -->
    <div
      class="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
      style="background: linear-gradient(to top, hsl(var(--card)), transparent);"
    />

    <!-- Content -->
    <div class="relative z-10 flex h-full flex-col px-14 py-12">

      <!-- Wordmark -->
      <div class="flex items-center gap-2.5">
        <span class="text-[18px] font-semibold tracking-tight text-foreground">Vault</span>
        <span class="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] border border-border/50 bg-muted/20 text-muted-foreground/40">
          Beta
        </span>
      </div>

      <!-- Vertically centred body -->
      <div class="flex-1 flex flex-col justify-center">

        <!-- Headline -->
        <div class="mb-10">
          <h2 class="text-[30px] font-semibold leading-[1.18] tracking-tight text-foreground">
            Suas finanças,<br />
            finalmente em ordem —<br />
            com a inteligência<br />
            ao seu lado.
          </h2>
          <p class="mt-4 text-[14px] leading-relaxed text-muted-foreground/60">
            Tarefas, hábitos, metas e agenda —
            tudo integrado no seu sistema operacional pessoal.
          </p>
        </div>

        <!-- Preview cards — VaultOS pattern -->
        <div class="space-y-2.5">

          <!-- Tasks card -->
          <div class="bg-background border border-border rounded-lg px-4 py-3.5">
            <p class="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Tarefas hoje</p>
            <div class="space-y-2">
              <div class="flex items-center gap-2.5">
                <div class="h-3.5 w-3.5 rounded-full shrink-0 border border-border" />
                <div class="h-2 rounded-full flex-1 bg-muted" />
                <div class="h-1.5 w-1.5 rounded-full shrink-0 bg-destructive/50" />
              </div>
              <div class="flex items-center gap-2.5">
                <div class="h-3.5 w-3.5 rounded-full shrink-0 bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <div class="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div class="h-2 rounded-full bg-muted/50" style="width: 55%;" />
              </div>
              <div class="flex items-center gap-2.5">
                <div class="h-3.5 w-3.5 rounded-full shrink-0 border border-border" />
                <div class="h-2 rounded-full bg-muted/40" style="width: 70%;" />
              </div>
            </div>
          </div>

          <!-- Streak + Balance — side by side -->
          <div class="grid grid-cols-2 gap-2.5">

            <!-- Streak -->
            <div class="bg-background border border-border rounded-lg px-3.5 py-3">
              <p class="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">Streak</p>
              <p class="text-[20px] font-semibold text-primary leading-none tabular-nums">
                12<span class="text-[11px] font-normal text-muted-foreground/50 ml-0.5">dias</span>
              </p>
              <div class="flex gap-0.5 mt-2">
                <div
                  v-for="i in 7"
                  :key="i"
                  class="h-1.5 w-1.5 rounded-full"
                  :class="i <= 5 ? 'bg-primary/70' : 'bg-muted-foreground/15'"
                />
              </div>
            </div>

            <!-- Balance — primary top-border accent -->
            <div
              class="bg-background border border-border rounded-lg px-3.5 py-3"
              style="border-top: 2px solid hsl(var(--primary));"
            >
              <p class="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">Saldo</p>
              <p class="text-[16px] font-semibold leading-none tabular-nums text-success">R$ 4.820</p>
              <p class="text-[10px] text-muted-foreground/40 mt-1.5 tabular-nums">+R$ 320 este mês</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-[11px] text-muted-foreground/25">
        &copy; {{ new Date().getFullYear() }} Vault — uso pessoal
      </p>

    </div>
  </div>
</template>
