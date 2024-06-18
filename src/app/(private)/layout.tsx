"use client"

import React, { useState } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const funnyIncorrectPasswords = [
    'ineedapassword',
    'iamforgetful',
    'letmein',
    'qwerty',
    'whydoialwaysforget',
    'iamnottellingyoumypw',
    'earlyalzheimers',
    'memorysucks'
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [password, setPassword] = useState('');
    const [showContent, setShowContent] = useState(false);
    const [incorrectPassword, setIncorrectPassword] = useState(false);
    const [selectedFunnyPassword, setSelectedFunnyPassword] = useState<string | null>(null);

    const correctPassword = 'cghvjhblkndgcjhdfkghioudfh2863487yhiruodfhu';

    const handlePasswordChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setPassword(event.target.value);
        setIncorrectPassword(false);
    };

    const handlePasswordSubmit = () => {
        if (password === correctPassword) {
            setShowContent(true);
        } else {
            setIncorrectPassword(true);
            const randomIndex = Math.floor(Math.random() * funnyIncorrectPasswords.length);
            setSelectedFunnyPassword(funnyIncorrectPasswords[randomIndex]);
        }
    };

    return (
        <MaxWidthWrapper>
            {showContent ? (
                <main>
                    {children}
                </main>
            ) : (
                <div className='flex justify-center items-center py-[25vh]'>
                    <Card className='max-w-[95vw]'>
                        <CardHeader>
                            <CardTitle>Enter Password for Authorized Access</CardTitle>
                            <CardDescription>To access this restricted area, please enter the correct password below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className='grid w-full items-center gap-4'>
                                    <div className='flex flex-col space-y-1.5'>
                                        <Label htmlFor='pass'>Password</Label>
                                        <Input id='pass' placeholder='Password' type='password' value={password} onChange={handlePasswordChange} />
                                        {incorrectPassword && (
                                            <p className='text-destructive mb-2'>
                                                {selectedFunnyPassword
                                                    ? `Oops! That's not quite right. How about trying '${selectedFunnyPassword}'?`
                                                    : 'Incorrect password'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button className='text-white w-full' onClick={handlePasswordSubmit}>Submit</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </MaxWidthWrapper>
    )
}
