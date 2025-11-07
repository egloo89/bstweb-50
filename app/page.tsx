"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  Brain,
  ChevronRight,
  Code,
  Database,
  Eye,
  Github,
  Link2,
  Linkedin,
  Mail,
  Menu,
  MessageSquare,
  Palette,
  Rocket,
  Smartphone,
  Sparkles,
  Twitter,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import ShaderBackground from "@/components/ui/shader-background"

export default function Home() {
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heroRef = useRef(null)
  const processScrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  // Auto scroll for process section
  useEffect(() => {
    let animationFrameId: number | null = null
    let scrollTimeout: NodeJS.Timeout | null = null
    let initTimeout: NodeJS.Timeout | null = null
    let retryTimeout: NodeJS.Timeout | null = null
    let isInitialized = false
    let handleMouseEnter: (() => void) | null = null
    let handleMouseLeave: (() => void) | null = null
    let handleScroll: (() => void) | null = null
    let scrollContainer: HTMLDivElement | null = null

    // DOM이 완전히 로드될 때까지 대기
    const initAutoScroll = () => {
      scrollContainer = processScrollRef.current
      if (!scrollContainer) {
        // 컨테이너가 아직 준비되지 않았으면 재시도
        if (!isInitialized) {
          retryTimeout = setTimeout(initAutoScroll, 100)
        }
        return
      }

      // 스크롤 컨테이너의 크기가 제대로 계산될 때까지 대기
      if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) {
        if (!isInitialized) {
          retryTimeout = setTimeout(initAutoScroll, 100)
        }
        return
      }

      isInitialized = true

      let scrollPosition = 0
      const scrollSpeed = 0.24 // 스크롤 속도 (픽셀/프레임) - 글씨 읽을 수 있는 속도
      let isPaused = false
      let userScrolling = false

      handleMouseEnter = () => { 
        isPaused = true 
      }
      
      handleMouseLeave = () => { 
        isPaused = false 
      }

      handleScroll = () => {
        if (scrollContainer) {
          scrollPosition = scrollContainer.scrollLeft
          userScrolling = true
          
          if (scrollTimeout) {
            clearTimeout(scrollTimeout)
          }
          
          scrollTimeout = setTimeout(() => {
            userScrolling = false
          }, 2000)
        }
      }

      if (handleMouseEnter && handleMouseLeave && handleScroll) {
        scrollContainer.addEventListener('mouseenter', handleMouseEnter)
        scrollContainer.addEventListener('mouseleave', handleMouseLeave)
        scrollContainer.addEventListener('scroll', handleScroll)
      }

      const autoScroll = () => {
        if (!isPaused && !userScrolling && scrollContainer) {
          scrollPosition += scrollSpeed
          const singleSetWidth = scrollContainer.scrollWidth / 2 // 원본 카드 세트의 너비
          
          // 첫 번째 세트의 끝에 도달하면 처음으로 부드럽게 이동
          if (scrollPosition >= singleSetWidth) {
            scrollPosition = scrollPosition - singleSetWidth
          }
          
          scrollContainer.scrollLeft = scrollPosition
        }
        animationFrameId = requestAnimationFrame(autoScroll)
      }

      // 초기화: 약간의 지연 후 시작
      initTimeout = setTimeout(() => {
        animationFrameId = requestAnimationFrame(autoScroll)
      }, 500)
    }

    // 페이지 로드 완료 후 초기화
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        initAutoScroll()
      } else {
        window.addEventListener('load', initAutoScroll)
      }
    }

    // Cleanup 함수
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', initAutoScroll)
      }
      if (scrollContainer && handleMouseEnter && handleMouseLeave && handleScroll) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter)
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave)
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !message || !name) {
      toast({
        title: "정보 누락",
        description: "모든 필수 항목을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "유효하지 않은 이메일",
        description: "올바른 이메일 주소를 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "메시지 전송 완료!",
      description: "곧 연락드리겠습니다.",
    })

    setEmail("")
    setMessage("")
    setName("")
    setIsSubmitting(false)
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (mobileMenuOpen && !target.closest(".mobile-menu") && !target.closest(".menu-button")) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [mobileMenuOpen])

  const services = [
    {
      icon: <Code className="h-10 w-10" />,
      title: "웹 개발",
      description: "모던 UI/UX 구현된 온라인 쇼핑몰",
    },
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: "UI/UX 디자인",
      description: "데이터 시각화와 사용자 경험을 중점적으로 관리하는 플랫폼",
    },
    {
      icon: <Palette className="h-10 w-10" />,
      title: "브랜딩",
      description: "기업의 새로운 정체성을 담은 브랜드 시스템",
    },
    {
      icon: <Smartphone className="h-10 w-10" />,
      title: "앱 개발",
      description: "사용자 중심의 직관적인 모바일 앱",
    },
    {
      icon: <Database className="h-10 w-10" />,
      title: "웹 포트폴리오",
      description: "창의적이고 인터랙티브한 게인 포트폴리오",
    },
    {
      icon: <Eye className="h-10 w-10" />,
      title: "컴퓨터 비전",
      description: "이미지와 비디오 데이터를 분석하여 가치 있는 정보를 제공합니다.",
    },
  ]

  const teamMembers = [
    {
      name: "서배준",
      role: "CEO, Creative Director (크리에이티브 디렉터)",
      bio: "브랜드 톤 & 전체 디자인 방향 총괄",
    },
    {
      name: "박건휘",
      role: "Product Manager (프로덕트 매니저 / PM)",
      bio: "프로젝트 일정·요구사항·소통",
    },
    {
      name: "김하은",
      role: "UI/UX Designer (UI/UX 디자이너)",
      bio: "사용자 경험 설계 & 화면 구성 디자인",
    },
    {
      name: "성민성",
      role: "Frontend Developer (프론트엔드 개발자)",
      bio: "인터랙션·웹 애니메이션·UI 구현",
    },
    {
      name: "양민아",
      role: "Backend Developer (백엔드 개발자)",
      bio: "서버·DB·API·관리 시스템 구축",
    },
  ]

  const processSteps = [
    {
      number: "01",
      title: "탐색 (Discovery)",
      description: "귀사의 비즈니스, 고객, 경쟁 환경을 분석하여 웹에서 해결해야 할 핵심 목표와 문제를 명확히 합니다.",
    },
    {
      number: "02",
      title: "전략 수립 (Strategy)",
      description:
        "목표 달성을 위한 정보 구조, 페이지 플로우, 전환 동선을 설계하고 브랜드 톤과 방향성을 담은 웹 전략 로드맵을 만듭니다.",
    },
    {
      number: "03",
      title: "디자인 (Design)",
      description:
        "UI/UX 원칙과 브랜드 아이덴티티를 반영하여 사용자가 머무르고 행동하도록 하는 인터페이스를 디자인합니다.",
    },
    {
      number: "04",
      title: "개발 (Development)",
      description:
        "최신 웹 기술 스택으로 빠르고 안정적인 웹 구조를 구축합니다. 프론트엔드, 백엔드, 관리 시스템까지 완성형으로 구현합니다.",
    },
    {
      number: "05",
      title: "런칭 & 배포 (Launch)",
      description: "테스트와 품질 검수를 통해 완성도를 검증하고 웹사이트를 라이브 환경에 안정적으로 배포합니다.",
    },
    {
      number: "06",
      title: "성장 최적화 (Growth)",
      description: "데이터 기반으로 전환율, 체류시간, 유입 성과를 분석하여 지속적인 업데이트·확장·개선을 제공합니다.",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400">
                부스트웹
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-sm hover:text-purple-400 transition-colors">
                서비스
              </a>
              <a href="#about" className="text-sm hover:text-purple-400 transition-colors">
                소개
              </a>
              <a href="#team" className="text-sm hover:text-purple-400 transition-colors">
                팀
              </a>
              <a href="#process" className="text-sm hover:text-purple-400 transition-colors">
                프로세스
              </a>
              <a href="#contact" className="text-sm hover:text-purple-400 transition-colors">
                문의
              </a>
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white">
                시작하기
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-20 mobile-menu">
          <nav className="flex flex-col items-center space-y-6 p-8">
            <a
              href="#services"
              className="text-lg hover:text-purple-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              서비스
            </a>
            <a
              href="#about"
              className="text-lg hover:text-purple-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              소개
            </a>
            <a
              href="#team"
              className="text-lg hover:text-purple-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              팀
            </a>
            <a
              href="#process"
              className="text-lg hover:text-purple-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              프로세스
            </a>
            <a
              href="#contact"
              className="text-lg hover:text-purple-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              문의
            </a>
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white w-full mt-4">
              시작하기
            </Button>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Shader Background */}
        <div className="absolute inset-0 z-0">
          <ShaderBackground position="absolute" />
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 z-[1]">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-black"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <motion.div style={{ opacity, scale }} className="container mx-auto px-4 z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="block">웹은 곧</span>
              <span className="block">비즈니스의 얼굴입니다.</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400">
                성장하는 웹, 부스트웹  
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto">
              우리는 단순한 디자인이 아닌 고객이 머무르고 행동하는 웹을 만듭니다.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-8 py-6 text-lg h-auto">
                서비스 살펴보기
              </Button>
              <Button
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-white px-8 py-6 text-lg h-auto bg-transparent"
              >
                더 알아보기
              </Button>
            </div>

            <div className="mt-16 flex justify-center">
              <div className="animate-bounce">
                <ChevronRight className="h-8 w-8 rotate-90 text-white/50" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">우리의 서비스</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              귀사의 가장 복잡한 비즈니스 과제를 해결하기 위한 종합적인 AI 솔루션.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-800/50 border border-white/10 p-8 rounded-xl hover:bg-zinc-800/80 transition-colors"
              >
                <div className="text-purple-500 mb-6">{service.icon}</div>
                <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-400">{service.description}</p>
                <div className="mt-6">
                  <a href="#contact" className="inline-flex items-center text-purple-400 hover:text-purple-300">
                    더 알아보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-8">
              모든 서비스 보기
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-purple-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">부스트웹을 선택하는 이유</h2>
              <p className="text-xl text-gray-300 mb-8">
                깊이 있는 기획력과 실전형 디자인, 그리고 사용자 행동을 기반으로 매출과 성장을 만드는 웹 제작 솔루션을
                제공합니다.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full h-fit">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">전략에 기반한 설계</h3>
                    <p className="text-gray-400">
                      우리는 단순히 예쁜 화면을 만드는 것이 아니라 고객이 실제로 행동하고 전환하도록 설계된 구조를
                      만듭니다. 브랜드·시장·사용자 분석을 기반으로 성공 가능한 웹 전략을 제시합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-cyan-500/20 p-3 rounded-full h-fit">
                    <Code className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">맞춤형 UI/UX 제작</h3>
                    <p className="text-gray-400">
                      모든 비즈니스는 다르기에, 우리도 정해진 템플릿을 사용하지 않습니다. 쇼핑몰, SaaS 대시보드,
                      포트폴리오, 앱까지 목적과 산업에 맞춘 인터페이스 경험을 디자인합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full h-fit">
                    <Database className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">성장으로 이어지는 결과</h3>
                    <p className="text-gray-400">
                      웹은 한 번 만들고 끝나는 것이 아닙니다. 우리는 제작 이후에도 유지·운영·전환 개선 패널티 관리를
                      지원하며 매출 상승과 브랜드 신뢰도의 지속 성장을 목표로 합니다.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-1">
                <div className="w-full h-full rounded-xl bg-zinc-900 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Rocket className="h-24 w-24 mx-auto mb-6 text-purple-500" />
                    <h3 className="text-2xl font-bold mb-4">우리의 미션</h3>
                    <p className="text-gray-400">
                      브랜드 전략, 디자인, 기술을 하나로 연결하여<br />
                      비즈니스를 성장시키는 웹 경험을 제공합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-2/3 aspect-square rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-1 z-[-1]">
                <div className="w-full h-full rounded-xl bg-zinc-900"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">팀을 만나보세요</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              부스트웹 크리에이티브 팀이 깊이 있는 분석과 디테일한 완성도로 브랜드의 가치를 한 단계 끌어올립니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => {
              const roleMatch = member.role.match(/^(.+?)\s*\((.+?)\)$/);
              const roleEnglish = roleMatch ? roleMatch[1] : member.role;
              const roleKorean = roleMatch ? roleMatch[2] : '';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { duration: 0.15, ease: "easeOut" }
                  }}
                  className="group relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10 p-8 rounded-2xl hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 p-[2px] group-hover:from-purple-500/50 group-hover:to-cyan-500/50 transition-all duration-300">
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-center text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                      {member.name}
                    </h3>
                    
                    <div className="mb-4 text-center">
                      <p className="text-purple-400 font-semibold text-base mb-1">{roleEnglish}</p>
                      {roleKorean && (
                        <p className="text-white text-sm font-medium">({roleKorean})</p>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-center text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">우리의 프로세스</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              실제 성과로 연결되는 웹 제작을 위한 체계적인 워크플로우
            </p>
          </div>

          <div 
            ref={processScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 pt-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* 원본 카드들 */}
            {processSteps.map((step, index) => (
              <motion.div
                key={`original-${index}`}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-[320px] md:w-[380px] bg-zinc-900/50 border border-white/10 p-8 rounded-xl relative mt-8"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-black font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-4 mt-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
            {/* 복제된 카드들 (무한 루프용) */}
            {processSteps.map((step, index) => (
              <motion.div
                key={`duplicate-${index}`}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-[320px] md:w-[380px] bg-zinc-900/50 border border-white/10 p-8 rounded-xl relative mt-8"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-black font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-4 mt-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">함께 성장할 준비가 되셨나요?</h2>
              <p className="text-xl text-gray-300 mb-8">
                {"목표에 맞는 웹 전략과 디자인으로\n당신의 비즈니스를 더욱 확장시켜드립니다."}
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <a href="mailto:info@boostweb.ai" className="text-gray-300 hover:text-purple-400 transition-colors">
                    info@boostweb.ai
                  </a>
                </div>


                <div className="flex gap-4 mt-8">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="#"
                          className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-full transition-colors"
                          aria-label="Twitter"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>트위터</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="#"
                          className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-full transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>링크드인</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="#"
                          className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-full transition-colors"
                          aria-label="GitHub"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>깃허브</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-white/10 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-6">메시지 보내기</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      이름
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="이름을 입력해주세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      이메일
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="이메일@예시.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      메시지
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 min-h-[120px]"
                      placeholder="프로젝트에 대해 알려주세요..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white",
                      isSubmitting && "opacity-70 cursor-not-allowed",
                    )}
                  >
                    {isSubmitting ? "전송 중..." : "메시지 전송"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400">
                  부스트웹
                </span>
              </div>
              <p className="text-gray-400 mb-6 tracking-wide">{"비즈니스 목표, 시장, 브랜드 방향을 바탕으로\n가장 적합한 웹 구축 방법을 제안드립니다."}</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">서비스</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    웹 개발
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    UI/UX 디자인
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    브랜딩
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    앱 개발
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    웹 포트폴리오
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    컴퓨터 비전
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">회사</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-purple-400 transition-colors">
                    회사 소개
                  </a>
                </li>
                <li>
                  <a href="#team" className="text-gray-400 hover:text-purple-400 transition-colors">
                    팀
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    채용 공고
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    블로그
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                    개인정보 보호 정책
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">연락처</h4>
              <ul className="space-y-3">
                <li className="text-gray-400">
                  <Mail className="h-4 w-4 inline-block mr-2" />
                  <a href="mailto:info@boostweb.ai" className="hover:text-purple-400 transition-colors">
                    info@boostweb.ai
                  </a>
                </li>
                <li className="text-gray-400">
                  <Sparkles className="h-4 w-4 inline-block mr-2" />
                  서울
                </li>
                <li className="text-gray-400">
                  <Sparkles className="h-4 w-4 inline-block mr-2" />
                  부산
                </li>
                <li className="text-gray-400">
                  <Sparkles className="h-4 w-4 inline-block mr-2" />
                  대구
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} 부스트웹. 모든 권리 보유.</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
