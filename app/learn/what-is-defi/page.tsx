"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowLeft, Shield, Users, Zap, TrendingUp, Lock, Globe, Coins,
    ChevronDown, ChevronUp, AlertCircle, Building2, BookOpen,
    Target, Layers, BarChart3, ArrowUpDown, DollarSign,
    ChevronRight, Play, ExternalLink, Sparkles, ArrowRight,
    PiggyBank, Repeat, Activity, Code2, Waves
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { AICard } from "../../components/ui/ai-card";
import { useVaults } from "../../lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { getVaultConfig } from "../../lib/config/vaults";
import { useRouter } from "next/navigation";

export default function WhatIsDeFi() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeStrategy, setActiveStrategy] = useState<number>(0);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const router = useRouter();
    // Fetch real vault data
    const { data: vaults, isLoading: vaultsLoading } = useVaults();

    const benefits = [
        {
            icon: Globe,
            title: "Open 24/7",
            description: "Like the internet, DeFi never sleeps. You can send money, earn interest, or trade anytime.",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: Shield,
            title: "Transparent",
            description: "Every transaction is recorded publicly. You can verify where your money goes, unlike traditional banks.",
            gradient: "from-green-500 to-emerald-500"
        },
        {
            icon: Users,
            title: "No Middleman",
            description: "Deal directly with others without banks taking fees or controlling your money.",
            gradient: "from-purple-500 to-violet-500"
        },
        {
            icon: Building2,
            title: "Better Rates",
            description: "Without expensive overhead, DeFi can offer higher interest rates and lower fees.",
            gradient: "from-orange-500 to-red-500"
        }
    ];

    // Convert vault data to strategy format
    const getStrategiesFromVaults = () => {
        if (!vaults || vaults.length === 0) {
            // Fallback strategies if no vault data
            return [
                {
                    id: "lending",
                    title: "Lending Pools",
                    subtitle: "Earn steady returns",
                    description: "Lend your money to others and earn interest - like a high-yield savings account",
                    icon: PiggyBank,
                    apy: "4-8%",
                    risk: "Low",
                    details: "Your money goes into a pool where people borrow it. You earn interest from borrowers. Platforms like Aave and Compound have managed billions safely.",
                    supported: true,
                    vaultData: null
                },
                {
                    id: "liquidity",
                    title: "Liquidity Providing",
                    subtitle: "Provide trading liquidity",
                    description: "Help others trade by providing liquidity pairs and earn fees",
                    icon: ArrowUpDown,
                    apy: "6-15%",
                    risk: "Medium",
                    details: "You provide two different tokens to create a trading pair. Traders pay fees which you earn. There's impermanent loss risk when token prices change.",
                    supported: false,
                    vaultData: null
                },
                {
                    id: "delta",
                    title: "Delta Neutral",
                    subtitle: "Market neutral returns",
                    description: "Earn yields while staying protected from crypto price swings",
                    icon: Activity,
                    apy: "8-12%",
                    risk: "Medium",
                    details: "Complex strategies that earn yield while hedging against price movements. You profit regardless of whether crypto goes up or down.",
                    supported: false,
                    vaultData: null
                }
            ];
        }

        // Map actual vault data to strategies
        return vaults.map((vault, index) => {
            let icon = PiggyBank;
            let subtitle = "Earn steady returns";

            // Determine icon and subtitle based on vault name/type
            if (vault.name.toLowerCase().includes('aave') || vault.name.toLowerCase().includes('compound')) {
                icon = PiggyBank;
                subtitle = "Lending protocol yields";
            } else if (vault.name.toLowerCase().includes('uniswap') || vault.name.toLowerCase().includes('curve')) {
                icon = ArrowUpDown;
                subtitle = "Liquidity providing";
            } else if (vault.name.toLowerCase().includes('delta') || vault.name.toLowerCase().includes('neutral')) {
                icon = Activity;
                subtitle = "Market neutral strategy";
            }

            return {
                id: vault.id,
                title: vault.name,
                subtitle: subtitle,
                description: `Earn ${vault.apy.toFixed(1)}% APY through this ${vault.riskLevel.toLowerCase()} risk strategy`,
                icon: icon,
                apy: `${vault.apy.toFixed(1)}%`,
                risk: vault.riskLevel,
                details: `This strategy uses proven DeFi protocols to generate yields. Current APY is ${vault.apy.toFixed(1)}% with ${vault.riskLevel.toLowerCase()} risk profile.`,
                supported: vault.active,
                vaultData: vault
            };
        });
    };

    const strategies = getStrategiesFromVaults();

    const concepts = [
        {
            title: "Smart Contracts",
            description: "Automated digital agreements that execute transactions when predetermined conditions are met. These self-executing contracts eliminate the need for intermediaries and ensure transparent, predictable outcomes.",
            icon: Code2,
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            title: "Liquidity Pools",
            description: "Shared reserves of cryptocurrency tokens that enable decentralized trading. Users contribute assets to these pools and earn fees from trades, creating a decentralized alternative to traditional market makers.",
            icon: Waves,
            gradient: "from-green-500 to-emerald-500"
        },
        {
            title: "Yield Farming",
            description: "Strategic deployment of cryptocurrency assets to maximize returns through various DeFi protocols. Users earn rewards by providing liquidity, staking tokens, or participating in governance activities.",
            icon: TrendingUp,
            gradient: "from-purple-500 to-violet-500"
        },
        {
            title: "Automated Market Makers",
            description: "Algorithmic trading mechanisms that automatically determine asset prices based on mathematical formulas and available liquidity. AMMs enable continuous trading without traditional order books.",
            icon: BarChart3,
            gradient: "from-orange-500 to-red-500"
        }
    ];

    const blockchains = [
        {
            name: "Scroll",
            icon: "/scroll.png",
            description: "ZK-rollup scaling solution with native Ethereum compatibility",
            isPrimary: true
        },
        {
            name: "Polygon",
            icon: "/polygon.png",
            description: "High-performance sidechain with low transaction costs",
            isPrimary: false
        },
        {
            name: "Arbitrum",
            icon: "/arbitrum.png",
            description: "Optimistic rollup delivering faster, cheaper Ethereum transactions",
            isPrimary: false
        },
        {
            name: "Base",
            icon: "/base.png",
            description: "Coinbase-incubated L2 focused on mainstream adoption",
            isPrimary: false
        },
        {
            name: "Optimism",
            icon: "/optimism.png",
            description: "Ethereum L2 with focus on public goods funding",
            isPrimary: false
        }
    ];

    const faqs = [
        {
            question: "Is DeFi safe? What if I lose my money?",
            answer: "DeFi has risks, just like any investment. However, many protocols have been audited by security experts and have operated safely for years. Start small, use reputable platforms, and never invest more than you can afford to lose. Think of it like learning to drive - there are risks, but with proper education and caution, millions of people do it safely every day."
        },
        {
            question: "How is this different from my regular bank?",
            answer: "Your bank is like a traditional store with employees, managers, and physical locations. DeFi is like online shopping - it's automated, operates 24/7, and has lower overhead costs. Your bank needs your permission to do anything with your money, but they also control it. In DeFi, you control your money directly, but you're also responsible for keeping it safe."
        },
        {
            question: "Do I need to be a tech expert to use DeFi?",
            answer: "Not at all! Just like you don't need to understand how email works to send messages, you don't need to understand blockchain technology to use DeFi. Platforms like Polystream make it as simple as using any other app on your phone."
        },
        {
            question: "What is crypto volatility and how does it affect me?",
            answer: "Crypto volatility means prices can change quickly - sometimes 10-20% in a day. This is why we recommend starting with stablecoins like USDC (always worth $1) for beginners. Advanced strategies can actually profit from volatility, but they're more complex."
        },
        {
            question: "Why should I trust DeFi over traditional banks?",
            answer: "You don't have to choose one or the other. Many people use both. DeFi offers transparency (you can see exactly what happens to your money) and often better returns. Traditional banks offer familiarity and insurance. Think of DeFi as another tool in your financial toolkit, not a replacement for everything you know."
        },
    ];

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <div className="flex items-center px-4 pt-4 flex-shrink-0">
                <button className="mr-2 p-2 rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6 text-primary" />
                </button>
                <h1 className="text-lg font-bold ml-2">Understanding DeFi</h1>
            </div>

            <div className="px-4 py-6 max-w-lg mx-auto">
                {/* Hero Section */}

                <div className="text-center p-6 bg-background mb-12">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-3xl animate-pulse"></div>
                        <div className="absolute inset-1 bg-background rounded-2xl flex items-center justify-center">
                            <Coins className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        What is DeFi?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        DeFi (Decentralized Finance) like having a bank that runs on the internet instead of in a building. Instead of bankers making decisions, computer programs handle everything automatically.
                    </p>
                </div>


                {/* Interactive Comparison */}
                <div className="mb-12">
                    <h3 className="text-xl font-semibold mb-4 text-center">Traditional Bank & Funds vs DeFi</h3>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left font-semibold px-4 py-3 w-auto"></th>
                                    <th className="text-center font-semibold px-4 py-3 w-1/2 text-muted-foreground">
                                        Traditional Banking
                                    </th>
                                    <th className="text-center font-semibold px-4 py-3 w-1/2 text-primary">
                                        DeFi Platforms
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Operating Hours</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">9-5, Weekdays</td>
                                    <td className="text-center px-4 py-3 text-primary font-semibold">24/7 Always</td>
                                </tr>
                                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Transfer Speed</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">1-3 business days</td>
                                    <td className="text-center px-4 py-3 text-primary font-semibold">Instant</td>
                                </tr>
                                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Interest Rates</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">0.01-3%</td>
                                    <td className="text-center px-4 py-3 text-green-600 font-semibold">2-15%</td>
                                </tr>
                                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Transparency</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">Limited visibility</td>
                                    <td className="text-center px-4 py-3 text-primary font-semibold">Fully transparent</td>
                                </tr>
                                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Control</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">Bank controls funds</td>
                                    <td className="text-center px-4 py-3 text-primary font-semibold">You control funds</td>
                                </tr>
                                <tr className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">Global Access</td>
                                    <td className="text-center px-4 py-3 text-muted-foreground">Location restricted</td>
                                    <td className="text-center px-4 py-3 text-primary font-semibold">Worldwide access</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Why People Love DeFi</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="bg-card border border-border rounded-2xl p-4 hover:scale-105 transition-transform duration-200"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-3`}>
                                    <benefit.icon className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="font-semibold mb-1 text-sm">{benefit.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Interactive Strategy Explorer */}
                <div className="mb-12">
                    <AICard>
                        <div className="bg-background p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Real DeFi Strategies</h3>
                            </div>

                            {vaultsLoading ? (
                                <div className="space-y-3">
                                    <div className="flex space-x-2 mb-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-8 bg-muted rounded-full w-20 animate-pulse"></div>
                                        ))}
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4 animate-pulse">
                                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                                        <div className="flex gap-4 mb-2">
                                            <div className="h-3 bg-muted rounded w-16"></div>
                                            <div className="h-3 bg-muted rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Strategy Tabs */}
                                    <div className="flex overflow-x-auto space-x-2 mb-4 pb-2">
                                        {strategies.map((strategy, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveStrategy(index)}
                                                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all ${activeStrategy === index
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                {strategy.title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Strategy Details */}
                                    <div className="bg-muted/30 rounded-2xl p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* Show vault avatar if available, otherwise use icon */}
                                            {strategies[activeStrategy].vaultData ? (
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage
                                                        src={
                                                            getVaultConfig(strategies[activeStrategy].vaultData.id)?.avatarUrl ||
                                                            `/${strategies[activeStrategy].vaultData.id.toLowerCase()}.png`
                                                        }
                                                        alt={strategies[activeStrategy].title}
                                                    />
                                                    <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                                        {strategies[activeStrategy].title[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="bg-primary/10 p-2 rounded-xl">
                                                    {React.createElement(strategies[activeStrategy].icon, { className: "w-5 h-5 text-primary" })}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm">{strategies[activeStrategy].title}</h4>
                                                    {!strategies[activeStrategy].supported && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                            Coming Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {strategies[activeStrategy].subtitle}
                                                </p>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="text-xs">
                                                        <span className="text-muted-foreground">APY: </span>
                                                        <span className="font-semibold text-green-600">{strategies[activeStrategy].apy}</span>
                                                    </div>
                                                    <div className="text-xs">
                                                        <span className="text-muted-foreground">Risk: </span>
                                                        <span className={`font-semibold ${strategies[activeStrategy].risk === 'Low' ? 'text-green-600' :
                                                            strategies[activeStrategy].risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {strategies[activeStrategy].risk}
                                                        </span>
                                                    </div>
                                                    {strategies[activeStrategy].vaultData && (
                                                        <div className="text-xs">
                                                            <span className="text-muted-foreground">AUM: </span>
                                                            <span className="font-semibold text-foreground">
                                                                ${strategies[activeStrategy].vaultData.deposits.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 0,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                            {strategies[activeStrategy].details}
                                        </p>
                                        <div className="flex gap-2">
                                            {strategies[activeStrategy].supported ? (
                                                strategies[activeStrategy].vaultData ? (
                                                    <Link href={`/vault/${strategies[activeStrategy].vaultData.id}`}>
                                                        <Button size="sm" className="text-xs h-8">
                                                            Invest Now
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href="/market">
                                                        <Button size="sm" className="text-xs h-8">
                                                            Try This Strategy
                                                        </Button>
                                                    </Link>
                                                )
                                            ) : (
                                                <Button size="sm" variant="outline" className="text-xs h-8" disabled>
                                                    Coming Soon
                                                </Button>
                                            )}
                                            <Link href="/market">
                                                <Button size="sm" variant="outline" className="text-xs h-8">
                                                    View All Strategies
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </AICard>
                </div>


                {/* Key Concepts */}
                <div className="mb-12">
                    <h3 className="text-xl font-semibold mb-4">DeFi Core Concepts</h3>
                    <div className="space-y-3">
                        {concepts.map((concept, index) => (
                            <div
                                key={index}
                                className="bg-card border border-border rounded-2xl p-4 hover:shadow-lg transition-all duration-200"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${concept.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <concept.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-2 text-sm">{concept.title}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {concept.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Blockchain Networks */}
                <div className="mb-12">
                    <h3 className="text-xl font-semibold mb-4">Supported Networks</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Polystream operates across multiple blockchain networks built on the Ethereum EVM. By using Layer 2 (L2) solutions like Scroll, we deliver a faster and cheaper experience while still leveraging Ethereum’s security and reliability as the foundation.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {blockchains.map((chain, index) => (
                            <div
                                key={index}
                                className={`bg-card border rounded-2xl p-4 hover:shadow-md transition-all duration-200 ${chain.isPrimary ? 'border-primary/50 bg-primary/5' : 'border-border'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-border/20">
                                        <img
                                            src={chain.icon}
                                            alt={`${chain.name} logo`}
                                            className="w-8 h-8 object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm">{chain.name}</h4>
                                            {chain.isPrimary && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {chain.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-12">
                    <h3 className="text-xl font-semibold mb-4">Common Questions</h3>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-card border border-border rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <span className="font-medium text-sm pr-3">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center mb-20">
                    <h3 className="text-lg font-semibold mb-2">Ready to Learn More?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Take your time to understand DeFi. Good financial decisions are made with knowledge, not pressure.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link href="/learn/how-it-works">
                            <Button className="w-full">
                                How Polystream Works
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/market">
                            <Button variant="outline" className="w-full">
                                Explore Investment Options
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}