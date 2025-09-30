"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { parseISO, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileDown } from "lucide-react"

export const schema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string(),
  status: z.string(),
  value: z.coerce.number(),
  category: z.string(),
  due_date: z.string().nullable().optional(),
  payment_date: z.string().nullable().optional(),
})

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Arrastar</span>
    </Button>
  )
}

const getColumns = (
  onEditClick?: (finance: z.infer<typeof schema>) => void,
  onDeleteClick?: (id: number) => void
): ColumnDef<z.infer<typeof schema>>[] => [
  {
    accessorKey: "id",
    header: "ID",
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "titulo",
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => row.original.title,
  },
  {
    id: "tipo",
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.type}
      </Badge>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status

      let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
      let className = "px-1.5 flex gap-1 items-center"

      if (status === "Pago") {
        variant = "default"
        className += " bg-green-500 hover:bg-green-600 text-white"
      } else if (status === "Pendente") {
        variant = "secondary"
        className += " bg-yellow-500 hover:bg-yellow-600 text-white"
      } else if (status === "Atrasada") {
        variant = "destructive"
        className += " bg-red-500 hover:bg-red-600 text-white"
      }

      return (
        <Badge variant={variant} className={className}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "Data Pagamento",
    accessorKey: "payment_date",
    header: "Data de Pagamento",
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.payment_date
          ? format(parseISO(row.original.payment_date), "dd/MM/yyyy", { locale: ptBR })
          : <span className="text-muted-foreground">-</span>}
      </div>
    ),
  },
  {
    id: "Data Vencimento",
    accessorKey: "due_date",
    header: "Data de Vencimento",
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.due_date
          ? format(parseISO(row.original.due_date), "dd/MM/yyyy", { locale: ptBR })
          : <span className="text-muted-foreground">-</span>}
      </div>
    ),
  },
  {
    id: "valor",
    accessorKey: "value",
    header: () => <div className="w-full text-right">Valor</div>,
    cell: ({ row }) => {
      const tipo = row.original.type
      const valor = row.original.value

      let textColor = "text-gray-900 dark:text-gray-100"
      if (tipo === "Despesa") {
        textColor = "text-red-600 dark:text-red-400"
      } else if (tipo === "Receita") {
        textColor = "text-green-600 dark:text-green-400"
      }

      return (
        <div className={`text-right font-medium ${textColor}`}>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(valor ?? 0))}
        </div>
      )
    },
  },
  {
    id: "categoria",
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => row.original.category,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const multipleSelected = selectedRows.length > 1

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => !multipleSelected && onEditClick?.(row.original)}
              disabled={multipleSelected}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>Detalhes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (multipleSelected) {
                  selectedRows.forEach((r) =>
                    onDeleteClick?.(r.original.id)
                  )
                } else {
                  onDeleteClick?.(row.original.id)
                }
              }}
            >
              {multipleSelected ? "Excluir selecionados" : "Excluir"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function DraggableRow({
  row,
  onEditClick,
}: {
  row: Row<z.infer<typeof schema>>
  onEditClick?: (finance: z.infer<typeof schema>) => void
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 cursor-pointer"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (
          target.closest("button") ||
          target.closest("a") ||
          target.closest("[role=menuitem]")
        ) {
          return
        }
        onEditClick?.(row.original)
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onExportClick,
}: {
  data: z.infer<typeof schema>[]
  onAddClick?: () => void
  onEditClick?: (finance: z.infer<typeof schema>) => void
  onDeleteClick?: (id: number) => void
  onExportClick?: () => void
}) {
  const [data, setData] = React.useState(() => initialData)
  React.useEffect(() => setData(initialData), [initialData])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ id: false })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "id", desc: true },
  ])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns: getColumns(onEditClick, onDeleteClick),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList>
          <TabsTrigger value="outline">Registros</TabsTrigger>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportClick}
            className="ml-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Colunas</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={onAddClick}>
            <IconPlus />
            <span className="hidden lg:inline">Adicionar Registro</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow
                        key={row.id}
                        row={row}
                        onEditClick={onEditClick}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      Nenhum resultado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Próxima</span>
                <IconChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
