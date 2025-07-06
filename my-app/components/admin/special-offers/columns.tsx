"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ISpecialOffer } from "@/models/SpecialOffer"
import { format } from "date-fns"

export type SpecialOfferColumn = Pick<
    ISpecialOffer,
    | '_id'
    | 'title'
    | 'label'
    | 'tag'
    | 'validUntil'
    | 'isActive'
> & { isExpired: boolean };


export const columns = (
    onEdit: (offer: SpecialOfferColumn) => void, 
    onDelete: (offerId: string) => void
): ColumnDef<SpecialOfferColumn>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => row.original.label ? <Badge variant="outline">{row.original.label}</Badge> : '-',
  },
  {
    accessorKey: "tag",
    header: "Tag",
    cell: ({ row }) => row.original.tag ? <Badge variant="secondary">{row.original.tag}</Badge> : '-',
  },
  {
    accessorKey: "validUntil",
    header: "Valid Until",
    cell: ({ row }) => format(new Date(row.original.validUntil), "dd MMM yyyy"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { isActive, isExpired } = row.original;
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      return isActive ? (
        <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const offer = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(offer)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(offer._id.toString())}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 