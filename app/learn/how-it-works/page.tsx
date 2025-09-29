"use client";

import React, { useState } from "react";
import { ArrowLeft, Wallet, TrendingUp, Shield, Zap, ArrowRight, DollarSign, BarChart3, Lock, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();
  const steps = [
    {
      number: "01",
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Link your crypto wallet to Polystream, or we'll help you create one.",
      details: [
        "Works with popular wallets like MetaMask",
        "We can create a wallet for you if you don't have one",
        "Bank-level security with advanced encryption secured using Privy"
      ]
    },
    {
      number: "02", 
      icon: DollarSign,
      title: "Add Your Money",
      description: "Deposit USDC (a stable digital dollar) or other cryptocurrencies. Start with whatever amount feels comfortable - even $10 works.",
      details: [
        "USDC is backed 1:1 by real US dollars",
        "No minimum amount required to start",
        "Money arrives in your account instantly"
      ]
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Pick Your Strategy",
      description: "Choose how you want to earn money. We show you the expected returns and explain the risks in plain English before you decide.",
      details: [
        "All strategies are reviewed by our team",
        "Clear explanations of risks and rewards",
        "You can change or withdraw anytime"
      ]
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Watch Your Money Grow",
      description: "Your money starts earning interest automatically. Check your balance anytime to see your progress - it updates every day.",
      details: [
        "Interest is calculated and added daily",
        "Your earnings compound automatically",
        "Watch your balance grow in real-time"
      ]
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Your Money Stays Yours",
      description: "We never hold your money. It goes directly to proven protocols that have safely managed billions of dollars.",
      color: "text-green-500"
    },
    {
      icon: Zap,
      title: "Sponsored Fees",
      description: "We cover all the network fees, so you can focus on earning without worrying about transaction costs.",
      color: "text-blue-500"
    },
    {
      icon: RefreshCw,
      title: "Automatic Growth",
      description: "Your earnings are automatically reinvested to earn even more, like compound interest in a savings account.",
      color: "text-purple-500"
    },
    {
      icon: Lock,
      title: "Withdraw Anytime",
      description: "Unlike CDs or locked savings accounts, you can access your money whenever you need it.",
      color: "text-orange-500"
    }
  ];

  const faqs = [
    {
      question: "What if I don't know anything about cryptocurrency?",
      answer: "That's perfectly fine! You don't need to understand how email works to send messages, and you don't need to understand blockchain to use Polystream. We handle all the technical stuff. You just need to know that USDC is a digital dollar - it's always worth $1 and is backed by real US dollars held in regulated banks."
    },
    {
      question: "How is this different from my bank savings account?",
      answer: "Your bank savings account might pay 0.01-0.5% interest per year. DeFi can offer 3-15% because there's no expensive bank buildings, tellers, or managers to pay for. The money goes directly to people who need loans, and you earn most of the interest they pay."
    },
    {
      question: "What are the risks I should know about?",
      answer: "The main risks are: 1) Technology risk - smart contracts could have bugs, 2) Market risk - crypto values can go up and down, 3) Regulatory risk - rules could change. We minimize these by only using well-tested protocols and starting you with stable coins like USDC. Think of it like investing in stocks - there are risks, but millions of people do it successfully."
    },
    {
      question: "How much money do I need to start?",
      answer: "You can start with as little as $10. We recommend starting small while you learn how everything works. Many successful users started with $50-100 and gradually added more as they became comfortable."
    },
    {
      question: "How quickly can I get my money back if I need it?",
      answer: "Most of the time, you can withdraw your money within minutes. During busy periods, it might take a few hours. This is much faster than traditional investments like CDs or some savings accounts that lock up your money for months or years."
    },
    {
      question: "What happens to my money if Polystream shuts down?",
      answer: "Your money isn't held by Polystream - it's in DeFi protocols that operate independently. Even if Polystream disappeared tomorrow, you could still access your funds directly through the blockchain. It's like having your money in a safety deposit box that only you have the key to."
    },
    {
        question: "How does Polystream make money?",
        answer: "Polystream charges a 10% performance fee on your earned yields. There are no management fees or hidden costs. This means we are incentivized to help you maximize your returns."
    }

  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 flex-shrink-0">
        <button className="mr-2 p-2 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold ml-2">How Polystream Works</h1>
      </div>

      <div className="px-6 max-w-2xl mx-auto">
        {/* Hero Section */}
        
          <div className="text-center mb-12 bg-background p-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Simple Steps to Start Earning
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Polystream makes DeFi accessible by handling the complexity while you enjoy the benefits. Here's how it works.
            </p>
          </div>
        

        {/* Steps */}
        <div className="mb-12">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                
                <div className="flex gap-6">
                  
                  {/* Content */}
                  <div className="flex-1 pt-2 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-sm mb-2 shadow-lg shadow-primary/25">
                      {step.number}
                    </div>
                    <div className="flex items-center gap-3 mb-3 px-4 rounded-lg shadow-sm">
                      <step.icon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-center">
                      {step.description}
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <ul className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0"></div>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        
          <div className="mb-12 bg-background">
            <h3 className="text-xl font-semibold mb-6 text-center">Why Choose Polystream?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="bg-muted/50 p-2 rounded-lg flex-shrink-0">
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        

        {/* FAQ Section */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Risk Disclosure */}
          <div className="mb-12 bg-background py-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                  Understanding the Risks
                </h3>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed mb-3">
                DeFi investments carry risks including smart contract vulnerabilities, market volatility, and potential loss of funds. We only work with audited protocols, but risks remain.
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs">
                Never invest more than you can afford to lose. Past performance doesn't guarantee future results.
              </p>
            </div>
          </div>

        {/* Call to Action */}
        <div className="text-center mb-20">
          <h3 className="text-lg font-semibold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of users already earning yields with Polystream.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/buy">
              <Button className="w-full sm:w-auto">
                Make Your First Deposit
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/learn/what-is-defi">
              <Button variant="outline" className="w-full sm:w-auto">
                Learn About DeFi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}