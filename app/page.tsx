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
import dynamic from "next/dynamic"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const ProcessAutoScroll = dynamic(
  () => import("@/components/process-auto-scroll").then((mod) => mod.ProcessAutoScroll),
  { ssr: false }
)

export default function Home() {
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !phone || !name) {
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

    if (!/^[0-9-+\s()]+$/.test(phone) || phone.replace(/[^0-9]/g, "").length < 10) {
      toast({
        title: "유효하지 않은 전화번호",
        description: "올바른 전화번호를 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if db is initialized
      if (!db) {
        throw new Error("Firebase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.")
      }

      console.log("=== Firestore Save Attempt ===")
      console.log("Database:", db)
      console.log("Collection: contacts")
      console.log("Data:", { name, email, phone })

      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "contacts"), {
        name: name,
        email: email,
        phone: phone,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      })
      
      console.log("✅ Successfully saved to Firestore!")
      console.log("Document ID:", docRef.id)

      toast({
        title: "메시지 전송 완료!",
        description: "곧 연락드리겠습니다.",
      })

      setEmail("")
      setPhone("")
      setName("")
    } catch (error: any) {
      console.error("❌ Error saving contact:", error)
      console.error("Error code:", error?.code)
      console.error("Error message:", error?.message)
      console.error("Full error:", error)
      
      let errorMessage = "오류가 발생했습니다. 다시 시도해주세요."
      
      if (error?.code === "permission-denied") {
        errorMessage = "Firestore 보안 규칙 오류입니다. 규칙 탭에서 'allow create: if true'를 확인해주세요."
      } else if (error?.code === "unavailable" || error?.code === "deadline-exceeded") {
        errorMessage = "Firestore 연결 실패. 데이터베이스가 생성되었는지 확인해주세요."
      } else if (error?.code === "failed-precondition") {
        errorMessage = "Firestore 데이터베이스가 생성되지 않았습니다."
      } else if (error?.code === "invalid-argument") {
        errorMessage = "잘못된 데이터 형식입니다."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "전송 실패",
        description: errorMessage + " (콘솔에서 자세한 오류 확인 가능)",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
      icon: <Smartphone className="h-10 w-10" />,
      title: "반응형 웹사이트 제작 &\nSEO 최적화 설계",
      description: "고퀄리티 반응형 웹사이트와 검색엔진 최적화를 통한 노출 극대화",
    },
    {
      icon: <Brain className="h-10 w-10" />,
      title: "AI 챗봇 기능 추가",
      description: "24시간 고객 상담이 가능한 AI 챗봇으로 고객 만족도와 전환율 향상",
    },
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: "3D 인터랙티브 효과 적용",
      description: "차별화된 3D 인터랙티브 효과로 사용자의 시선을 사로잡는 몰입형 경험 제공",
    },
    {
      icon: <Database className="h-10 w-10" />,
      title: "관리자 페이지 기능\n10종 추가",
      description: "콘텐츠 관리, 주문 관리, 회원 관리 등 비즈니스 운영에 필요한 다양한 관리 기능 제공",
    },
    {
      icon: <Rocket className="h-10 w-10" />,
      title: "홈페이지 제작부터\n마케팅까지 원스톱",
      description: "웹사이트 제작부터 디지털 마케팅 전략 수립 및 실행까지 통합 솔루션 제공",
    },
    {
      icon: <Code className="h-10 w-10" />,
      title: "AI 자동화 프로그램\n1개월 무료 이용권 제공",
      description: "블로그 자동 포스팅, 서이추 프로그램 등 AI 기반 자동화 도구를 1개월 무료로 체험",
    },
    {
      icon: <Link2 className="h-10 w-10" />,
      title: "중국 왕홍들을 통한\n샤오홍슈 체험단 운영",
      description: "중국 왕홍 (인플루언서) 마케팅\n샤오홍슈 체험단 컨텐츠 업로드\n(자영업, 제품, 브랜드 등)\n샤오홍슈 계정 운영 대행\n따종디엔핑 무료 등록\n따종디엔핑 평점 리뷰 무료 등록 & 관리",
    },
    {
      icon: <Palette className="h-10 w-10" />,
      title: "10가지 마케팅 통합 패키지 제공 (월 80만원)",
      description: "플레이스 SEO 세팅\n블로그 체험단 모집 (월10~20명)\n블로그 기자단 월 30건 발행\n매달 플레이스 영수증 리뷰 답글\n네이버 클립 영상 (월5개)\n최적화 블로그 월 2건 발행\n당근마켓 소식글 3건\n인스타그램 릴스 발행 1회\n월간 보고서 제공",
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
    <div className="min-h-[100svh] bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 overflow-x-hidden">
        <div className="container mx-auto px-4 py-4 max-w-full">
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
              <a href="#contact">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white">
                  문의하기
                </Button>
              </a>
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
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white w-full mt-4">
                문의하기
              </Button>
            </a>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex items-start justify-center pt-20 pb-8 md:pb-12 overflow-x-hidden">
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

        <motion.div style={{ opacity, scale }} className="container mx-auto px-4 z-10 text-center max-w-full overflow-x-hidden py-12 md:py-16">
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

            <p className="mt-6 text-lg md:text-xl lg:text-2xl text-gray-300 max-w-2xl mx-auto">
              우리는 단순한 디자인이 아닌 고객이 머무르고 행동하는 웹을 만듭니다.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center px-2">
              <a href="#contact" className="inline-block w-full sm:w-auto">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-4 md:px-8 lg:px-10 py-4 md:py-6 lg:py-7 text-sm md:text-base lg:text-xl h-auto w-full sm:w-auto">
                  고퀄리티 맞춤 홈페이지 제작 문의하기
                </Button>
              </a>
            </div>

            <div className="mt-8 md:mt-12 flex justify-center">
              <div className="animate-bounce">
                <ChevronRight className="h-8 w-8 rotate-90 text-white/50" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Inquiry Form Section */}
      <section id="inquiry" className="py-12 md:py-24 bg-black overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              {/* 고퀄리티 홈페이지 제작 문의 폼 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="max-w-md mx-auto"
              >
                <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-white/10 p-6 md:p-8 rounded-xl">
                  <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-center">고퀄리티 홈페이지 제작 및 마케팅 문의</h3>

                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label htmlFor="name2" className="block text-base md:text-lg font-bold mb-2">
                        이름
                      </label>
                      <Input
                        id="name2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="이름을 입력해주세요"
                      />
                    </div>

                    <div>
                      <label htmlFor="email2" className="block text-base md:text-lg font-bold mb-2">
                        이메일
                      </label>
                      <Input
                        id="email2"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="메일주소@naver.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone2" className="block text-base md:text-lg font-bold mb-2">
                        전화번호
                      </label>
                      <Input
                        id="phone2"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="010-1234-5678"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white text-base md:text-lg font-bold py-3 md:py-4",
                        isSubmitting && "opacity-70 cursor-not-allowed",
                      )}
                    >
                      {isSubmitting ? "전송 중..." : "견적 문의"}
                    </Button>

                    {/* 카카오 채널 버튼 */}
                    <div className="pt-2 flex items-center justify-center gap-3 md:gap-4">
                      <span className="text-white font-semibold text-base md:text-lg whitespace-nowrap">OR</span>
                      <a href="http://pf.kakao.com/_BjtHn" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm md:text-base px-4 md:px-6 py-2 md:py-3 whitespace-nowrap">
                          카카오 채널로 문의하기
                        </Button>
                      </a>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 md:py-24 bg-zinc-900 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">우리의 서비스</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto">
              귀사의 가장 복잡한 비즈니스 과제를 해결하기 위한 종합적인 AI 솔루션.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto justify-items-center">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`w-full ${index === 6 ? 'max-w-[500px] lg:col-span-1 lg:col-start-1' : 'max-w-[380px]'} bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-xl relative flex flex-col ${
                  index === 4 || index === 5 ? 'self-start' : index === 6 ? 'self-start' : 'h-full'
                } ${
                  index === 7 ? 'lg:col-start-2' : ''
                }`}
              >
                <div className="text-purple-500 mb-4 md:mb-6">{service.icon}</div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 leading-tight whitespace-pre-line text-white">{service.title}</h3>
                {service.description && service.description.includes('\n') ? (
                  <div className={`text-sm md:text-base lg:text-lg text-white leading-relaxed ${index === 4 || index === 5 || index === 6 ? '' : 'flex-grow'}`}>
                    {service.description.split('\n').map((item, idx, arr) => {
                      // 7번째 상자(index 6)에서 "샤오홍슈 체험단 컨텐츠 업로드" 다음에 "(자영업, 제품, 브랜드 등)"이 오는 경우 줄바꿈 처리
                      if (index === 6 && item.includes('샤오홍슈 체험단 컨텐츠 업로드') && arr[idx + 1] && arr[idx + 1].includes('(자영업, 제품, 브랜드 등)')) {
                        return (
                          <div key={idx}>
                            <div className="mb-1">- {item}</div>
                            <div className="mb-1 text-white pl-4">(자영업, 제품, 브랜드)</div>
                          </div>
                        );
                      }
                      // 7번째 상자에서 "(자영업, 제품, 브랜드 등)"은 이미 위에서 처리되므로 스킵
                      if (index === 6 && item.includes('(자영업, 제품, 브랜드 등)')) {
                        return null;
                      }
                      // 8번째 상자(index 7)에서 "블로그 체험단 모집 (월10~20명)" 처리
                      if (index === 7 && item.includes('블로그 체험단 모집')) {
                        return (
                          <div key={idx} className="mb-1">
                            - 블로그 체험단 모집 <span className="text-white">(월10~20명)</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="mb-1">
                          - {item}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={`text-sm md:text-base lg:text-lg text-white leading-relaxed ${index === 4 || index === 5 || index === 6 ? '' : 'flex-grow'}`}>{service.description || ''}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 md:py-24 relative overflow-x-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-purple-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-full relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">부스트웹을 선택하는 이유</h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto">
                깊이 있는 기획력과 실전형 디자인, 그리고 사용자 행동을 기반으로 매출과 성장을 만드는 웹 제작 솔루션을
                제공합니다.
              </p>

              <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
                <div className="flex gap-4 md:gap-6">
                  <div className="bg-purple-500/20 p-3 md:p-4 rounded-full h-fit">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3">전략에 기반한 설계</h3>
                    <p className="text-sm md:text-base lg:text-lg text-gray-400">
                      우리는 단순히 예쁜 화면을 만드는 것이 아니라 고객이 실제로 행동하고 전환하도록 설계된 구조를
                      만듭니다. 브랜드·시장·사용자 분석을 기반으로 성공 가능한 웹 전략을 제시합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="bg-cyan-500/20 p-3 md:p-4 rounded-full h-fit">
                    <Code className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3">맞춤형 UI/UX 제작</h3>
                    <p className="text-sm md:text-base lg:text-lg text-gray-400">
                      모든 비즈니스는 다르기에, 우리도 정해진 템플릿을 사용하지 않습니다. 쇼핑몰, SaaS 대시보드,
                      포트폴리오, 앱까지 목적과 산업에 맞춘 인터페이스 경험을 디자인합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="bg-purple-500/20 p-3 md:p-4 rounded-full h-fit">
                    <Database className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3">성장으로 이어지는 결과</h3>
                    <p className="text-sm md:text-base lg:text-lg text-gray-400">
                      웹은 한 번 만들고 끝나는 것이 아닙니다. 우리는 제작 이후에도 유지·운영·전환 개선 패널티 관리를
                      지원하며 매출 상승과 브랜드 신뢰도의 지속 성장을 목표로 합니다.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-12 md:py-24 bg-zinc-900 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">팀 소개</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto">
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
      <section id="process" className="py-12 md:py-24 relative overflow-x-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-full relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">우리의 프로세스</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto">
              실제 성과로 연결되는 웹 제작을 위한 체계적인 워크플로우
            </p>
          </div>

          <div className="overflow-visible">
            <ProcessAutoScroll steps={processSteps} />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-24 bg-zinc-900 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">함께 성장할 준비가 되셨나요?</h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-8 md:mb-12">
                목표에 맞는 웹 전략과 디자인으로<br className="md:hidden" />
                당신의 비즈니스를 더욱 확장시켜드립니다.
              </p>

              {/* 고퀄리티 홈페이지 제작 문의 폼 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="max-w-md mx-auto"
              >
                <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-white/10 p-6 md:p-8 rounded-xl">
                  <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-center">고퀄리티 홈페이지 제작 및 마케팅 문의</h3>

                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-base md:text-lg font-bold mb-2">
                        이름
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="이름을 입력해주세요"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-base md:text-lg font-bold mb-2">
                        이메일
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="메일주소@naver.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-base md:text-lg font-bold mb-2">
                        전화번호
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 focus:border-purple-500 focus:ring-purple-500 text-base md:text-lg w-full"
                        placeholder="010-1234-5678"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white text-base md:text-lg font-bold py-3 md:py-4",
                        isSubmitting && "opacity-70 cursor-not-allowed",
                      )}
                    >
                      {isSubmitting ? "전송 중..." : "견적 문의"}
                    </Button>

                    {/* 카카오 채널 버튼 */}
                    <div className="pt-2 flex items-center justify-center gap-3 md:gap-4">
                      <span className="text-white font-semibold text-base md:text-lg whitespace-nowrap">OR</span>
                      <a href="http://pf.kakao.com/_BjtHn" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm md:text-base px-4 md:px-6 py-2 md:py-3 whitespace-nowrap">
                          카카오 채널로 문의하기
                        </Button>
                      </a>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 border-t border-white/10 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="text-center text-gray-500 text-xs md:text-sm">
            <p>© 2025 BOOSTWEB. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
