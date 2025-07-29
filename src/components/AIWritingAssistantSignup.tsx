'use client';

import React, { useState, useRef, useEffect, memo, ReactNode, ChangeEvent, FormEvent, forwardRef } from 'react';
import { motion, useAnimation, useInView, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Chrome, Github, User, Check, X } from 'lucide-react';
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

// ==================== Password Strength Indicator ====================

const PasswordStrengthIndicator = memo(function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { regex: /.{8,}/, text: '최소 8자 이상' },
    { regex: /[a-z]/, text: '소문자 포함' },
    { regex: /\d/, text: '숫자 포함' },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: '특수문자 포함' },
  ];

  const getStrength = () => {
    const metRequirements = requirements.filter(req => req.regex.test(password)).length;
    if (metRequirements === 0) return { level: 0, text: '' };
    if (metRequirements <= 1) return { level: 1, text: '약함' };
    if (metRequirements <= 2) return { level: 2, text: '보통' };
    if (metRequirements <= 3) return { level: 3, text: '강함' };
    return { level: 4, text: '매우 강함' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              strength.level === 1 && "w-1/4 bg-red-500",
              strength.level === 2 && "w-2/4 bg-orange-500",
              strength.level === 3 && "w-3/4 bg-yellow-500",
              strength.level === 4 && "w-full bg-green-500",
            )}
          />
        </div>
        <span className={cn(
          "text-xs font-medium",
          strength.level === 1 && "text-red-500",
          strength.level === 2 && "text-orange-500",
          strength.level === 3 && "text-yellow-600",
          strength.level === 4 && "text-green-500",
        )}>
          {strength.text}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-1">
            {req.regex.test(password) ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-gray-400" />
            )}
            <span className={req.regex.test(password) ? 'text-green-600' : 'text-gray-500'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ==================== Main Signup Component ====================

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const AIWritingAssistantSignup = memo(function AIWritingAssistantSignup() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다';
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 주소를 입력해주세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호를 확인해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SignupFormData) => (
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

    if (!acceptTerms) {
      alert('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 회원가입 API 호출
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '회원가입 중 오류가 발생했습니다.');
        return;
      }

      const loginRes = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.ok) {
        window.location.href = '/editor';
      } else {
        alert('로그인 실패. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    signIn(provider, { callbackUrl: '/editor' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
            <h1 className="text-3xl font-bold text-foreground">계정 만들기</h1>
          </BoxReveal>
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
            <p className="text-muted-foreground">
              <span className='font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>FROM</span><span>과 함께 글쓰기 여정을 시작하세요</span>
            </p>
          </BoxReveal>
        </div>

        {/* Social Signup */}
        <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialSignup('google')}
              className="flex items-center justify-center gap-2 h-12 px-4 border border-border rounded-lg bg-background hover:bg-accent transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignup('github')}
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
                또는 이메일로 가입하기
              </span>
            </div>
          </div>
        </BoxReveal>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
              <Label htmlFor="name">이름</Label>
            </BoxReveal>
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </BoxReveal>
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
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
              <PasswordStrengthIndicator password={formData.password} />
            </BoxReveal>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            </BoxReveal>
            <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </BoxReveal>
          </div>

          {/* Terms and Conditions */}
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 rounded border-border mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                <Link href="/terms" className="text-primary hover:underline">이용약관</Link>과{' '}
                <Link href="/terms" className="text-primary hover:underline">개인정보처리방침</Link>에 동의합니다.
              </Label>
            </div>
          </BoxReveal>

          {/* Submit Button */}
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} width="100%">
            <button
              type="submit"
              disabled={isLoading || !acceptTerms}
              className="group/btn relative w-full h-12 bg-gradient-to-br from-zinc-900 to-zinc-900 dark:from-zinc-100 dark:to-zinc-100 text-white dark:text-black rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  계정 생성 중...
                </div>
              ) : (
                '계정 만들기'
              )}
              <BottomGradient />
            </button>
          </BoxReveal>
        </form>

        <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </BoxReveal>
      </div>
    </div>
  );
});

export default AIWritingAssistantSignup;