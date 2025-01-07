import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toast } from "@/components/ui/toast"
import { useState, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { postRequest } from "@/lib/ver-user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useRouter } from "next/navigation"


export function RegsterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [enterPassword, setEnterPassword] = useState("")
  const [email, setEmail] = useState("")
  const regBtn = useRef<HTMLButtonElement>(null);
  const [isReg, setIsReg] = useState<React.ReactNode>('注册')
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  async function register () {
    regBtn.current?.setAttribute('disabled', 'true');
    if(regBtn.current) {
      setIsReg(<><Loader2 className="animate-spin" />注册中...</>)
    }
    if(username != "" && email != "" && password != ""){
      if(password === enterPassword){
        try {
          // 发送验证码邮件
          const response = await postRequest('/send_verification_email', {email: email})
          console.log(response)
          setIsOpen(true)
          toast({
            title: "验证码已发送至您的邮箱",
            description: "请查收",
            duration: 5000,
          })
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
              title: "发送验证码失败",
              description: "请检查邮箱是否正确或等待60秒后重试",
              duration: 5000,
            })
        }
      }else{
        toast({title: "两次密码不一致", variant: "destructive"})
      }
    } else{
      toast({title: "请填写完整信息", variant: "destructive"})
    }

    
    setIsReg('注册')
    regBtn.current?.removeAttribute("disabled")
  }

  async function onInputSuc () {
    console.log(value)
    if(value.length > 5){
      const data = {
        username,
        password,
        email,
        code: value
      }
      try {
          // 发送注册请求
          const response : any = await postRequest('/register', data)
          
          if(response.error){
            if(response.error === "Username or email already exists") {
              toast({title: "注册失败",description:"用户名或邮箱已被注册", variant: "destructive"})
              setIsOpen(false)
            }else if (response.error === "Invalid code") {
              toast({title: "验证码错误",description:"请重新输入", variant: "destructive"})
            }
             else {
              toast({title: "注册失败",description:response.error, variant: "destructive"})
            }

          } else {
            toast({title: "注册成功",description:"请登录",})
            // 关闭验证码输入弹窗
            setIsOpen(false)
            router.push('/login')
            
          }

      } catch (error) {
          console.error('Error fetching data:', error);
          toast({title: "注册失败", variant: "destructive"})
      }
    }
    
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Dialog open={isOpen}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">欢迎加入</CardTitle>
            <CardDescription>
              注册 Meet Pro 账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="用户名"
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">密码</Label>
                    <Input id="password" type="password" placeholder="密码" onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="enter_password">确认密码</Label>
                    <Input id="enter_password" type="password" placeholder="确认密码" onChange={(e) => setEnterPassword(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="example@email.com"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="button" ref={regBtn} onClick={register} className="w-full">
                    { isReg }
                  </Button>
                </div>
                <div className="text-center text-sm">
                  已有账户？{" "}
                  <a href="/login" className="underline underline-offset-4">
                    登录
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>输入验证码</DialogTitle>
            <DialogDescription>
              验证码已发送到 {email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
          <div className="space-y-2">
            <InputOTP
              maxLength={6}
              value={value}
              onChange={(value) => setValue(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="text-center text-sm">
              {value === "" ? (
                <>Enter your one-time password.</>
              ) : (
                <>You entered: {value}</>
              )}
            </div>
          </div>
          </div>
          <DialogFooter>
            <Button className="float-right" onClick={onInputSuc}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}