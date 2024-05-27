"use client"
import { useEffect, useState } from 'react';
import { getUserSignUpList } from '@/lib/supabaseRequests';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface User {
    newsletter_subscribers_id: number;
    email: string;
}

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await getUserSignUpList();
                // @ts-ignore
                setUsers(userData);
            } catch (error) {
                console.error('Error fetching user signups:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className='py-8'>
            <h1 className='text-center text-2xl font-semibold'>User Signups</h1>

            <div className='rounded-md border my-6'>
                <Table>
                    <TableCaption className='border-t-2 py-2'>A list of user Sign-Ups. It can take some time to load all user info</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='text-center'>ID</TableHead>
                            <TableHead className='text-center'>E-mail</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.newsletter_subscribers_id}>
                                <TableCell>{user.newsletter_subscribers_id}</TableCell>
                                <TableCell>{user.email}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UsersPage;