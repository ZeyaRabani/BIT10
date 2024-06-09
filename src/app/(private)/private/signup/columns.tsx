"use client"

import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'

export type SignUpTypes = {
    newsletter_subscribers_id: number;
    email: string;
}

export const signUpColumns = (): ColumnDef<SignUpTypes>[] => [
    {
        accessorKey: 'newsletter_subscribers_id',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Newsletter Subscribers ID' />
        ),
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Email' />
        ),
    }
];
