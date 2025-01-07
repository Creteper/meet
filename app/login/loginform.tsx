import { cn } from "@/lib/utils"
import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast, useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { login } from "@/lib/ver-user"
import { LoginRequest } from "@/lib/types"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">){
    const { toast } = useToast()
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState<React.ReactNode>('登录')
    const loginBtnRef = useRef<HTMLButtonElement>(null);
    async function handleLogin () {
        if(userName != "" && password != "") {
            loginBtnRef.current?.setAttribute("disabled", "true")
            setIsLogin(<><Loader2 className="animate-spin" />登录中...</>)
            await login(userName, password).then((res: any) => {
                const msg = res.message;
                const token = res.token;
                if(msg === "Login success"){
                    toast({
                        title: "成功！",
                        description: "登录成功",
                        variant: "default"
                    })
                    // 设置登录token
                    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
                    function addCookie(name: string, value: string, expires: string) {
                        document.cookie = `${name}=${value}; path=/; expires=${expires};`
                    }
                    addCookie('MeetProUsertoken', token, expires)
                    window.location.href = "/"
                }

            })
            .catch(err => {
                const errRes = err.response.data
                console.log(errRes);
                if(errRes.error === "Invalid username") {
                    toast({
                        title: "错误！",
                        description: "用户名不存在",
                        variant: "destructive"
                    })
                } else if(errRes.error === "Invalid password"){
                    toast({
                        title: "错误！",
                        description: "密码错误",
                        variant: "destructive"
                    })
                }

                setIsLogin('登录')
                loginBtnRef.current?.removeAttribute("disabled")
            })
        } else {
            toast({
                title: "错误！",
                description: "请输入用户名和密码",
                variant: "destructive"
            })
        }
    }
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                <div className="p-6 md:p-8">
                    <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-2xl font-bold">欢迎回来</h1>
                        <p className="text-balance text-muted-foreground">
                        登录到 Meet Pro 账户
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">用户名</Label>
                        <Input
                        id="email"
                        type="text"
                        placeholder="用户名"
                        onChange={(e) => { setUserName(e.target.value) }}
                        required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                        <Label htmlFor="password">密码</Label>
                        </div>
                        <Input id="password" type="password" placeholder="密码" onChange={(e) => { setPassword(e.target.value) }} required />
                    </div>
                    <Button onClick={handleLogin} ref={loginBtnRef} className="w-full">
                        {isLogin}
                    </Button>
                    <div className="text-center text-sm">
                        没有账户？{" "}
                        <a href="/register" className="underline underline-offset-4">
                        注册
                        </a>
                    </div>
                    </div>
                </div>
                <div className="relative hidden bg-muted md:block">
                    <img
                    src="/images/background.jpg"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
                </CardContent>
            </Card>
        </div>
    )
}

