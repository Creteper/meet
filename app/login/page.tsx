//app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './loginform';

import PageTransiton from '@/components/local/loadingSunner';
import { AnimatePresence } from 'framer-motion';
import { verToken } from '@/lib/ver-user';


export default function LoginLayOut () {
    const router = useRouter();
    // useEffect(function (){
    //     const verUser = async () => {
    //       verToken().then(() => {
    //         router.push('/')
    //       })
    //     }
    //     verUser()
    //   }, []); 
    return (
        <PageTransiton>
            <AnimatePresence>
                <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-sm md:max-w-3xl">
                        <LoginForm></LoginForm>
                    </div>
                </div>
            </AnimatePresence>
        </PageTransiton>
    )
}
