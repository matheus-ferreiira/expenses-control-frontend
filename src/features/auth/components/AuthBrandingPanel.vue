<script setup lang="ts">
// Static branding panel — no logic needed
</script>

<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden select-none"
    style="background-color: hsl(222 47% 4%);">

    <!-- Dot grid background -->
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
        background-size: 28px 28px;
      "
    />

    <!-- Subtle violet glow — top right -->
    <div
      class="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full"
      style="background: radial-gradient(circle, hsl(262 83% 58% / 0.09) 0%, transparent 70%);"
    />

    <!-- Bottom gradient fade -->
    <div
      class="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
      style="background: linear-gradient(to top, hsl(222 47% 4%), transparent);"
    />

    <!-- Content -->
    <div class="relative z-10 flex h-full flex-col px-10 py-10">

      <!-- Top: wordmark -->
      <div class="flex items-center gap-2.5">
        <span class="text-[18px] font-semibold tracking-tight text-white/90">Vault</span>
        <span
          class="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40"
          style="border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);"
        >
          Beta
        </span>
      </div>

      <!-- Spacer -->
      <div class="flex-1 flex flex-col justify-center">

        <!-- Headline -->
        <div class="mb-8">
          <h2
            class="text-[32px] font-semibold leading-[1.15] tracking-tight text-white/90"
            style="letter-spacing: -0.02em;"
          >
            Suas finanças,<br />
            finalmente em ordem —<br />
            com a inteligência<br />
            ao seu lado.
          </h2>
          <p class="mt-4 text-[14px] leading-relaxed text-white/35 max-w-[300px]">
            Tarefas, hábitos, metas e agenda —
            tudo integrado no seu sistema operacional pessoal.
          </p>
        </div>

        <!-- Mini mockup cards -->
        <div class="space-y-2.5 max-w-[300px]">

          <!-- Card 1: Tasks -->
          <div
            class="rounded-lg px-3.5 py-3"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);"
          >
            <p class="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-2">Tarefas hoje</p>
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full shrink-0" style="border: 1px solid rgba(255,255,255,0.15);" />
                <div class="h-2 rounded-full flex-1" style="background: rgba(255,255,255,0.12);" />
                <div class="h-1.5 w-1.5 rounded-full shrink-0" style="background: rgba(239,68,68,0.5);" />
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full shrink-0 flex items-center justify-center"
                  style="background: rgba(16,185,129,0.25); border: 1px solid rgba(16,185,129,0.3);">
                  <div class="h-1.5 w-1.5 rounded-full" style="background: rgba(16,185,129,0.8);" />
                </div>
                <div class="h-2 rounded-full" style="background: rgba(255,255,255,0.06); width: 55%;" />
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full shrink-0" style="border: 1px solid rgba(255,255,255,0.15);" />
                <div class="h-2 rounded-full" style="background: rgba(255,255,255,0.10); width: 70%;" />
              </div>
            </div>
          </div>

          <!-- Card 2: Habits + Finance inline -->
          <div class="grid grid-cols-2 gap-2.5">
            <div
              class="rounded-lg px-3 py-2.5"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);"
            >
              <p class="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-1.5">Streak</p>
              <p class="text-[18px] font-semibold text-white/70 leading-none tabular-nums">
                12<span class="text-[11px] font-normal text-white/30 ml-0.5">dias</span>
              </p>
              <div class="flex gap-0.5 mt-1.5">
                <div v-for="i in 7" :key="i"
                  class="h-1.5 w-1.5 rounded-full"
                  :style="{ background: i <= 5 ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.1)' }"
                />
              </div>
            </div>
            <div
              class="rounded-lg px-3 py-2.5"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);"
            >
              <p class="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-1.5">Saldo</p>
              <p class="text-[15px] font-semibold leading-none tabular-nums" style="color: rgba(16,185,129,0.8);">
                R$ 4.820
              </p>
              <p class="text-[10px] text-white/25 mt-1">+R$ 320 este mês</p>
            </div>
          </div>

        </div>
      </div>

      <!-- Bottom: subtle tagline -->
      <p class="text-[11px] text-white/20">
        &copy; {{ new Date().getFullYear() }} Vault — uso pessoal
      </p>

    </div>
  </div>
</template>
