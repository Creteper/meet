'use client';

import { GalleryVerticalEnd } from "lucide-react"
import { RegsterForm } from './registerform'
import PageTransiton from '@/components/local/loadingSunner';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { verToken } from '@/lib/ver-user';


export default function RegsterPage() {
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
            <AnimatePresence mode="wait">
                <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
                    <div className="flex w-full max-w-sm flex-col gap-6">
                        <a href="#" className="flex items-center gap-2 self-center font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <img src="/images/favicon_w.svg" alt="" />
                        </div>
                        Meet Pro
                        </a>
                        <RegsterForm />
                    </div>
                </div>
            </AnimatePresence>
        </PageTransiton>

    )
}