"use client"

import * as React from 'react'
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type CellContext } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useWallet } from '@/context/WalletContext'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { addReferralQuestionsCompletedTasks } from '@/actions/dbActions'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { CircleCheck, ExternalLink } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

export type ReferralProfileTableDataType = {
    task: string,
    points: number
    status?: boolean,
    route?: string
}

interface DataTableProps<TData> {
    columns: ColumnDef<ReferralProfileTableDataType>[];
    data: TData[];
}

const FormSchema = z.object({
    type: z.enum(['all', 'mentions', 'none'], {
        required_error: 'You need to select a notification type.',
    }),
})

const questionsData = [
    {
        question: 'How many parts are there in the GitBook?',
        options: ['1', '2', '3', '4'],
        answer: '4',
    },
    {
        question: 'What is BIT10?',
        options: ['An asset manager', 'A GPU model from NVIDIA', 'A BRC20 token', 'A token'],
        answer: 'An asset manager',
    },
    {
        question: 'What does DCA in the GitBook stand for?',
        options: ['Dollar Cost Averaging', 'Daily Crypto Analysis', 'Dynamic Collateral Adjustment', 'Digital Coin Allocation'],
        answer: 'Dollar Cost Averaging',
    },
    {
        question: 'Which of the following tokens is not offered by BIT10?',
        options: ['BIT10.TOP', 'BIT10.MEME', 'BIT10.DEFI', 'BIT10.BEP'],
        answer: 'BIT10.BEP',
    },
    {
        question: 'What does BIT10.TOP track?',
        options: [
            'Top 10 crypto excluding stablecoins',
            'Top 10 ERC-20 tokens',
            'Top 10 BRC-20 tokens',
            'Top 10 stablecoins',
        ],
        answer: 'Top 10 crypto excluding stablecoins',
    },
    {
        question: 'What does BIT10.MEME track?',
        options: [
            'Top 10 meme coins',
            'Top 10 ERC-20 tokens',
            'Top 10 BRC-20 tokens',
            'Top 10 tokens',
        ],
        answer: 'Top 10 meme coins',
    },
    {
        question: "Where are BIT10's canisters deployed?",
        options: ['ICP', 'Ethereum', 'Bitcoin', 'Tron'],
        answer: 'ICP',
    },
    {
        question: 'How is the price of a BIT10 token determined?',
        options: ['Simple average', 'Median price', 'Weighted average', 'Oracle feed'],
        answer: 'Simple average',
    },
    {
        question: 'Which method is not currently allowed for connecting a wallet?',
        options: ['ICP', 'Solana', 'Email', 'Ethereum'],
        answer: 'Ethereum',
    },
    {
        question: 'Where is the collateral for BIT10 stored?',
        options: ['ICP canisters', 'Hard wallets', 'Cold wallets', 'Multi-sig wallets'],
        answer: 'ICP canisters',
    },
]

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j]!;
        arr[j] = temp!;
    }
    return arr
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<ReferralProfileTableDataType>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [dialogOpen, setDialogOpen] = React.useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showCloseButton, setShowCloseButton] = React.useState(false);

    const { principalId } = useWallet();

    const handleCopyMainnetReferral = (route: string) => {
        if (!principalId) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://bit10.app/${route}?referral=${principalId}`
        // `http://localhost:3000/${route}?referral=${principalId}`;

        navigator.clipboard.writeText(referralLink)
            .then(() => {
                toast.success('Referral link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy referral link');
            });
    };

    const handleCopyTestnetReferral = (route: string) => {
        if (!principalId) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://testnet.bit10.app/${route}?referral=${principalId}`
        // `http://localhost:3000/${route}?referral=${principalId}`;

        navigator.clipboard.writeText(referralLink)
            .then(() => {
                toast.success('Referral link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy referral link');
            });
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const [userAnswers, setUserAnswers] = useState<string[]>(Array(questionsData.length).fill(''))
    const [showResults, setShowResults] = useState(false)

    const questions = useMemo(
        () =>
            questionsData.map((q) => ({
                ...q,
                shuffledOptions: shuffleArray(q.options || []),
            })),
        []
    )
    const correctCount = userAnswers.reduce(
        (acc, ans, idx) => {
            const question = questions[idx];
            return acc + (question && ans === question.answer ? 1 : 0);
        },
        0
    );

    const handleOptionChange = (qIdx: number, value: string) => {
        const updated = [...userAnswers]
        updated[qIdx] = value
        setUserAnswers(updated)
    }

    const allAnswered = userAnswers.every((ans) => ans !== '')

    async function handleQuizSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setShowResults(true);
        // console.log('Correct answers:', correctCount);
        if (correctCount === 10 && principalId) {
            const result = await addReferralQuestionsCompletedTasks({
                address: principalId
            })

            if (result === 'Questionnaire marked as completed') {
                toast.success('Questionnaire marked as completed!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        }
    };

    const renderCellContent = (cell: CellContext<ReferralProfileTableDataType, unknown>, row: { original: ReferralProfileTableDataType }) => {
        switch (cell.column.id) {
            case 'action':
                return (
                    <div>
                        {row.original.status ? (
                            <Button variant='outline' className='dark:border-white w-full'>
                                <CircleCheck className='mr-2 h-4 w-4' />
                                Task Completed
                            </Button>
                        ) : (
                            row.original.task === 'Swap on Internet Computer Testnet' ?
                                <a href='https://testnet.bit10.app/swap' target='_blank'>
                                    <Button className='w-full'>
                                        Swap on Testnet
                                        <ExternalLink className='ml-2 h-4 w-4' />
                                    </Button>
                                </a> :
                                row.original.task === 'Provide liquidity on Internet Computer Liquidity Hub Testnet' ?
                                    <a href='https://testnet.bit10.app/liquidity-hub' target='_blank'>
                                        <Button className='w-full'>
                                            Swap on Liquidity Hub
                                            <ExternalLink className='ml-2 h-4 w-4' />
                                        </Button>
                                    </a> :
                                    row.original.task === 'Reverse Swap BIT10.TOP on Mainnet' ?
                                        <a href='https://bit10.app/swap?mode=mint' target='_blank'>
                                            <Button className='w-full'>
                                                Reverse Swap on Mainnet
                                                <ExternalLink className='ml-2 h-4 w-4' />
                                            </Button>
                                        </a> :
                                        row.original.task === 'Read the GitBook and answer the following questions' ?
                                            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setShowCloseButton(false); }}>
                                                <DialogTrigger asChild>
                                                    <Button className='w-full'>Answer questions</Button>
                                                </DialogTrigger>
                                                <DialogContent className='max-w-[80vw]'>
                                                    <DialogHeader>
                                                        <DialogTitle>Answer questions</DialogTitle>
                                                        <DialogDescription>
                                                            After reading the GitBook, please answer the following questions. Points will be awarded only after all questions are answered correctly.                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <Form {...form}>
                                                        <form
                                                            className='w-full max-h-[50vh] md:max-h-[60vh] flex flex-col space-y-4 overflow-x-scroll overflow-y-scroll'
                                                            onSubmit={handleQuizSubmit}
                                                        >
                                                            {questions.map((q, qIdx) => (
                                                                <div key={qIdx} className='mb-4'>
                                                                    <div className='font-semibold mb-2'>{qIdx + 1}. {q.question}</div>
                                                                    <div className='flex flex-col gap-2'>
                                                                        {q.shuffledOptions.map((opt, oIdx) => {
                                                                            const isSelected = userAnswers[qIdx] === opt
                                                                            const isCorrect = showResults && isSelected && opt === q.answer
                                                                            const isWrong = showResults && isSelected && opt !== q.answer
                                                                            return (
                                                                                <label
                                                                                    key={oIdx}
                                                                                    className={cn(
                                                                                        'flex items-center gap-2 p-2 rounded cursor-pointer border',
                                                                                        {
                                                                                            'bg-green-100 border-green-500 text-black': isCorrect,
                                                                                            'bg-red-100 border-red-500 text-black': isWrong,
                                                                                            'border-gray-300': !isCorrect && !isWrong,
                                                                                        }
                                                                                    )}
                                                                                >
                                                                                    <input
                                                                                        type='radio'
                                                                                        name={`question-${qIdx}`}
                                                                                        value={opt}
                                                                                        checked={isSelected}
                                                                                        disabled={showResults}
                                                                                        onChange={() => handleOptionChange(qIdx, opt)}
                                                                                    />
                                                                                    {opt}
                                                                                </label>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {showResults && (
                                                                <div className='mt-4 text-lg font-bold text-center'>
                                                                    You got {correctCount} out of {questions.length} correct!
                                                                </div>
                                                            )}
                                                            <Button
                                                                type='submit'
                                                                disabled={!allAnswered || showResults}
                                                                className='w-full'
                                                            >
                                                                Submit Answers
                                                            </Button>
                                                        </form>
                                                    </Form>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant='outline' className='dark:border-white'>Close</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            :
                                            <a href='https://bit10.app/swap' target='_blank'>
                                                <Button className='w-full'>
                                                    Swap on Mainnet
                                                    <ExternalLink className='ml-2 h-4 w-4' />
                                                </Button>
                                            </a>
                        )}
                    </div>
                );
            case 'others_action':
                return (
                    <div>
                        {row.original.task === 'Swap on Internet Computer Liquidity Hub' ?
                            <Button className='w-full' onClick={() => handleCopyTestnetReferral('liquidity-hub')}>
                                <Copy className='mr-2 h-4 w-4' />
                                Copy your Liquidity Hub referral link
                            </Button> :
                            row.original.task === 'Swap on BIT10 Testnet' ?
                                <Button className='w-full' onClick={() => handleCopyTestnetReferral('swap')}>
                                    <Copy className='mr-2 h-4 w-4' />
                                    Copy your Testnet Swap referral link
                                </Button> :
                                <Button className='w-full' onClick={() => handleCopyMainnetReferral('swap')}>
                                    <Copy className='mr-2 h-4 w-4' />
                                    Copy your Mainnet Swap referral link
                                </Button>
                        }
                    </div>
                );
            default:
                return cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell) : null;
        }
    };

    return (
        <div className='flex flex-col space-y-2'>
            <div className='rounded-md border dark:border-white'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
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
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {renderCellContent(cell.getContext(), row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
