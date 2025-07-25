"use client";

import { Suspense } from "react";
import React from "react";
import { motion } from "motion/react";
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
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Feature, PricingTier, Stat, Step, Testimonial } from "@/types";
import NavbarLanding from "@/components/NavbarLanding";

// TypeScript interfaces
interface FadeInViewProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}

interface ScaleButtonProps extends React.ComponentProps<typeof motion.button> {
  children: React.ReactNode;
  className?: string;
}

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
  ...props
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={className}
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
  const bgClass = bgColor === "primary" ? "bg-[#1D1D1D]" : "bg-[#2A2A2A]";
  return (
    <section
      id={id}
      className={`relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${bgClass} py-16 snap-start ${className}`}
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
      className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-center ${
        subtitle ? "mb-4" : "mb-8 sm:mb-12"
      } ${className}`}
    >
      {children}
    </h2>
    {subtitle && (
      <p className="text-center text-gray-400 mb-8 sm:mb-12 text-base sm:text-lg">
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
    tokens: 20,
    desc: "Try out / test waters",
    popular: false,
  },
  { name: "Pro", tokens: 60, desc: "1–2 Shorts a day", popular: true },
  {
    name: "Studio",
    tokens: 150,
    desc: "Grow faceless channel",
    popular: false,
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
    desc: "YouTube via Zapier",
  },
  {
    icon: RefreshCw,
    title: "Smart Notifications",
    desc: "Telegram/Discord alerts",
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
  { icon: Clock, text: "60-second generation" },
  { icon: Globe, text: "Multi-language support" },
  { icon: Users, text: "10,000+ creators" },
];

// Video Preview Component
interface VideoPreviewProps {
  title: string;
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
    className={`relative bg-[#2A2A2A] rounded-2xl overflow-hidden ${aspectRatio}`}
  >
    <img
      src="https://placehold.co/600x400"
      alt={title}
      className="w-full h-full object-cover"
    />
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#D68CB8] rounded-full flex items-center justify-center">
        <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white ml-1" />
      </div>
    </motion.div>
    {duration && (
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/70 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
        {duration}
      </div>
    )}
  </motion.div>
);

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <NavbarLanding />
      <Suspense fallback={<div className="min-h-screen" />}>
        <div className="min-h-screen text-white overflow-x-hidden snap-y snap-mandatory">
          {/* Hero Section */}
          <motion.section
            id="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#1D1D1D] py-16 snap-start"
          >
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6"
              >
                Auto-Generate Viral YouTube Shorts in{" "}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-transparent bg-clip-text bg-[#D68CB8] block sm:inline"
                >
                  60 Seconds
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
                <ScaleButton className="group px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
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
              <Heading>How It Works</Heading>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                {STEPS.map((step, index) => (
                  <FadeInView
                    key={index}
                    delay={index * 0.2}
                    y={50}
                    whileHover={{ y: -10 }}
                    className="relative p-6 sm:p-8 rounded-2xl bg-[#1D1D1D] backdrop-blur-sm border border-white/10 transition-all duration-500"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                      className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#D68CB8] rounded-full flex items-center justify-center font-bold text-base sm:text-lg"
                    >
                      {index + 1}
                    </motion.div>
                    <div className="mb-4 text-[#D68CB8]">
                      <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
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
                    className="flex items-center gap-2 text-white/90 font-bold"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#D68CB8]" />
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
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  See the Magic in Action
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
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center">
                    Before
                  </h3>
                  <VideoPreview
                    title="Long form video preview"
                    duration="45:32"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center">
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
                        className="relative bg-[#2A2A2A] rounded-xl overflow-hidden aspect-[9/16]"
                      >
                        <img
                          src={`https://placehold.co/600x400`}
                          alt={`Short video ${i}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D68CB8] rounded-full flex items-center justify-center"
                          >
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white ml-0.5" />
                          </motion.div>
                        </div>
                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/70 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                          0:{30 + i * 15}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>

          {/* Pricing Section */}
          <Section id="pricing" bgColor="secondary">
            <div className="max-w-4xl mx-auto w-full">
              <Heading subtitle="Pay as you grow • No subscriptions">
                Simple Token Pricing
              </Heading>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {PRICING_TIERS.map((tier, index) => (
                  <FadeInView
                    key={index}
                    delay={index * 0.2}
                    y={50}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-b from-pink-900/20 to-pink-900/20 border-pink-200/50 shadow-xl shadow-pink-500/20"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {tier.popular && (
                      <motion.div
                        initial={{ scale: 0, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#D68CB8] rounded-full text-xs font-semibold"
                      >
                        POPULAR
                      </motion.div>
                    )}
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">
                      {tier.name}
                    </h3>
                    <div className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
                      {tier.tokens}
                      <span className="text-base sm:text-lg text-gray-400 font-normal">
                        {" "}
                        tokens
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                      {tier.desc}
                    </p>
                    <ScaleButton
                      className={`w-full py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
                        tier.popular
                          ? "bg-gradient-to-r from-pink-200 to-pink-400 hover:shadow-lg hover:shadow-pink-500/50"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      Get Started
                    </ScaleButton>
                  </FadeInView>
                ))}
              </div>

              <FadeInView
                delay={0.8}
                className="text-center mt-6 sm:mt-8 text-gray-400 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Get 2 free tokens on sign up — no card required.
              </FadeInView>
            </div>
          </Section>

          {/* Why Reeru */}
          <Section id="features" bgColor="primary">
            <div className="max-w-6xl mx-auto w-full">
              <Heading>Why Reeru?</Heading>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-pink-300/50 transition-all duration-300"
                  >
                    <div className="mb-4 text-[#D68CB8]">
                      <feature.icon className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
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
          <div className="bg-[#2A2A2A] snap-start">
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto w-full">
                <Heading className="pt-10">Creators Love Reeru</Heading>

                <div className="space-y-4 sm:space-y-6">
                  {TESTIMONIALS.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                    >
                      <p className="text-base sm:text-lg mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-sm sm:text-base">
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
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
                >
                  Start Creating Shorts in Minutes
                </motion.h2>
                <FadeInView delay={0.2}>
                  <p className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-10">
                    No credit card required. Just sign up and pick a video.
                  </p>
                </FadeInView>

                <FadeInView delay={0.4}>
                  <ScaleButton className="group px-6 sm:px-10 py-3 sm:py-5 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full font-semibold text-base sm:text-xl hover:shadow-2xl hover:shadow-pink-400/50 transition-all duration-300 transform inline-flex items-center gap-2 sm:gap-3">
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
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-1 sm:gap-2"
                    >
                      <item.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {item.text}
                    </motion.span>
                  ))}
                </FadeInView>
              </div>
            </section>
          </div>
        </div>
      </Suspense>
    </>
  );
}
