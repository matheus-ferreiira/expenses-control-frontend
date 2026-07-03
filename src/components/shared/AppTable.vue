<script setup lang="ts" generic="T extends Record<string, unknown>">
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@ui/table'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'
import { Inbox } from 'lucide-vue-next'

export interface TableColumn<R extends Record<string, unknown>> {
  key: keyof R | string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

withDefaults(
  defineProps<{
    columns: TableColumn<T>[]
    rows: T[]
    loading?: boolean
    emptyTitle?: string
    emptyDescription?: string
    rowKey?: keyof T
  }>(),
  {
    loading: false,
    emptyTitle: 'Nenhum resultado',
    rowKey: 'id' as keyof T,
  },
)

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}
</script>

<template>
  <div class="rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead
            v-for="col in columns"
            :key="String(col.key)"
            :style="col.width ? { width: col.width } : undefined"
            :class="alignClass[col.align ?? 'left']"
          >
            {{ col.label }}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <!-- Loading state -->
        <TableRow v-if="loading">
          <TableCell :colspan="columns.length" class="p-0">
            <div class="px-4 py-3">
              <LoadingState :rows="4" variant="rows" />
            </div>
          </TableCell>
        </TableRow>

        <!-- Empty state -->
        <TableRow v-else-if="rows.length === 0">
          <TableCell :colspan="columns.length" class="p-0">
            <EmptyState
              :icon="Inbox"
              :title="emptyTitle"
              :description="emptyDescription"
            >
              <template v-if="$slots['empty-action']" #action>
                <slot name="empty-action" />
              </template>
            </EmptyState>
          </TableCell>
        </TableRow>

        <!-- Data rows -->
        <template v-else>
          <TableRow
            v-for="(row, rowIdx) in rows"
            :key="rowKey && row[rowKey] != null ? String(row[rowKey]) : rowIdx"
            class="border-border"
          >
            <TableCell
              v-for="col in columns"
              :key="String(col.key)"
              :class="alignClass[col.align ?? 'left']"
            >
              <slot :name="`cell-${String(col.key)}`" :row="row" :value="(row as Record<string, unknown>)[String(col.key)]">
                {{ (row as Record<string, unknown>)[String(col.key)] }}
              </slot>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
