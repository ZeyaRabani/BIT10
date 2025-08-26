import React from 'react'
import LendingActivity from './manage_lending_and_borrowing/lendingActivity'
import BorrowingActivity from './manage_lending_and_borrowing/borrowingActivity'

export default function ICPLendingAndBorrowing() {
    return (
        <div className='flex flex-col space-y-4'>
            <LendingActivity />
            <BorrowingActivity />
        </div>
    )
}
