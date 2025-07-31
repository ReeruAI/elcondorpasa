"use client";

import { Suspense, useEffect } from "react";
import React from "react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Play,
  Zap,
  CheckCircle,
  ArrowRight,
  Globe,
  Upload,
  Sparkles,
  Clock,
  Users,
  Brain,
  Target,
  Type,
  Rocket,
  RefreshCw,
  AlertCircle,
  Crown,
  Check,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Feature, PricingTier, Stat, Step, Testimonial } from "@/types";
import NavbarLanding from "@/components/NavbarLanding";
import CursorGlow from "@/components/CursorGlow";
import ParticleBackground from "@/components/yourclip/ParticleBackground";
import Footer from "@/components/Footer";

// TypeScript interfaces
interface FadeInViewProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}

interface ScaleButtonProps extends React.ComponentProps<typeof motion.button> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Animation variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay },
  }),
};

const scaleVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

// Reusable motion components
const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  y = 20,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    {...props}
  >
    {children}
  </motion.div>
);

const ScaleButton: React.FC<ScaleButtonProps> = ({
  children,
  className = "",
  onClick,
  ...props
}) => (
  <motion.button
    variants={scaleVariants}
    initial="idle"
    whileHover="hover"
    whileTap="tap"
    className={className}
    onClick={onClick}
    {...props}
  >
    {children}
  </motion.button>
);

