'use client';

import React, { useState, useRef, useEffect, memo, ReactNode, ChangeEvent, FormEvent, forwardRef } from 'react';
import { motion, useAnimation, useInView, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Chrome, Github, Sparkles, PenTool, MessageSquare, Zap } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ==================== Input Component ====================

const Input = memo(
  forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className, type, ...props }, ref) {
      const radius = 100;
      const [visible, setVisible] = useState(false);

      const mouseX = useMotionValue(0);
      const mouseY = useMotionValue(0);

      function handleMouseMove({
        currentTarget,
        clientX,
        clientY,
      }: React.MouseEvent<HTMLDivElement>) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }

      return (
        <motion.div
          style={{
            background: useMotionTemplate`
              radial-gradient(
                ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
                #3b82f6,
                transparent 80%
              )
            `,
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          className='group/input rounded-lg p-[2px] transition duration-300'
        >
          <input
            type={type}
            className={cn(
              `shadow-input dark:placeholder-text-neutral-600 flex h-12 w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600`,
              className
            )}
            ref={ref}
            {...props}
          />
        </motion.div>
      );
    }
  )
);

// ==================== BoxReveal Component ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as 'relative' | 'absolute' | 'fixed' | 'sticky' | 'static',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial='hidden'
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#5046e6',
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Label Component ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground',
        className
      )}
      {...props}
    />
  );
});

// ==================== BottomGradient Component ====================

const BottomGradient = () => {
  return (
    <>
      <span className='group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent' />
      <span className='group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent' />
    </>
  );
};

// ==================== OrbitingCircles Component ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          version='1.1'
          className='pointer-events-none absolute inset-0 size-full'
        >
          <circle
            className='stroke-black/10 stroke-1 dark:stroke-white/10'
            cx='50%'
            cy='50%'
            r={radius}
            fill='none'
          />
        </svg>
      )}
      <section
        style={
          {
            '--duration': duration,
            '--radius': radius,
            '--delay': -delay,
          } as React.CSSProperties
        }
        className={cn(
          'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-black/10 [animation-delay:calc(var(--delay)*1000ms)] dark:bg-white/10',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        {children}
      </section>
    </>
  );
});

// ==================== Main Login Component ====================

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

const AIWritingAssistantLogin = memo(function AIWritingAssistantLogin() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.ok) {
        window.location.href = '/editor'; // 로그인 성공 시 이동
      } else {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding & Animation */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8 p-8">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />

            <div className="relative flex items-center justify-center w-full h-full">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  FROM
                </div>
                <p className="text-lg text-muted-foreground">
                  마음을 전하는 AI 글쓰기 도우미
                </p>
              </div>

              <OrbitingCircles
                className="size-[50px] border-none bg-transparent"
                duration={15}
                delay={10}
                radius={180}
                path={false}
              >
                <PenTool className="w-6 h-6 text-purple-500" />
              </OrbitingCircles>

              <OrbitingCircles
                className="size-[50px] border-none bg-transparent"
                duration={20}
                delay={0}
                radius={140}
                path={false}
              >
                <Sparkles className="w-6 h-6 text-blue-500" />
              </OrbitingCircles>

            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              완벽한 메시지를 작성하세요
            </h2>
            <p className="text-muted-foreground max-w-md">
              프롬의 AI가 감정과 상황을 이해하여 상대방의 마음에 전달되는
              편지, 이메일, 메시지 작성을 도와드립니다.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
              <h1 className="text-3xl font-bold text-foreground">다시 오신 것을 환영합니다</h1>
            </BoxReveal>
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
              <p className="text-muted-foreground">
                글쓰기 여정을 계속하려면 로그인하세요
              </p>
            </BoxReveal>
          </div>

          {/* Social Login */}
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center gap-2 h-12 px-4 border border-border rounded-lg bg-background hover:bg-accent transition-colors"
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin('GitHub')}
                className="flex items-center justify-center gap-2 h-12 px-4 border border-border rounded-lg bg-background hover:bg-accent transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub</span>
              </button>
            </div>
          </BoxReveal>

          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는 이메일로 계속하기
                </span>
              </div>
            </div>
          </BoxReveal>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <Label htmlFor="email">이메일 주소</Label>
              </BoxReveal>
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </BoxReveal>
            </div>

            <div className="space-y-2">
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <Label htmlFor="password">비밀번호</Label>
              </BoxReveal>
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </BoxReveal>
            </div>

            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="remember" className="text-sm">
                    로그인 상태 유지
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </BoxReveal>

            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
              <button
                type="submit"
                disabled={isLoading}
                className="group/btn relative w-full h-12 bg-gradient-to-br from-zinc-900 to-zinc-900 dark:from-zinc-100 dark:to-zinc-100 text-white dark:text-black rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    로그인 중...
                  </div>
                ) : (
                  '로그인'
                )}
                <BottomGradient />
              </button>
            </BoxReveal>
          </form>

          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
            <p className="text-center text-sm text-muted-foreground">
              Dont have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                회원가입하기
              </Link>
            </p>
          </BoxReveal>
        </div>
      </div>
    </div>
  );
});

export default AIWritingAssistantLogin;