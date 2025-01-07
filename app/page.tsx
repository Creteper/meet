'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteCookie, getCookie, verToken, getUserInfo, postRequest, getRequest } from '@/lib/ver-user';
import PageTransiton from '@/components/local/loadingSunner';
import { AnimatePresence } from 'framer-motion';
import { ChevronUp, CirclePlus, GitPullRequestCreate, User2, Mail, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toast } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useRef } from 'react';
// 修改导入，从正确的类型定义文件导入
import { UserInfo } from '@/lib/types'  // 不要从 livekit 导入
function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const searchParams = useSearchParams();
  const Type = searchParams.get('type');
  const [isJoin, setIsJoin] = useState<React.ReactNode>('创建会议');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if(Type === 'join'){
      setIsJoin('加入会议')
    }else{
      setIsJoin('创建会议')
    }
  }, [Type]);

  // 添加输入验证函数
  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许输入数字，且最多8位
    if (/^\d{0,8}$/.test(value)) {
      setRoomName(value);
    }
  };

  const startMeeting = () => {
    buttonRef.current?.setAttribute('disabled', 'true');
    if(roomName === ""){
      toast({
        title: '请输入会议号',
        variant: 'destructive',
      })
      buttonRef.current?.removeAttribute('disabled');
      return 
    } 
    // 验证输入是否为纯数字且长度不超过8位
    if(!/^\d{8}$/.test(roomName)) {
      toast({
        title: '会议号必须为8位数字',
        variant: 'destructive',
      })
      buttonRef.current?.removeAttribute('disabled');
      return
    }
    if(Type === 'join'){
      // 存储加入会议的标识
      sessionStorage.setItem('meetingType', 'join');
      fetch(`/api/getroomlist`)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          if(data.find((item: any) => item.name === roomName)){
            router.push(`/rooms/${roomName}`);
          }else{
            toast({
              title: '会议号不存在',
              variant: 'destructive',
            })
            buttonRef.current?.removeAttribute('disabled');
          }
        })
        .catch(error => {
          toast({
            title: '未知错误',
            description: error.message,
            variant: 'destructive',
          })
          buttonRef.current?.removeAttribute('disabled');
        });
      // router.push(`/rooms/${roomName}`);
    } else {
      // 存储创建会议的标识
      sessionStorage.setItem('meetingType', 'create');
      fetch(`/api/getroomlist`)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          if(data.find((item: any) => item.name === roomName)){
            toast({
              title: '会议号已存在',
              variant: 'destructive',
            })
            buttonRef.current?.removeAttribute('disabled');
          }else{
            router.push(`/rooms/${roomName}`);
          }
        })
        .catch(error => {
          toast({
            title: '未知错误',
            description: error.message,
            variant: 'destructive',
          })
          buttonRef.current?.removeAttribute('disabled');
        });
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{isJoin}</CardTitle>
        <CardDescription>输入你的会议号在这里</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">会议号</Label>
              <Input 
                id='name' 
                placeholder='请输入8位数字会议号' 
                value={roomName}
                onChange={handleRoomNameChange}
                maxLength={8}
                type="text"
                pattern="\d*"
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="float-right">
        <Button ref={buttonRef} onClick={startMeeting}>
          开始
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Page() {
  const router = useRouter();
  // 修改状态定义，添加初始值
  const [userInfo, setUserInfo] = useState<any>({
    user: {
      username: '',
      email: '',
      create_at: '',
      id: 0,
      done: 0,
      token: ''
    }
  });
  useEffect(function (){
    const verUser = async () => {
      verToken().then(() => {
        getUser()
      })
      .catch(err => {
        router.push('/login')
      }) 
    }
    const getUser = async () => {
      await getUserInfo().then(res => {
        setUserInfo(res)
      })
    }
    verUser()
  }, []); 
  const quitLogin = async () => {
    await deleteCookie('MeetProUsertoken')
    router.push('/login')
  }
  return (
    <>
    <PageTransiton>
      <AnimatePresence>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center ml-4 mt-4 gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <img src="/images/favicon_w.svg" alt="" />
                </div>
                <h1 className="text-xl font-bold">Meet Pro</h1>
              </div>
            </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>会议</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild> 
                          <a href="/">
                            <CirclePlus />
                            <span>创建会议</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild> 
                          <a href="?type=join">
                            <GitPullRequestCreate />
                            <span>加入会议</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className='h-16 flex items-center gap-2'>
                          {userInfo.user.username ? (
                            <>
                              <div className='gap-2 bg-blue-600 p-2 h-8 w-8 rounded-md flex justify-center items-center font-bold text-lg'>
                                <p className='text-white'>{userInfo.user.username.charAt(0)}</p>
                              </div>
                              <div>
                                <p className='font-bold text-sm'>{userInfo.user.username}</p>
                                <p className='text-xs text-gray-500'>{userInfo.user.email}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Skeleton className="h-8 w-8 rounded-md" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-3 w-[140px]" />
                              </div>
                            </>
                          )}
                          <ChevronUp className="ml-auto" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        className="w-[--radix-popper-anchor-width]"
                      >
                        <DropdownMenuLabel>
                          <p className='text-sm text-gray-500'>个人中心</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userInfo.user.username ? (
                          <>
                            <DropdownMenuLabel>
                              <p className='text-sm font-normal flex items-center gap-2'>
                                <User2 size={20} />{userInfo.user.username}
                              </p>
                            </DropdownMenuLabel>
                            <DropdownMenuLabel>
                              <p className='text-sm font-normal flex items-center gap-2'>
                                <Mail size={20} />{userInfo.user.email}
                              </p>
                            </DropdownMenuLabel>
                            <DropdownMenuLabel>
                              <p className='text-sm font-normal flex items-center gap-2'>
                                <Calendar size={20} />{userInfo.user.create_at}
                              </p>
                            </DropdownMenuLabel>
                          </>
                        ) : (
                          <>
                            <DropdownMenuLabel>
                              <Skeleton className="h-5 w-full" />
                            </DropdownMenuLabel>
                            <DropdownMenuLabel>
                              <Skeleton className="h-5 w-full" />
                            </DropdownMenuLabel>
                            <DropdownMenuLabel>
                              <Skeleton className="h-5 w-full" />
                            </DropdownMenuLabel>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={quitLogin}>
                          <span className='text-red-500'>退出登录</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
          </Sidebar>
          <main className="bg-background w-full">

          <div className='w-full h-full flex items-center justify-center'>
            <Suspense fallback="Loading">
              <DemoMeetingTab label="Demo" />
            </Suspense>
          </div>
        </main>
        </SidebarProvider>
        
      </AnimatePresence>
    </PageTransiton>

    </>
  );
}