// Reusable Section component
interface SectionProps {
  id?: string;
  bgColor?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({
  id,
  bgColor = "primary",
  children,
  className = "",
}) => {
  return (
    <section
      id={id}
      className={`relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 snap-start ${className}`}
    >
      {children}
    </section>
  );
};

// Reusable heading component
interface HeadingProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const Heading: React.FC<HeadingProps> = ({
  children,
  subtitle,
  className = "",
}) => (
  <FadeInView>
    <h2
      className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white ${
        subtitle ? "mb-4" : "mb-8 sm:mb-12"
      } ${className}`}
    >
      {children}
    </h2>
    {subtitle && (
      <p className="text-center text-gray-300 mb-8 sm:mb-12 text-base sm:text-lg">
        {subtitle}
      </p>
    )}
  </FadeInView>
);

// Constants
const STEPS: Step[] = [
  {
    icon: Upload,
    title: "Paste or Pick a Video",
    desc: "Paste a YouTube link or choose viral videos from your favorite niche",
  },
  {
    icon: Sparkles,
    title: "Reeru AI Works Its Magic",
    desc: "Auto-clipped, formatted to 9:16, subtitled, and enhanced with smart editing",
  },
  {
    icon: Zap,
    title: "Preview & Publish",
    desc: "Review the result, download it, or auto-publish directly to YouTube",
  },
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    tokens: 1,
    price: 25000,
    desc: "Perfect for getting started",
    features: ["1 Reeru Token", "Basic features", "24/7 Support"],
    popular: false,
    icon: Sparkles,
    color: "from-blue-400 to-blue-600",
    bgGradient: "bg-blue-500/10",
  },
  {
    name: "Pro",
    tokens: 6,
    price: 120000,
    desc: "Best for regular creators",
    features: [
      "6 Reeru Tokens",
      "All Pro features",
      "Priority support",
      "20% Bonus",
    ],
    popular: true,
    icon: Zap,
    color: "from-[#D68CB8] to-pink-400",
    bgGradient: "bg-[#D68CB8]/10",
  },
  {
    name: "Studio",
    tokens: 10,
    price: 225000,
    desc: "Scale your production",
    features: [
      "10 Reeru Tokens",
      "All Studio features",
      "Dedicated support",
      "Best value",
    ],
    popular: false,
    icon: Crown,
    color: "from-purple-400 to-purple-600",
    bgGradient: "bg-purple-500/10",
  },
];

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "AI-Powered Clipping",
    desc: "Smart scene detection",
  },
  {
    icon: Target,
    title: "Viral Topic Suggestions",
    desc: "Trending content ideas",
  },
  {
    icon: Type,
    title: "Auto Subtitle",
    desc: "Multiple languages",
  },
  {
    icon: Rocket,
    title: "Direct Publishing",
    desc: "Upload to YouTube",
  },
  {
    icon: RefreshCw,
    title: "Smart Notifications",
    desc: "Telegram alerts",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I used to spend 2 hours editing 1 short. Reeru now does it in under a minute.",
    author: "@ContentKing",
    role: "Faceless channel creator",
  },
  {
    quote:
      "The AI clipping is insane. It finds the best moments every single time.",
    author: "@ViralVids",
    role: "YouTube growth expert",
  },
  {
    quote:
      "Auto-upload to YouTube is a game changer. I schedule 30 shorts in 10 minutes.",
    author: "@MarketingPro",
    role: "Digital marketer",
  },
];

const FINAL_STATS: Stat[] = [
  { icon: Clock, text: "No Hassle" },
  { icon: Globe, text: "Multi-language support" },
  { icon: Users, text: "10,000+ creators" },
];

// Video Preview Component
interface VideoPreviewProps {
  title?: string;
  aspectRatio?: string;
  duration?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  title,
  aspectRatio = "aspect-video",
  duration,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`relative rounded-2xl overflow-hidden ${aspectRatio}`}
    style={{
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}
  >
    <video
      src="/demo-shorts.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover opacity-80"
    >
      <source src="/demo-shorts.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    {duration && (
      <div
        className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-white"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {duration}
      </div>
    )}
  </motion.div>
);

export default function Home() {
  const router = useRouter();

  const handleRegisterClick = () => {
    router.push("/register");
  };

  const pathname = usePathname();
  useEffect(() => {
    const currentPath = pathname.split("/")[1];
    const title = `ReeruAI - Making Short Easier${
      currentPath.charAt(0).toUpperCase() + currentPath.slice(1)
    }`;
    document.title = title;
  }, [pathname]);

  return (
    <>
      <LoadingScreen />
      <NavbarLanding />
      <Suspense fallback={<div className="min-h-screen" />}>
        <div className="min-h-screen text-white overflow-x-hidden snap-y snap-mandatory bg-gradient-to-b from-[#1D1D1D] to-black">
          {/* Background Effects */}
          <ParticleBackground />

          {/* Cursor Glow Effect */}
          <CursorGlow />

          {/* Hero Section */}
          <motion.section
            id="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 snap-start"
          >
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white"
              >
                Auto-Generate Viral YouTube Shorts,{" "}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 block sm:inline"
                >
                  Without Hassle
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base sm:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto px-4"
              >
                Turn any YouTube video into high-performing Shorts — clipped,
                subtitled, and ready to publish.
              </motion.p>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center px-4"
              >
                <ScaleButton
                  onClick={handleRegisterClick}
                  className="group px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 text-white"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.border =
                      "1px solid rgba(214, 140, 184, 0.5)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(214, 140, 184, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Try for Free
                  <ArrowRight className="inline-block ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </ScaleButton>
              </motion.div>
            </div>

            <style jsx global>{`
              html {
                scroll-behavior: smooth;
                scroll-snap-type: y mandatory;
              }

              body {
                overflow-x: hidden;
              }

              .snap-y {
                scroll-snap-type: y mandatory;
                height: 100vh;
                overflow-y: scroll;
                -webkit-overflow-scrolling: touch;
              }

              .snap-start {
                scroll-snap-align: start;
                scroll-snap-stop: always;
              }

              .snap-y::-webkit-scrollbar {
                width: 0px;
                background: transparent;
              }

              .snap-y {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </motion.section>

          {/* How It Works */}
          <Section id="how-it-works" bgColor="secondary">
            <div className="max-w-6xl mx-auto w-full">
              <Heading>
                How It{" "}
                <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Works
                </span>
              </Heading>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                {STEPS.map((step, index) => (
                  <FadeInView
                    key={index}
                    delay={index * 0.2}
                    y={50}
                    whileHover={{ y: -10 }}
                    className="relative p-6 sm:p-8 rounded-2xl transition-all duration-500"
                    style={{
                      backgroundColor: "rgba(31, 31, 31, 0.3)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                      className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-2xl"
                      style={{
                        boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)",
                      }}
                    >
                      {index + 1}
                    </motion.div>
                    <div className="mb-4">
                      <step.icon className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      {step.desc}
                    </p>
                  </FadeInView>
                ))}
              </div>

              <FadeInView
                delay={0.8}
                className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm"
              >
                {[
                  "No editing skills",
                  "No complicated timeline",
                  "Fast and scalable",
                ].map((text, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-2 text-gray-300 font-bold"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                    {text}
                  </motion.span>
                ))}
              </FadeInView>
            </div>
          </Section>

          {/* Showcase Section */}
          <Section id="showcase" bgColor="primary">
            <div className="container mx-auto px-4">
              <FadeInView className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                  See the{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                    Magic
                  </span>{" "}
                  in Action
                </h2>
                <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
                  Watch how Reeru AI transforms long videos into engaging shorts
                </p>
              </FadeInView>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">
                    Before
                  </h3>
                  <VideoPreview />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">
                    After
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="relative rounded-xl overflow-hidden aspect-[9/16]"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                        }}
                      >
                        <video
                          src={`/short-${i}.mp4`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover opacity-80"
                        >
                          <source src={`/short-${i}.mp4`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>
          {/* Pricing Section */}
          <Section id="pricing" bgColor="secondary">
            <div className="max-w-6xl mx-auto w-full">
              <Heading subtitle="Pay as you grow • No subscriptions">
                <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Simple
                </span>{" "}
                Token Pricing
              </Heading>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {PRICING_TIERS.map((tier, index) => {
                  const Icon = tier.icon;

                  return (
                    <FadeInView
                      key={index}
                      delay={index * 0.1}
                      y={20}
                      className="relative h-full"
                    >
                      {tier.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-gradient-to-r from-[#D68CB8] to-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.05, y: -8 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative h-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 border ${
                          tier.popular
                            ? "border-[#D68CB8]/50"
                            : "border-white/10"
                        } cursor-pointer transition-all duration-300 hover:border-white/20 flex flex-col`}
                        style={{
                          boxShadow: tier.popular
                            ? "0 20px 40px rgba(214, 140, 184, 0.2)"
                            : "none",
                        }}
                      >
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 ${tier.bgGradient} rounded-xl mb-4`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                          {tier.name}
                        </h3>

                        <div className="mb-2">
                          <span className="text-3xl font-bold text-white">
                            Rp {tier.price.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                          {tier.desc}
                        </p>

                        <ul className="space-y-3 mb-6 flex-grow">
                          {tier.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-start text-gray-300 text-sm"
                            >
                              <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <ScaleButton
                          onClick={handleRegisterClick}
                          className={`w-full py-3 px-4 bg-gradient-to-r ${tier.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 mt-auto`}
                          style={{
                            boxShadow: tier.popular
                              ? "0 10px 30px rgba(214, 140, 184, 0.3)"
                              : "none",
                          }}
                          onMouseEnter={(e) => {
                            if (tier.popular) {
                              e.currentTarget.style.boxShadow =
                                "0 15px 40px rgba(214, 140, 184, 0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (tier.popular) {
                              e.currentTarget.style.boxShadow =
                                "0 10px 30px rgba(214, 140, 184, 0.3)";
                            }
                          }}
                        >
                          Get Started
                        </ScaleButton>
                      </motion.div>
                    </FadeInView>
                  );
                })}
              </div>

              <FadeInView
                delay={0.4}
                className="text-center mt-8 text-gray-400 text-sm flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Get 2 free tokens on sign up — no card required.
              </FadeInView>
            </div>
          </Section>

          {/* Why Reeru */}
          <Section id="features" bgColor="primary">
            <div className="max-w-6xl mx-auto w-full">
              <Heading>
                Why{" "}
                <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Reeru?
                </span>
              </Heading>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group p-5 sm:p-6 rounded-2xl transition-all duration-300"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border =
                        "1px solid rgba(236, 72, 153, 0.3)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 30px rgba(236, 72, 153, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border =
                        "1px solid rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="mb-4 text-pink-400">
                      <feature.icon className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* Testimonials and CTA */}
          <div className="snap-start">
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto w-full">
                <Heading className="pt-10 relative z-10">
                  Creators{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                    Love Reeru
                  </span>
                </Heading>

                <div className="space-y-4 sm:space-y-6">
                  {TESTIMONIALS.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 sm:p-6 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <p className="text-base sm:text-lg mb-4 italic text-gray-300">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg"
                          style={{
                            boxShadow: "0 10px 20px rgba(236, 72, 153, 0.3)",
                          }}
                        />
                        <div>
                          <p className="font-semibold text-sm sm:text-base text-white">
                            {testimonial.author}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent pb-2"
                >
                  Start Creating Shorts in Minutes
                </motion.h2>
                <FadeInView delay={0.2}>
                  <p className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-10">
                    No credit card required. Just sign up and pick a video.
                  </p>
                </FadeInView>

                <FadeInView delay={0.4}>
                  <ScaleButton
                    onClick={handleRegisterClick}
                    className="group px-6 sm:px-10 py-3 sm:py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-base sm:text-xl transition-all duration-300 transform inline-flex items-center gap-2 sm:gap-3 text-white shadow-2xl"
                    style={{
                      boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 25px 50px rgba(236, 72, 153, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 20px 40px rgba(236, 72, 153, 0.3)";
                    }}
                  >
                    Try Reeru Free — Get 2 Tokens Today
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </ScaleButton>
                </FadeInView>

                <FadeInView
                  delay={0.6}
                  className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400"
                >
                  {FINAL_STATS.map((item, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-1 sm:gap-2"
                    >
                      <item.icon className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                      {item.text}
                    </motion.span>
                  ))}
                </FadeInView>
              </div>
            </section>
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </Suspense>
    </>
  );
}
